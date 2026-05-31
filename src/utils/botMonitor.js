import net from 'node:net';
import { EmbedBuilder } from 'discord.js';

const DEFAULT_HOST = '45.13.236.245';
const DEFAULT_ALERT_CHANNEL_ID = '1510428394267873401';
const DEFAULT_CHECK_INTERVAL_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_REPEAT_ALERT_MS = 10 * 60_000;
const DEFAULT_RESTART_COOLDOWN_MS = 15 * 60_000;
const DEFAULT_DOWN_FAILURES_BEFORE_RESTART = 2;

let started = false;
const states = new Map();

function readMonitorTargets() {
  return [
    {
      key: 'natsumi',
      name: process.env.NATSUMI_MONITOR_NAME || '나츠미',
      host: process.env.NATSUMI_MONITOR_HOST || DEFAULT_HOST,
      port: Number(process.env.NATSUMI_MONITOR_PORT || 25769),
      pteroUrl: process.env.NATSUMI_PTERO_URL || process.env.PTERO_URL,
      pteroServerId: process.env.NATSUMI_PTERO_SERVER_ID,
      pteroApiKey: process.env.NATSUMI_PTERO_API_KEY || process.env.PTERO_API_KEY,
    },
    {
      key: 'yuzuha',
      name: process.env.YUZUHA_MONITOR_NAME || '유즈하',
      host: process.env.YUZUHA_MONITOR_HOST || DEFAULT_HOST,
      port: Number(process.env.YUZUHA_MONITOR_PORT || 25944),
      pteroUrl: process.env.YUZUHA_PTERO_URL || process.env.PTERO_URL,
      pteroServerId: process.env.YUZUHA_PTERO_SERVER_ID,
      pteroApiKey: process.env.YUZUHA_PTERO_API_KEY || process.env.PTERO_API_KEY,
    },
  ].filter((target) => Number.isInteger(target.port) && target.port > 0);
}

function getConfig() {
  return {
    alertChannelId: process.env.MONITOR_ALERT_CHANNEL_ID || DEFAULT_ALERT_CHANNEL_ID,
    checkIntervalMs: Number(process.env.MONITOR_CHECK_INTERVAL_MS || DEFAULT_CHECK_INTERVAL_MS),
    timeoutMs: Number(process.env.MONITOR_TCP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    repeatAlertMs: Number(process.env.MONITOR_REPEAT_ALERT_MS || DEFAULT_REPEAT_ALERT_MS),
    restartEnabled: String(process.env.MONITOR_AUTO_RESTART || 'true').toLowerCase() !== 'false',
    restartCooldownMs: Number(process.env.MONITOR_RESTART_COOLDOWN_MS || DEFAULT_RESTART_COOLDOWN_MS),
    downFailuresBeforeRestart: Number(
      process.env.MONITOR_DOWN_FAILURES_BEFORE_RESTART || DEFAULT_DOWN_FAILURES_BEFORE_RESTART
    ),
    sendStartupOnline: String(process.env.MONITOR_SEND_STARTUP_ONLINE || 'false').toLowerCase() === 'true',
    checkMode: String(process.env.MONITOR_CHECK_MODE || 'pterodactyl').toLowerCase(),
  };
}

function formatKoreanTime(date = new Date()) {
  return date.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
}

function normalizePanelUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

function hasPterodactylConfig(target) {
  return Boolean(target.pteroUrl && target.pteroServerId && target.pteroApiKey);
}

function checkTcpPort({ host, port }, timeoutMs) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (ok, reason = null, rawState = null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ok, reason, rawState, source: 'tcp' });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true, 'TCP_OPEN', 'open'));
    socket.once('timeout', () => finish(false, 'TIMEOUT', 'timeout'));
    socket.once('error', (error) => finish(false, error.code || error.message || 'CONNECTION_ERROR', 'error'));
    socket.connect(port, host);
  });
}

async function checkPterodactylState(target) {
  if (!hasPterodactylConfig(target)) {
    return { ok: false, reason: 'PTERODACTYL_CONFIG_MISSING', rawState: 'missing_config', source: 'pterodactyl', allowRestart: false };
  }

  const endpoint = `${normalizePanelUrl(target.pteroUrl)}/api/client/servers/${target.pteroServerId}/resources`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${target.pteroApiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return {
      ok: true,
      reason: `PTERODACTYL_CHECK_FAILED_${response.status}`,
      rawState: 'api_check_failed',
      source: 'pterodactyl',
      allowRestart: false,
    };
  }

  const data = await response.json();
  const currentState = data?.attributes?.current_state || 'unknown';

  if (currentState === 'offline') {
    return { ok: false, reason: 'PTERODACTYL_OFFLINE', rawState: currentState, source: 'pterodactyl', allowRestart: true };
  }

  if (currentState === 'running') {
    return { ok: true, reason: 'PTERODACTYL_RUNNING', rawState: currentState, source: 'pterodactyl', allowRestart: false };
  }

  return { ok: true, reason: `PTERODACTYL_${String(currentState).toUpperCase()}`, rawState: currentState, source: 'pterodactyl', allowRestart: false };
}

async function checkTargetHealth(target, config) {
  if (config.checkMode !== 'tcp' && hasPterodactylConfig(target)) {
    return checkPterodactylState(target);
  }
  return checkTcpPort(target, config.timeoutMs);
}

async function restartPterodactylServer(target) {
  if (!hasPterodactylConfig(target)) {
    return { ok: false, skipped: true, reason: 'PTERODACTYL_CONFIG_MISSING' };
  }

  const endpoint = `${normalizePanelUrl(target.pteroUrl)}/api/client/servers/${target.pteroServerId}/power`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${target.pteroApiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signal: 'restart' }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    return { ok: false, skipped: false, reason: `PTERODACTYL_${response.status}`, detail: body.slice(0, 500) };
  }

  return { ok: true, skipped: false, reason: 'RESTART_SENT' };
}

async function fetchAlertChannel(client, channelId) {
  const channel = await client.channels.fetch(channelId).catch((error) => {
    console.error(`[MONITOR] alert channel fetch failed: ${channelId}`, error);
    return null;
  });

  if (!channel?.isTextBased?.()) {
    console.error(`[MONITOR] alert channel is not text based: ${channelId}`);
    return null;
  }

  return channel;
}

function createStatusEmbed(target, status, reason = null, rawState = null, source = 'unknown') {
  const isOnline = status === 'online';

  const embed = new EmbedBuilder()
    .setColor(isOnline ? 0x34c759 : 0xff3b30)
    .setTitle(isOnline ? `✅ ${target.name} 서버 생존 확인` : `🚨 ${target.name} 다운 감지`)
    .setDescription(
      isOnline
        ? `${target.name} 서버는 현재 정상적으로 살아있어. 상태 확인 완료!`
        : `${target.name} 서버가 응답하지 않아. 자동 복구를 시도할게.`
    )
    .addFields(
      { name: '대상', value: `\`${target.name}\``, inline: true },
      { name: '주소', value: '`보안상 숨김`', inline: true },
      { name: '생존 상태', value: isOnline ? '`ALIVE / ONLINE`' : '`NO RESPONSE / DOWN`', inline: true },
      { name: '확인 방식', value: `\`${source}\``, inline: true },
      { name: '패널 상태', value: `\`${rawState || 'unknown'}\``, inline: true },
      { name: '감지 시간', value: `\`${formatKoreanTime()}\``, inline: false }
    )
    .setFooter({ text: 'YUKIHA Bot Monitor · address hidden' })
    .setTimestamp();

  if (!isOnline) {
    embed.addFields({ name: '실패 사유', value: `\`${reason || 'UNKNOWN'}\``, inline: false });
  }

  return embed;
}

function createRestartEmbed(target, result) {
  const ok = result.ok;
  const skipped = result.skipped;

  const embed = new EmbedBuilder()
    .setColor(ok ? 0xffcc00 : skipped ? 0x8e8e93 : 0xff3b30)
    .setTitle(ok ? `🔁 ${target.name} 자동 재부팅 요청 완료` : `⚠️ ${target.name} 자동 재부팅 실패`)
    .setDescription(
      ok
        ? 'Pterodactyl API로 restart 신호를 보냈어. 잠시 뒤 복구 감지를 기다릴게.'
        : skipped
          ? 'Pterodactyl API 설정이 부족해서 자동 재부팅은 건너뛰었어.'
          : 'Pterodactyl API 요청이 실패했어. 패널 URL, 서버 ID, API 키를 확인해줘.'
    )
    .addFields(
      { name: '대상', value: `\`${target.name}\``, inline: true },
      { name: '주소', value: '`보안상 숨김`', inline: true },
      { name: '결과', value: `\`${result.reason || 'UNKNOWN'}\``, inline: true },
      { name: '요청 시간', value: `\`${formatKoreanTime()}\``, inline: false }
    )
    .setFooter({ text: 'YUKIHA Auto Recovery · address hidden' })
    .setTimestamp();

  if (result.detail) {
    embed.addFields({ name: '상세', value: `\`${result.detail.replace(/`/g, '')}\``.slice(0, 1024), inline: false });
  }

  return embed;
}

async function sendEmbed(client, embed) {
  const { alertChannelId } = getConfig();
  const channel = await fetchAlertChannel(client, alertChannelId);
  if (!channel) return;
  await channel.send({ embeds: [embed] });
}

async function sendStatusAlert(client, target, status, result) {
  await sendEmbed(client, createStatusEmbed(target, status, result.reason, result.rawState, result.source));
}

async function sendRestartAlert(client, target, result) {
  await sendEmbed(client, createRestartEmbed(target, result));
}

async function maybeRestartTarget(client, target, previous, result) {
  const config = getConfig();

  if (!config.restartEnabled) return previous;
  if (result.allowRestart === false) return previous;
  if (previous.downCount < config.downFailuresBeforeRestart) return previous;
  if (Date.now() - previous.lastRestartAt < config.restartCooldownMs) return previous;

  console.log(`[MONITOR] ${target.name} auto restart requested`);

  const restartResult = await restartPterodactylServer(target).catch((error) => ({
    ok: false,
    skipped: false,
    reason: error?.message || 'PTERODACTYL_REQUEST_FAILED',
  }));

  await sendRestartAlert(client, target, restartResult);
  return { ...previous, lastRestartAt: Date.now() };
}

async function checkTarget(client, target) {
  const config = getConfig();
  const result = await checkTargetHealth(target, config);
  const currentStatus = result.ok ? 'online' : 'down';
  const previous = states.get(target.key) || {
    status: null,
    lastAlertAt: 0,
    lastRestartAt: 0,
    downCount: 0,
  };

  const nextState = {
    ...previous,
    status: currentStatus,
    downCount: currentStatus === 'down' ? previous.downCount + 1 : 0,
  };

  console.log(
    `[MONITOR] ${target.name} source=${result.source} state=${result.rawState} => ${currentStatus}` +
      (result.reason ? ` (${result.reason})` : '') +
      ` downCount=${nextState.downCount}`
  );

  if (previous.status === null) {
    if (currentStatus === 'down' || config.sendStartupOnline) {
      nextState.lastAlertAt = Date.now();
      await sendStatusAlert(client, target, currentStatus, result);
    }

    const restartedState = await maybeRestartTarget(client, target, nextState, result);
    states.set(target.key, restartedState);
    return;
  }

  if (previous.status !== currentStatus) {
    nextState.lastAlertAt = Date.now();
    await sendStatusAlert(client, target, currentStatus, result);

    const restartedState = currentStatus === 'down'
      ? await maybeRestartTarget(client, target, nextState, result)
      : nextState;

    states.set(target.key, restartedState);
    return;
  }

  if (currentStatus === 'down' && Date.now() - previous.lastAlertAt >= config.repeatAlertMs) {
    nextState.lastAlertAt = Date.now();
    await sendStatusAlert(client, target, 'down', result);
  }

  const restartedState = currentStatus === 'down'
    ? await maybeRestartTarget(client, target, nextState, result)
    : nextState;

  states.set(target.key, restartedState);
}

async function runMonitorCycle(client) {
  const targets = readMonitorTargets();
  for (const target of targets) {
    await checkTarget(client, target).catch((error) => {
      console.error(`[MONITOR] ${target.name} check failed`, error);
    });
  }
}

export function startBotMonitor(client) {
  if (started) {
    console.log('[MONITOR] already running, skip duplicated start');
    return;
  }

  started = true;
  const config = getConfig();
  const targets = readMonitorTargets();

  console.log(`[MONITOR] started: ${targets.map((target) => target.name).join(', ')}`);
  console.log(
    `[MONITOR] mode=${config.checkMode} autoRestart=${config.restartEnabled} downFailuresBeforeRestart=${config.downFailuresBeforeRestart} cooldownMs=${config.restartCooldownMs}`
  );

  setTimeout(() => {
    runMonitorCycle(client).catch((error) => console.error('[MONITOR] first cycle failed', error));
  }, 10_000);

  setInterval(() => {
    runMonitorCycle(client).catch((error) => console.error('[MONITOR] cycle failed', error));
  }, config.checkIntervalMs);
}

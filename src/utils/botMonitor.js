import net from 'node:net';
import { EmbedBuilder } from 'discord.js';

const DEFAULT_HOST = '45.13.236.245';
const DEFAULT_ALERT_CHANNEL_ID = '1510428394267873401';
const DEFAULT_CHECK_INTERVAL_MS = 60_000;
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_REPEAT_ALERT_MS = 10 * 60_000;

let started = false;
const states = new Map();

function readMonitorTargets() {
  return [
    {
      key: 'natsumi',
      name: process.env.NATSUMI_MONITOR_NAME || '나츠미',
      host: process.env.NATSUMI_MONITOR_HOST || DEFAULT_HOST,
      port: Number(process.env.NATSUMI_MONITOR_PORT || 25769),
    },
    {
      key: 'yuzuha',
      name: process.env.YUZUHA_MONITOR_NAME || '유즈하',
      host: process.env.YUZUHA_MONITOR_HOST || DEFAULT_HOST,
      port: Number(process.env.YUZUHA_MONITOR_PORT || 25944),
    },
  ].filter((target) => Number.isInteger(target.port) && target.port > 0);
}

function getConfig() {
  return {
    alertChannelId: process.env.MONITOR_ALERT_CHANNEL_ID || DEFAULT_ALERT_CHANNEL_ID,
    checkIntervalMs: Number(process.env.MONITOR_CHECK_INTERVAL_MS || DEFAULT_CHECK_INTERVAL_MS),
    timeoutMs: Number(process.env.MONITOR_TCP_TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
    repeatAlertMs: Number(process.env.MONITOR_REPEAT_ALERT_MS || DEFAULT_REPEAT_ALERT_MS),
  };
}

function formatKoreanTime(date = new Date()) {
  return date.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour12: false,
  });
}

function checkTcpPort({ host, port }, timeoutMs) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (ok, reason = null) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ok, reason });
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false, 'TIMEOUT'));
    socket.once('error', (error) => finish(false, error.code || error.message || 'CONNECTION_ERROR'));
    socket.connect(port, host);
  });
}

async function fetchAlertChannel(client, channelId) {
  const channel = await client.channels.fetch(channelId).catch((error) => {
    console.error(`[MONITOR] 알림 채널 fetch 실패: ${channelId}`, error);
    return null;
  });

  if (!channel?.isTextBased?.()) {
    console.error(`[MONITOR] 알림 채널이 텍스트 채널이 아닙니다: ${channelId}`);
    return null;
  }

  return channel;
}

function createStatusEmbed(target, status, reason = null) {
  const isOnline = status === 'online';

  const embed = new EmbedBuilder()
    .setColor(isOnline ? 0x34c759 : 0xff3b30)
    .setTitle(isOnline ? `✅ ${target.name} 복구 감지` : `🚨 ${target.name} 다운 감지`)
    .setDescription(
      isOnline
        ? `${target.name} 서버가 다시 응답하기 시작했어.`
        : `${target.name} 서버가 응답하지 않아. 확인이 필요해.`
    )
    .addFields(
      { name: '대상', value: `\`${target.name}\``, inline: true },
      { name: '주소', value: `\`${target.host}:${target.port}\``, inline: true },
      { name: '상태', value: isOnline ? '`ONLINE`' : '`DOWN`', inline: true },
      { name: '감지 시간', value: `\`${formatKoreanTime()}\``, inline: false }
    )
    .setFooter({ text: 'YUKIHA Bot Monitor' })
    .setTimestamp();

  if (!isOnline) {
    embed.addFields({ name: '실패 사유', value: `\`${reason || 'UNKNOWN'}\``, inline: false });
  }

  return embed;
}

async function sendStatusAlert(client, target, status, reason) {
  const { alertChannelId } = getConfig();
  const channel = await fetchAlertChannel(client, alertChannelId);
  if (!channel) return;

  await channel.send({ embeds: [createStatusEmbed(target, status, reason)] });
}

async function checkTarget(client, target) {
  const config = getConfig();
  const result = await checkTcpPort(target, config.timeoutMs);
  const currentStatus = result.ok ? 'online' : 'down';
  const previous = states.get(target.key) || {
    status: null,
    lastAlertAt: 0,
  };

  console.log(
    `[MONITOR] ${target.name} ${target.host}:${target.port} => ${currentStatus}` +
      (result.reason ? ` (${result.reason})` : '')
  );

  if (previous.status === null) {
    states.set(target.key, {
      status: currentStatus,
      lastAlertAt: currentStatus === 'down' ? Date.now() : 0,
    });

    if (currentStatus === 'down') {
      await sendStatusAlert(client, target, 'down', result.reason);
    }
    return;
  }

  if (previous.status !== currentStatus) {
    states.set(target.key, {
      status: currentStatus,
      lastAlertAt: Date.now(),
    });
    await sendStatusAlert(client, target, currentStatus, result.reason);
    return;
  }

  if (currentStatus === 'down' && Date.now() - previous.lastAlertAt >= config.repeatAlertMs) {
    states.set(target.key, {
      status: currentStatus,
      lastAlertAt: Date.now(),
    });
    await sendStatusAlert(client, target, 'down', result.reason);
  }
}

async function runMonitorCycle(client) {
  const targets = readMonitorTargets();

  for (const target of targets) {
    await checkTarget(client, target).catch((error) => {
      console.error(`[MONITOR] ${target.name} 검사 실패`, error);
    });
  }
}

export function startBotMonitor(client) {
  if (started) {
    console.log('[MONITOR] 이미 감시가 실행 중이라 중복 시작을 건너뜁니다.');
    return;
  }

  started = true;
  const config = getConfig();
  const targets = readMonitorTargets();

  console.log(
    `[MONITOR] 봇 감시 시작: ${targets.map((target) => `${target.name}(${target.host}:${target.port})`).join(', ')}`
  );

  setTimeout(() => {
    runMonitorCycle(client).catch((error) => console.error('[MONITOR] 첫 감시 실패', error));
  }, 10_000);

  setInterval(() => {
    runMonitorCycle(client).catch((error) => console.error('[MONITOR] 감시 실패', error));
  }, config.checkIntervalMs);
}

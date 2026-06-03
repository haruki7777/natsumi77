function normalizePanelUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

export function getPowerTargets() {
  return {
    natsumi: {
      key: 'natsumi',
      name: process.env.NATSUMI_MONITOR_NAME || '나츠미',
      pteroUrl: process.env.NATSUMI_PTERO_URL || process.env.PTERO_URL,
      pteroServerId: process.env.NATSUMI_PTERO_SERVER_ID,
      pteroApiKey: process.env.NATSUMI_PTERO_API_KEY || process.env.PTERO_API_KEY,
    },
    yuzuha: {
      key: 'yuzuha',
      name: process.env.YUZUHA_MONITOR_NAME || '유즈하',
      pteroUrl: process.env.YUZUHA_PTERO_URL || process.env.PTERO_URL,
      pteroServerId: process.env.YUZUHA_PTERO_SERVER_ID,
      pteroApiKey: process.env.YUZUHA_PTERO_API_KEY || process.env.PTERO_API_KEY,
    },
  };
}

export function hasPowerConfig(target) {
  return Boolean(target?.pteroUrl && target?.pteroServerId && target?.pteroApiKey);
}

export async function getPterodactylState(target) {
  if (!hasPowerConfig(target)) {
    return {
      ok: false,
      state: 'missing_config',
      reason: 'PTERODACTYL_CONFIG_MISSING',
    };
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
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      state: 'api_error',
      reason: `PTERODACTYL_${response.status}`,
      detail: text.slice(0, 500),
    };
  }

  const json = await response.json();
  return {
    ok: true,
    state: json?.attributes?.current_state || 'unknown',
    reason: 'OK',
  };
}

export async function sendPterodactylPowerSignal(target, signal) {
  if (!hasPowerConfig(target)) {
    return {
      ok: false,
      skipped: true,
      reason: 'PTERODACTYL_CONFIG_MISSING',
    };
  }

  const endpoint = `${normalizePanelUrl(target.pteroUrl)}/api/client/servers/${target.pteroServerId}/power`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${target.pteroApiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ signal }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      skipped: false,
      reason: `PTERODACTYL_${response.status}`,
      detail: text.slice(0, 500),
    };
  }

  return {
    ok: true,
    skipped: false,
    reason: `${String(signal).toUpperCase()}_SENT`,
  };
}

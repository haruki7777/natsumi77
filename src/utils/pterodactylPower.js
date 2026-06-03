function normalizePanelUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function describeNetworkError(error) {
  const code = error?.cause?.code || error?.code || error?.name;

  if (code === 'UND_ERR_CONNECT_TIMEOUT' || code === 'ETIMEDOUT' || code === 'AbortError') {
    return { reason: 'PANEL_TIMEOUT', detail: error?.cause?.message || error?.message || 'Panel request timed out' };
  }

  if (code === 'ENOTFOUND') {
    return { reason: 'PANEL_DNS_FAILED', detail: error?.cause?.message || error?.message || 'Panel DNS lookup failed' };
  }

  if (code === 'ECONNREFUSED') {
    return { reason: 'PANEL_CONNECTION_REFUSED', detail: error?.cause?.message || error?.message || 'Panel refused connection' };
  }

  return { reason: 'PANEL_FETCH_FAILED', detail: error?.cause?.message || error?.message || String(error || 'Unknown network error') };
}

async function safeFetch(url, options = {}, config = {}) {
  const timeoutMs = Number(config.timeoutMs || process.env.PTERO_API_TIMEOUT_MS || 25_000);
  const retries = Number(config.retries ?? process.env.PTERO_API_RETRIES ?? 2);
  const retryDelayMs = Number(config.retryDelayMs || process.env.PTERO_API_RETRY_DELAY_MS || 2_000);
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(url, { ...options, signal: controller.signal });
    } catch (error) {
      lastError = error;
      if (attempt < retries) await wait(retryDelayMs);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError;
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
      allowPowerAction: false,
    };
  }

  const endpoint = `${normalizePanelUrl(target.pteroUrl)}/api/client/servers/${target.pteroServerId}/resources`;

  let response;
  try {
    response = await safeFetch(endpoint, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${target.pteroApiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const described = describeNetworkError(error);
    return {
      ok: false,
      state: 'unreachable',
      reason: described.reason,
      detail: described.detail.slice(0, 500),
      allowPowerAction: false,
    };
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    return {
      ok: false,
      state: 'api_error',
      reason: `PTERODACTYL_${response.status}`,
      detail: text.slice(0, 500),
      allowPowerAction: false,
    };
  }

  const json = await response.json().catch(() => null);
  return {
    ok: true,
    state: json?.attributes?.current_state || 'unknown',
    reason: 'OK',
    allowPowerAction: true,
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

  let response;
  try {
    response = await safeFetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${target.pteroApiKey}`,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ signal }),
    });
  } catch (error) {
    const described = describeNetworkError(error);
    return {
      ok: false,
      skipped: true,
      reason: described.reason,
      detail: described.detail.slice(0, 500),
    };
  }

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

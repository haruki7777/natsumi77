import 'dotenv/config';

const panelUrl = process.env.PTERO_URL || process.env.NATSUMI_PTERO_URL || process.env.YUZUHA_PTERO_URL;
const apiKey = process.env.PTERO_API_KEY || process.env.NATSUMI_PTERO_API_KEY || process.env.YUZUHA_PTERO_API_KEY;

function normalizePanelUrl(url) {
  return String(url || '').replace(/\/+$/, '');
}

function maskSecret(secret) {
  if (!secret || secret.length < 12) return '(missing)';
  return `${secret.slice(0, 7)}...${secret.slice(-4)}`;
}

if (!panelUrl || !apiKey) {
  console.error('[PTERO CHECK] Missing env values.');
  console.error('Required: PTERO_URL and PTERO_API_KEY');
  console.error('Example:');
  console.error('PTERO_URL=https://panel.example.com');
  console.error('PTERO_API_KEY=ptlc_xxxxxxxxxxxxxxxxx');
  process.exit(1);
}

const endpoint = `${normalizePanelUrl(panelUrl)}/api/client`;

console.log(`[PTERO CHECK] Panel: ${normalizePanelUrl(panelUrl)}`);
console.log(`[PTERO CHECK] API key: ${maskSecret(apiKey)}`);
console.log('[PTERO CHECK] Fetching accessible servers...');

const response = await fetch(endpoint, {
  method: 'GET',
  headers: {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

if (!response.ok) {
  const text = await response.text().catch(() => '');
  console.error(`[PTERO CHECK] Failed: HTTP ${response.status}`);
  console.error(text.slice(0, 1000));
  process.exit(1);
}

const json = await response.json();
const servers = Array.isArray(json.data) ? json.data : [];

if (!servers.length) {
  console.log('[PTERO CHECK] No accessible servers found for this API key.');
  process.exit(0);
}

console.log(`[PTERO CHECK] Found ${servers.length} server(s).`);
console.log('');

for (const item of servers) {
  const attr = item.attributes || {};
  console.log('----------------------------------------');
  console.log(`Name       : ${attr.name || '(unknown)'}`);
  console.log(`Identifier : ${attr.identifier || '(unknown)'}`);
  console.log(`UUID       : ${attr.uuid || '(unknown)'}`);
  console.log(`Node       : ${attr.node || '(unknown)'}`);
  console.log(`Suspended  : ${attr.is_suspended ?? '(unknown)'}`);
}

console.log('----------------------------------------');
console.log('Use Identifier for NATSUMI_PTERO_SERVER_ID / YUZUHA_PTERO_SERVER_ID.');

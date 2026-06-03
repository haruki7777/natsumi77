import { AttachmentBuilder } from 'discord.js';
import sharp from 'sharp';

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function trimText(value, max = 70) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function baseCard({ title, subtitle, rightTop = '', rightBottom = '', body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="520" viewBox="0 0 1200 520" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fbfeff"/>
      <stop offset="50%" stop-color="#eef9ff"/>
      <stop offset="100%" stop-color="#e6f5ff"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="14" flood-color="#6ecbff" flood-opacity="0.18"/>
    </filter>
    <style>
      .font { font-family: Arial, sans-serif; }
      .title { font-size: 34px; font-weight: 800; fill: #102033; }
      .subtitle { font-size: 22px; font-weight: 650; fill: #557089; }
      .small { font-size: 20px; font-weight: 650; fill: #61768a; }
      .label { font-size: 24px; font-weight: 800; fill: #30445a; }
      .sub { font-size: 22px; font-weight: 650; fill: #70869a; }
    </style>
  </defs>

  <rect width="1200" height="520" fill="url(#bg)"/>
  <rect x="28" y="28" width="1144" height="464" rx="28" fill="#ffffff" stroke="#8bd5ff" stroke-width="3" filter="url(#shadow)"/>
  <rect x="54" y="54" width="1092" height="142" rx="24" fill="#eaf8ff" stroke="#6ecbff" stroke-width="2"/>

  <text class="font title" x="82" y="111">◇ ${escapeXml(title)}</text>
  <text class="font subtitle" x="82" y="154">${escapeXml(subtitle)}</text>
  ${rightTop ? `<text class="font small" x="930" y="96">${escapeXml(trimText(rightTop, 22))}</text>` : ''}
  ${rightBottom ? `<text class="font small" x="795" y="132" fill="#00a6d6">${escapeXml(trimText(rightBottom, 32))}</text>` : ''}

  ${body}
</svg>`;
}

async function makePngAttachment(svg, name) {
  const png = await sharp(Buffer.from(svg, 'utf8'), {
    density: 144,
    limitInputPixels: 4_000_000,
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  return new AttachmentBuilder(png, { name });
}

function statBox({ x, label, value, sub, color }) {
  return `
  <rect x="${x}" y="235" width="320" height="200" rx="22" fill="#ffffff" stroke="#b9e7ff" stroke-width="2"/>
  <circle cx="${x + 42}" cy="279" r="10" fill="${color}" opacity="0.9"/>
  <text class="font label" x="${x + 64}" y="288">${escapeXml(label)}</text>
  <text class="font" x="${x + 32}" y="354" font-size="42" font-weight="900" fill="${color}">${escapeXml(value)}</text>
  <text class="font sub" x="${x + 32}" y="396">${escapeXml(sub)}</text>`;
}

export async function createPingCard({ clientPing, apiPing, guildCount, userTag }) {
  const now = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
  const body = [
    statBox({ x: 70, label: 'Discord Ping', value: `${clientPing}ms`, sub: 'WebSocket', color: '#ff9f1a' }),
    statBox({ x: 430, label: 'API Response', value: `${apiPing}ms`, sub: 'Command', color: '#00a878' }),
    statBox({ x: 790, label: 'Guilds', value: `${guildCount}`, sub: 'Connected', color: '#2374ff' }),
  ].join('\n');

  const svg = baseCard({
    title: 'YUKIHA Network Status',
    subtitle: 'Connection and response speed check complete',
    rightTop: userTag || 'YUKIHA',
    rightBottom: now,
    body,
  });

  return makePngAttachment(svg, 'yukiha-ping.png');
}

export async function createWelcomeCard({ member, guild, title, description }) {
  const displayName = member?.displayName || member?.user?.username || 'New User';
  const memberCount = guild?.memberCount || 0;
  const safeTitle = title || `Welcome, ${displayName}`;
  const safeDesc = description || `Welcome to ${guild?.name || 'the server'}.`;

  const body = `
  <rect x="70" y="225" width="1060" height="210" rx="24" fill="#ffffff" stroke="#b9e7ff" stroke-width="2"/>
  <text class="font" x="105" y="292" font-size="34" font-weight="900" fill="#102033">${escapeXml(trimText(safeTitle, 42))}</text>
  <text class="font" x="105" y="346" font-size="24" font-weight="700" fill="#557089">${escapeXml(trimText(safeDesc, 66))}</text>
  <text class="font" x="105" y="397" font-size="23" font-weight="800" fill="#00a6d6">User: ${escapeXml(trimText(displayName, 24))}</text>
  <text class="font" x="780" y="397" font-size="23" font-weight="800" fill="#00a878">Members: ${escapeXml(memberCount)}</text>`;

  const svg = baseCard({
    title: 'YUKIHA Welcome Card',
    subtitle: 'A new member has arrived',
    body,
  });

  return makePngAttachment(svg, 'yukiha-welcome.png');
}

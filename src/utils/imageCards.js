import { AttachmentBuilder } from 'discord.js';
import { createCanvas, GlobalFonts } from '@napi-rs/canvas';

let fontReady = false;

function setupFonts() {
  if (fontReady) return;
  fontReady = true;

  const candidates = [
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansKR-Regular.otf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
  ];

  for (const path of candidates) {
    try {
      GlobalFonts.registerFromPath(path, 'YukihaKR');
      console.log(`[CARDS] font loaded: ${path}`);
      return;
    } catch {
      // Ignore missing fonts. Canvas will use its fallback font.
    }
  }

  console.warn('[CARDS] Korean font file was not found. Fallback font will be used.');
}

function trimText(value, max = 900) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function wrapText(ctx, text, maxWidth, maxLines = 4) {
  const source = String(text ?? '').replace(/\s+/g, ' ').trim();
  const chars = [...source];
  const lines = [];
  let line = '';

  for (const char of chars) {
    const next = line + char;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
      if (lines.length >= maxLines) break;
    } else {
      line = next;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && chars.join('').length > lines.join('').length) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, -1)}…`;
  }

  return lines;
}

function roundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function makePngAttachment(canvas, name) {
  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name });
}

function drawCardBase(ctx, width, height, accent = '#9ddcff') {
  const bg = ctx.createLinearGradient(0, 0, width, height);
  bg.addColorStop(0, '#fbfeff');
  bg.addColorStop(0.55, '#f4fbff');
  bg.addColorStop(1, '#eef8ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.shadowColor = 'rgba(80, 170, 220, 0.20)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  roundedRect(ctx, 24, 24, width - 48, height - 48, 26);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();

  roundedRect(ctx, 24, 24, width - 48, height - 48, 26);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 3;
  ctx.stroke();
}

export function buildPingCardFields({ clientPing, apiPing, guildCount }) {
  return [
    { name: '🟡 디스코드 핑', value: `\`${clientPing}ms\``, inline: true },
    { name: '🟢 응답 속도', value: `\`${apiPing}ms\``, inline: true },
    { name: '🔵 서버 수', value: `\`${guildCount}\``, inline: true },
  ];
}

export function buildWelcomeCardFields({ member, guild }) {
  const displayName = member?.displayName || member?.user?.username || '새로운 유저';
  const memberCount = guild?.memberCount || 0;

  return [
    { name: '👤 유저', value: `${member?.user || displayName}`, inline: true },
    { name: '🏷️ 닉네임', value: `\`${displayName}\``, inline: true },
    { name: '👥 멤버 수', value: `\`${memberCount}명\``, inline: true },
  ];
}

export function buildWelcomeCardDescription({ cardText }) {
  const safeText = trimText(cardText || '새로운 멤버가 서버에 도착했어요.', 900);
  return [
    '╭━━━━━━━━━━━━━━━━━━━━╮',
    '　　🌸 **환영 카드** 🌸',
    '╰━━━━━━━━━━━━━━━━━━━━╯',
    '',
    safeText,
  ].join('\n');
}

export async function createPingCard({ clientPing, apiPing, guildCount, userTag }) {
  setupFonts();

  const canvas = createCanvas(900, 360);
  const ctx = canvas.getContext('2d');
  drawCardBase(ctx, 900, 360, '#9ddcff');

  ctx.fillStyle = '#102033';
  ctx.font = 'bold 32px YukihaKR, sans-serif';
  ctx.fillText('❄️ 유키하 네트워크 상태', 54, 78);

  ctx.fillStyle = '#61768a';
  ctx.font = '18px YukihaKR, sans-serif';
  ctx.fillText(`요청자: ${trimText(userTag || 'Unknown', 28)}`, 58, 112);

  const stats = [
    ['디스코드 핑', `${clientPing}ms`, '#ff9f1a'],
    ['응답 속도', `${apiPing}ms`, '#00a878'],
    ['서버 수', `${guildCount}`, '#2374ff'],
  ];

  for (let i = 0; i < stats.length; i += 1) {
    const [label, value, color] = stats[i];
    const x = 54 + i * 278;
    roundedRect(ctx, x, 155, 250, 132, 20);
    ctx.fillStyle = '#f7fcff';
    ctx.fill();
    ctx.strokeStyle = '#d7f0ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.font = 'bold 34px YukihaKR, sans-serif';
    ctx.fillText(value, x + 24, 220);

    ctx.fillStyle = '#50677d';
    ctx.font = 'bold 19px YukihaKR, sans-serif';
    ctx.fillText(label, x + 24, 258);
  }

  return makePngAttachment(canvas, 'yukiha-ping.png');
}

export async function createWelcomeCard({ member, guild, cardText }) {
  setupFonts();

  const displayName = member?.displayName || member?.user?.username || '새로운 유저';
  const memberCount = guild?.memberCount || 0;

  const canvas = createCanvas(900, 360);
  const ctx = canvas.getContext('2d');
  drawCardBase(ctx, 900, 360, '#ffb8d7');

  ctx.fillStyle = '#261421';
  ctx.font = 'bold 33px YukihaKR, sans-serif';
  ctx.fillText('🌸 유키하 환영 카드', 54, 78);

  ctx.fillStyle = '#755267';
  ctx.font = '18px YukihaKR, sans-serif';
  ctx.fillText(`닉네임: ${trimText(displayName, 28)}  ·  멤버 수: ${memberCount}명`, 58, 112);

  roundedRect(ctx, 54, 148, 792, 150, 22);
  ctx.fillStyle = '#fff8fb';
  ctx.fill();
  ctx.strokeStyle = '#ffd1e5';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#2a1723';
  ctx.font = 'bold 25px YukihaKR, sans-serif';
  const lines = wrapText(ctx, cardText || `${displayName}님, ${guild?.name || '서버'}에 온 걸 환영해요!`, 730, 3);
  lines.forEach((line, index) => {
    ctx.fillText(line, 88, 207 + index * 36);
  });

  ctx.fillStyle = '#9a5d78';
  ctx.font = '16px YukihaKR, sans-serif';
  ctx.fillText('YUKIHA Welcome System · Korean Canvas Card', 58, 326);

  return makePngAttachment(canvas, 'yukiha-welcome.png');
}

import { AttachmentBuilder } from 'discord.js';

async function loadCanvas() {
  try {
    const mod = await import('@napi-rs/canvas');
    return mod.createCanvas;
  } catch {
    return null;
  }
}

function escapeXml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function makeSvgAttachment(name, title, subtitle, rows) {
  const rowSvg = rows
    .map((row, index) => {
      const x = 70 + index * 360;
      return `
      <rect x="${x}" y="230" width="320" height="200" rx="22" fill="rgba(10,15,32,0.72)" stroke="#1f2f5b" />
      <text x="${x + 32}" y="285" font-size="24" font-weight="600" fill="#7f99b7">${escapeXml(row.label)}</text>
      <text x="${x + 32}" y="350" font-size="42" font-weight="900" fill="${row.color}">${escapeXml(row.value)}</text>
      <text x="${x + 32}" y="392" font-size="21" font-weight="500" fill="#596b88">${escapeXml(row.sub)}</text>`;
    })
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="520" viewBox="0 0 1200 520">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#050814"/>
      <stop offset="0.55" stop-color="#0b1024"/>
      <stop offset="1" stop-color="#101a35"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="520" fill="url(#bg)"/>
  <rect x="28" y="28" width="1144" height="464" rx="24" fill="none" stroke="#173c7a" stroke-width="2"/>
  <rect x="50" y="50" width="1100" height="140" rx="22" fill="rgba(13,20,42,0.88)" stroke="#164878"/>
  <text x="80" y="105" font-family="sans-serif" font-size="34" font-weight="800" fill="#e8fbff">◇ ${escapeXml(title)}</text>
  <text x="80" y="150" font-family="sans-serif" font-size="21" font-weight="500" fill="#7f99b7">${escapeXml(subtitle)}</text>
  ${rowSvg}
  </svg>`;

  return new AttachmentBuilder(Buffer.from(svg, 'utf-8'), { name });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, value, x, y, size = 26, color = '#eaf8ff', weight = '700') {
  ctx.font = `${weight} ${size}px sans-serif`;
  ctx.fillStyle = color;
  ctx.fillText(value, x, y);
}

function drawBase(createCanvas, title, subtitle) {
  const canvas = createCanvas(1200, 520);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 1200, 520);
  bg.addColorStop(0, '#050814');
  bg.addColorStop(0.55, '#0b1024');
  bg.addColorStop(1, '#101a35');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 520);

  ctx.strokeStyle = '#173c7a';
  ctx.lineWidth = 2;
  roundRect(ctx, 28, 28, 1144, 464, 24);
  ctx.stroke();

  ctx.fillStyle = 'rgba(13, 20, 42, 0.88)';
  roundRect(ctx, 50, 50, 1100, 140, 22);
  ctx.fill();
  ctx.strokeStyle = '#164878';
  ctx.stroke();

  text(ctx, `◇ ${title}`, 80, 105, 34, '#e8fbff', '800');
  text(ctx, subtitle, 80, 150, 21, '#7f99b7', '500');

  return { canvas, ctx };
}

export async function createPingCard({ clientPing, apiPing, guildCount, userTag }) {
  const rows = [
    { label: 'Discord 핑', value: `${clientPing}ms`, sub: 'WebSocket', color: '#f7e65d' },
    { label: 'API 응답', value: `${apiPing}ms`, sub: 'Interaction', color: '#6df5b5' },
    { label: '서버 수', value: `${guildCount}`, sub: 'Guilds', color: '#7eb6ff' },
  ];

  const createCanvas = await loadCanvas();
  if (!createCanvas) {
    return makeSvgAttachment('yukiha-ping.svg', '유키하 네트워크 상태', '현재 연결 상태와 응답 속도를 확인했어요', rows);
  }

  const { canvas, ctx } = drawBase(createCanvas, '유키하 네트워크 상태', '현재 연결 상태와 응답 속도를 확인했어요');

  const now = new Date().toLocaleString('ko-KR');
  text(ctx, userTag || 'YUKIHA', 945, 92, 18, '#44506c', '600');
  text(ctx, now, 795, 130, 20, '#39d7ff', '600');

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const x = 70 + i * 360;
    ctx.fillStyle = 'rgba(10, 15, 32, 0.72)';
    roundRect(ctx, x, 230, 320, 200, 22);
    ctx.fill();
    ctx.strokeStyle = '#1f2f5b';
    ctx.stroke();

    text(ctx, row.label, x + 32, 285, 24, '#7f99b7', '600');
    text(ctx, row.value, x + 32, 350, 42, row.color, '900');
    text(ctx, row.sub, x + 32, 392, 21, '#596b88', '500');
  }

  return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'yukiha-ping.png' });
}

export async function createWelcomeCard({ member, guild, title, description }) {
  const displayName = member?.displayName || member?.user?.username || '새로운 유저';
  const memberCount = guild?.memberCount || 0;
  const safeTitle = title || `어서 와요, ${displayName}님 ❄️`;
  const safeDesc = description || `${guild.name}에 온 걸 환영해요. 유키하가 지켜보고 있을게요.`;

  const createCanvas = await loadCanvas();
  if (!createCanvas) {
    return makeSvgAttachment('yukiha-welcome.svg', '유키하 환영 인사', '새로운 멤버가 서버에 도착했어요', [
      { label: '환영 대상', value: displayName.slice(0, 12), sub: safeTitle.slice(0, 28), color: '#65e6ff' },
      { label: '서버 멤버', value: `${memberCount}명`, sub: guild?.name || 'Server', color: '#6df5b5' },
      { label: '메시지', value: 'WELCOME', sub: safeDesc.slice(0, 28), color: '#f7e65d' },
    ]);
  }

  const { canvas, ctx } = drawBase(createCanvas, '유키하 환영 인사', '새로운 멤버가 서버에 도착했어요');

  ctx.fillStyle = 'rgba(10, 15, 32, 0.72)';
  roundRect(ctx, 70, 225, 1060, 210, 24);
  ctx.fill();
  ctx.strokeStyle = '#1f2f5b';
  ctx.stroke();

  text(ctx, safeTitle, 105, 292, 34, '#e8fbff', '900');
  text(ctx, safeDesc.slice(0, 52), 105, 346, 24, '#9fb4d4', '600');
  text(ctx, `닉네임: ${displayName}`, 105, 395, 22, '#65e6ff', '700');
  text(ctx, `서버 멤버: ${memberCount}명`, 780, 395, 22, '#6df5b5', '700');

  return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'yukiha-welcome.png' });
}

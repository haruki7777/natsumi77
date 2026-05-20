import { AttachmentBuilder } from 'discord.js';

async function loadCanvas() {
  try {
    const mod = await import('@napi-rs/canvas');
    return mod.createCanvas;
  } catch (error) {
    throw new Error('이미지 카드용 패키지가 설치되지 않았습니다. Dishost 콘솔에서 npm install 을 실행한 뒤 재시작하세요.');
  }
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
  const createCanvas = await loadCanvas();
  const { canvas, ctx } = drawBase(createCanvas, '유키하 네트워크 상태', '현재 연결 상태와 응답 속도를 확인했어요');

  const now = new Date().toLocaleString('ko-KR');
  text(ctx, userTag || 'YUKIHA', 945, 92, 18, '#44506c', '600');
  text(ctx, now, 795, 130, 20, '#39d7ff', '600');

  const rows = [
    { label: 'Discord 핑', value: `${clientPing}ms`, sub: 'WebSocket', color: '#f7e65d' },
    { label: 'API 응답', value: `${apiPing}ms`, sub: 'Interaction', color: '#6df5b5' },
    { label: '서버 수', value: `${guildCount}`, sub: 'Guilds', color: '#7eb6ff' },
  ];

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
  const createCanvas = await loadCanvas();
  const displayName = member?.displayName || member?.user?.username || '새로운 유저';
  const memberCount = guild?.memberCount || 0;
  const safeTitle = title || `어서 와요, ${displayName}님 ❄️`;
  const safeDesc = description || `${guild.name}에 온 걸 환영해요. 유키하가 지켜보고 있을게요.`;

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

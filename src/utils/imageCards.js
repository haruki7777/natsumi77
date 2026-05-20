import { AttachmentBuilder } from 'discord.js';
import { createCanvas } from '@napi-rs/canvas';

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

function drawBase(title, subtitle) {
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

export function createPingCard({ clientPing, apiPing, guildCount, userTag }) {
  const { canvas, ctx } = drawBase('유키하 네트워크 상태', '현재 연결 상태와 응답 속도를 확인했어요');

  const now = new Date().toLocaleString('ko-KR');
  text(ctx, userTag || 'YUKIHA', 945, 92, 18, '#44506c', '600');
  text(ctx, now, 795, 130, 20, '#39d7ff', '600');

  const cards = [
    ['Discord 핑', `${clientPing}ms`, 'WebSocket', '#f7e65d'],
    ['API 응답', `${apiPing}ms`, 'Interaction', '#6df5b5'],
    ['서버 수', `${guildCount}`, 'Guilds', '#7eb6ff'],
  ];

  for (let i = 0; i < cards.length; i += 1) {
    const [label, value, sub, color] = cards[i];
    const x = 70 + i * 360;
    ctx.fillStyle = 'rgba(10, 15, 32, 0.72)';
    roundRect(ctx, x, 230, 320, 200, 22);
    ctx.fill();
    ctx.strokeStyle = '#1f2f5b';
    ctx.stroke();

    text(ctx, label, x + 32, 285, 24, '#7f99b7', '600');
    text(ctx, value, x + 32, 350, 42, color, '900');
    text(ctx, sub, x + 32, 392, 21, '#596b88', '500');
  }

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'yukiha-ping.png' });
}

export function createWelcomeCard({ member, guild, title, description }) {
  const { canvas, ctx } = drawBase('유키하 환영 인사', '새로운 멤버가 서버에 도착했어요');

  const displayName = member?.displayName || member?.user?.username || '새로운 유저';
  const memberCount = guild?.memberCount || 0;

  ctx.fillStyle = 'rgba(10, 15, 32, 0.72)';
  roundRect(ctx, 70, 225, 1060, 210, 24);
  ctx.fill();
  ctx.strokeStyle = '#1f2f5b';
  ctx.stroke();

  text(ctx, title || `어서 와요, ${displayName}님 ❄️`, 105, 292, 34, '#e8fbff', '900');
  const desc = description || `${guild.name}에 온 걸 환영해요. 유키하가 지켜보고 있을게요.`;
  text(ctx, desc.slice(0, 52), 105, 346, 24, '#9fb4d4', '600');
  text(ctx, `닉네임: ${displayName}`, 105, 395, 22, '#65e6ff', '700');
  text(ctx, `서버 멤버: ${memberCount}명`, 780, 395, 22, '#6df5b5', '700');

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'yukiha-welcome.png' });
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AttachmentBuilder } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let fontRegistered = false;

const FONT_FAMILY = 'Dalmoori';
const FONT_STACK = `'${FONT_FAMILY}', 'Noto Sans KR', 'Noto Sans CJK KR', 'Malgun Gothic', sans-serif`;

async function loadCanvas() {
  try {
    const mod = await import('@napi-rs/canvas');
    registerDalmooriFont(mod.GlobalFonts);
    return mod.createCanvas;
  } catch (error) {
    throw new Error('이미지 카드용 패키지가 설치되지 않았습니다. Dishost 콘솔에서 npm install 을 실행한 뒤 재시작하세요.');
  }
}

function registerDalmooriFont(GlobalFonts) {
  if (fontRegistered || !GlobalFonts) return;

  const candidates = [
    path.resolve(__dirname, '../assets/fonts/dalmoori.ttf'),
    path.resolve(__dirname, '../assets/fonts/dalmoori.woff2'),
    path.resolve(process.cwd(), 'assets/fonts/dalmoori.ttf'),
    path.resolve(process.cwd(), 'assets/fonts/dalmoori.woff2'),
    path.resolve(process.cwd(), 'dalmoori.ttf'),
    path.resolve(process.cwd(), 'dalmoori.woff2'),
  ];

  const fontPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!fontPath) {
    console.warn('[FONT] Dalmoori 폰트를 찾지 못했습니다. assets/fonts/dalmoori.ttf 위치에 업로드하면 한글 깨짐이 해결됩니다.');
    fontRegistered = true;
    return;
  }

  const ok = GlobalFonts.registerFromPath(fontPath, FONT_FAMILY);
  console.log(ok ? `[FONT] Dalmoori 폰트 등록 완료: ${fontPath}` : `[FONT] Dalmoori 폰트 등록 실패: ${fontPath}`);
  fontRegistered = true;
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

function text(ctx, value, x, y, size = 26, color = '#172033', weight = '700', maxWidth = undefined) {
  ctx.font = `${weight} ${size}px ${FONT_STACK}`;
  ctx.fillStyle = color;
  ctx.fillText(String(value), x, y, maxWidth);
}

function drawBase(createCanvas, title, subtitle) {
  const canvas = createCanvas(1200, 520);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 1200, 520);
  bg.addColorStop(0, '#f9fdff');
  bg.addColorStop(0.5, '#eef8ff');
  bg.addColorStop(1, '#e8f4ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 520);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  roundRect(ctx, 28, 28, 1144, 464, 28);
  ctx.fill();
  ctx.strokeStyle = '#91d7ff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = 'rgba(232, 248, 255, 0.96)';
  roundRect(ctx, 54, 54, 1092, 142, 24);
  ctx.fill();
  ctx.strokeStyle = '#72cfff';
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, `◇ ${title}`, 82, 111, 34, '#102033', '800', 620);
  text(ctx, subtitle, 82, 154, 22, '#557089', '600', 650);

  return { canvas, ctx };
}

export async function createPingCard({ clientPing, apiPing, guildCount, userTag }) {
  const createCanvas = await loadCanvas();
  const { canvas, ctx } = drawBase(createCanvas, '유키하 네트워크 상태', '현재 연결 상태와 응답 속도를 확인했어요');

  const now = new Date().toLocaleString('ko-KR');
  text(ctx, userTag || 'YUKIHA', 930, 96, 20, '#6a8093', '700', 190);
  text(ctx, now, 795, 132, 22, '#13a8d8', '800', 330);

  const rows = [
    { label: 'Discord 핑', value: `${clientPing}ms`, sub: 'WebSocket', color: '#ff9f1a' },
    { label: 'API 응답', value: `${apiPing}ms`, sub: 'Interaction', color: '#00a878' },
    { label: '서버 수', value: `${guildCount}`, sub: 'Guilds', color: '#2374ff' },
  ];

  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i];
    const x = 70 + i * 360;
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, x, 235, 320, 200, 22);
    ctx.fill();
    ctx.strokeStyle = '#b9e7ff';
    ctx.lineWidth = 2;
    ctx.stroke();

    text(ctx, row.label, x + 32, 288, 24, '#34495e', '800', 240);
    text(ctx, row.value, x + 32, 354, 42, row.color, '900', 240);
    text(ctx, row.sub, x + 32, 396, 22, '#70869a', '600', 240);
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

  ctx.fillStyle = '#ffffff';
  roundRect(ctx, 70, 225, 1060, 210, 24);
  ctx.fill();
  ctx.strokeStyle = '#b9e7ff';
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, safeTitle, 105, 292, 34, '#102033', '900', 920);
  text(ctx, safeDesc.slice(0, 70), 105, 346, 24, '#557089', '700', 920);
  text(ctx, `닉네임: ${displayName}`, 105, 397, 23, '#13a8d8', '800', 520);
  text(ctx, `서버 멤버: ${memberCount}명`, 780, 397, 23, '#00a878', '800', 300);

  return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'yukiha-welcome.png' });
}

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AttachmentBuilder } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let fontReady = false;

const FONT_FAMILY = 'dalmoori';
const FONT_STACK = `${FONT_FAMILY}, Arial, sans-serif`;

async function loadCanvas() {
  try {
    const mod = await import('@napi-rs/canvas');
    registerKoreanFont(mod.GlobalFonts);
    return mod.createCanvas;
  } catch {
    throw new Error('이미지 카드용 패키지가 설치되지 않았습니다. Dishost 콘솔에서 npm install 을 실행한 뒤 재시작하세요.');
  }
}

function registerKoreanFont(GlobalFonts) {
  if (fontReady || !GlobalFonts) return;

  const candidates = [
    path.resolve(__dirname, '../assets/fonts/dalmoori.ttf'),
    path.resolve(__dirname, '../assets/fonts/Dalmoori.ttf'),
    path.resolve(__dirname, '../assets/fonts/dalmoori.woff2'),
    path.resolve(__dirname, '../assets/fonts/Dalmoori.woff2'),
    path.resolve(process.cwd(), 'assets/fonts/dalmoori.ttf'),
    path.resolve(process.cwd(), 'assets/fonts/Dalmoori.ttf'),
    path.resolve(process.cwd(), 'assets/fonts/dalmoori.woff2'),
    path.resolve(process.cwd(), 'assets/fonts/Dalmoori.woff2'),
    path.resolve(process.cwd(), 'dalmoori.ttf'),
    path.resolve(process.cwd(), 'Dalmoori.ttf'),
    path.resolve(process.cwd(), 'dalmoori.woff2'),
    path.resolve(process.cwd(), 'Dalmoori.woff2'),
  ];

  const fontPath = candidates.find((candidate) => fs.existsSync(candidate));
  if (!fontPath) {
    console.warn('[FONT] 한글 폰트를 찾지 못했습니다. /home/container/assets/fonts/dalmoori.ttf 로 업로드하세요.');
    fontReady = true;
    return;
  }

  const ok = GlobalFonts.registerFromPath(fontPath, FONT_FAMILY);
  console.log(ok ? `[FONT] dalmoori 한글 폰트 등록 완료: ${fontPath}` : `[FONT] dalmoori 한글 폰트 등록 실패: ${fontPath}`);
  fontReady = true;
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

function setFont(ctx, size = 26) {
  ctx.font = `${size}px ${FONT_STACK}`;
}

function text(ctx, value, x, y, size = 26, color = '#172033', strength = 1, maxWidth = undefined) {
  setFont(ctx, size);
  ctx.fillStyle = color;
  const output = String(value);
  ctx.fillText(output, x, y, maxWidth);

  if (strength >= 2) ctx.fillText(output, x + 0.7, y, maxWidth);
  if (strength >= 3) ctx.fillText(output, x, y + 0.7, maxWidth);
}

function drawBase(createCanvas, title, subtitle) {
  const canvas = createCanvas(1200, 520);
  const ctx = canvas.getContext('2d');

  const bg = ctx.createLinearGradient(0, 0, 1200, 520);
  bg.addColorStop(0, '#fbfeff');
  bg.addColorStop(0.5, '#eef9ff');
  bg.addColorStop(1, '#e6f5ff');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1200, 520);

  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRect(ctx, 28, 28, 1144, 464, 28);
  ctx.fill();
  ctx.strokeStyle = '#8bd5ff';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#eaf8ff';
  roundRect(ctx, 54, 54, 1092, 142, 24);
  ctx.fill();
  ctx.strokeStyle = '#6ecbff';
  ctx.lineWidth = 2;
  ctx.stroke();

  text(ctx, `◇ ${title}`, 82, 111, 34, '#102033', 3, 700);
  text(ctx, subtitle, 82, 154, 22, '#557089', 2, 720);

  return { canvas, ctx };
}

export async function createPingCard({ clientPing, apiPing, guildCount, userTag }) {
  const createCanvas = await loadCanvas();
  const { canvas, ctx } = drawBase(createCanvas, '유키하 네트워크 상태', '현재 연결 상태와 응답 속도를 확인했어요');

  const now = new Date().toLocaleString('ko-KR');
  text(ctx, userTag || 'YUKIHA', 930, 96, 20, '#61768a', 2, 190);
  text(ctx, now, 795, 132, 22, '#00a6d6', 2, 330);

  const rows = [
    { label: '디스코드 핑', value: `${clientPing}ms`, sub: '웹소켓 연결', color: '#ff9f1a' },
    { label: '응답 속도', value: `${apiPing}ms`, sub: '명령어 처리', color: '#00a878' },
    { label: '서버 수', value: `${guildCount}`, sub: '연결된 서버', color: '#2374ff' },
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

    text(ctx, row.label, x + 32, 288, 24, '#30445a', 3, 245);
    text(ctx, row.value, x + 32, 354, 42, row.color, 3, 250);
    text(ctx, row.sub, x + 32, 396, 22, '#70869a', 2, 245);
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

  text(ctx, safeTitle, 105, 292, 34, '#102033', 3, 920);
  text(ctx, safeDesc.slice(0, 70), 105, 346, 24, '#557089', 2, 920);
  text(ctx, `닉네임: ${displayName}`, 105, 397, 23, '#00a6d6', 3, 520);
  text(ctx, `서버 멤버: ${memberCount}명`, 780, 397, 23, '#00a878', 3, 300);

  return new AttachmentBuilder(canvas.toBuffer('image/png'), { name: 'yukiha-welcome.png' });
}

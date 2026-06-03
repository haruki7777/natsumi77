function trimText(value, max = 900) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildCardUrl({ title, lines, bg = 'fff4fb', fg = '211826' }) {
  const text = [title, ...lines]
    .filter(Boolean)
    .map((line) => trimText(line, 42))
    .join('\n');

  return `https://placehold.co/1200x520/${bg}/${fg}.png?font=noto-sans&text=${encodeURIComponent(text)}`;
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

export function buildWelcomeImageCardUrl({ member, guild, cardText }) {
  const displayName = member?.displayName || member?.user?.username || '새로운 유저';
  const memberCount = guild?.memberCount || 0;
  const safeCardText = trimText(cardText || `${displayName}님 환영해요!`, 42);

  return buildCardUrl({
    title: '🌸 유키하 환영 카드 🌸',
    lines: [safeCardText, `닉네임: ${displayName}`, `현재 멤버 수: ${memberCount}명`],
    bg: 'fff4fb',
    fg: '211826',
  });
}

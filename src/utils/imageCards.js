function trimText(value, max = 80) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function buildPlaceholdCardUrl({ title, line1, line2, line3, bg = 'eaf8ff', fg = '102033' }) {
  const text = [title, line1, line2, line3]
    .filter(Boolean)
    .map((line) => trimText(line, 52))
    .join('\n');

  return `https://placehold.co/1200x520/${bg}/${fg}.png?font=montserrat&text=${encodeURIComponent(text)}`;
}

export function buildPingCardFields({ clientPing, apiPing, guildCount }) {
  return [
    { name: '🟡 디스코드 핑', value: `\`${clientPing}ms\``, inline: true },
    { name: '🟢 응답 속도', value: `\`${apiPing}ms\``, inline: true },
    { name: '🔵 서버 수', value: `\`${guildCount}\``, inline: true },
  ];
}

export function buildPingCardUrl({ clientPing, apiPing, guildCount }) {
  return buildPlaceholdCardUrl({
    title: 'YUKIHA NETWORK STATUS',
    line1: `Discord Ping  ${clientPing}ms`,
    line2: `Response Speed  ${apiPing}ms`,
    line3: `Connected Guilds  ${guildCount}`,
    bg: 'eaf8ff',
    fg: '102033',
  });
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

export function buildWelcomeCardUrl({ member, guild, title, description }) {
  const displayName = member?.displayName || member?.user?.username || 'New User';
  const memberCount = guild?.memberCount || 0;

  return buildPlaceholdCardUrl({
    title: 'YUKIHA WELCOME CARD',
    line1: trimText(title || `Welcome ${displayName}`, 48),
    line2: trimText(description || `${displayName} joined ${guild?.name || 'the server'}`, 48),
    line3: `Members  ${memberCount}`,
    bg: 'ffeef6',
    fg: '261421',
  });
}

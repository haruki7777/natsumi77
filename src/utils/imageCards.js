function trimText(value, max = 900) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
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

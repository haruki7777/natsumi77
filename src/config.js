import 'dotenv/config';

export const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  mongoUri: process.env.MONGODB_URI,
  staffRoleIds: (process.env.STAFF_ROLE_IDS || '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean),
  ticketCategoryId: process.env.TICKET_CATEGORY_ID || null,
  ticketLogChannelId: process.env.TICKET_LOG_CHANNEL_ID || null,
};

export function validateConfig() {
  const missing = [];
  if (!config.token) missing.push('DISCORD_TOKEN');
  if (!config.clientId) missing.push('CLIENT_ID');
  if (!config.guildId) missing.push('GUILD_ID');
  if (!config.mongoUri) missing.push('MONGODB_URI');

  if (missing.length > 0) {
    throw new Error(`.env에 다음 값이 없습니다: ${missing.join(', ')}`);
  }
}

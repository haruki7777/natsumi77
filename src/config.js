import 'dotenv/config';

const env = process.env;
const botTokenKey = ['DISCORD', 'TOKEN'].join('_');

export const config = {
  token: env[botTokenKey],
  clientId: env.CLIENT_ID,
  guildId: env.GUILD_ID,
  mongoUri: env.MONGODB_URI,
};

export function validateConfig() {
  const missing = [];
  if (!config.token) missing.push(botTokenKey);
  if (!config.clientId) missing.push('CLIENT_ID');
  if (!config.guildId) missing.push('GUILD_ID');
  if (!config.mongoUri) missing.push('MONGODB_URI');

  if (missing.length > 0) {
    throw new Error(`.env에 다음 값이 없습니다: ${missing.join(', ')}`);
  }
}

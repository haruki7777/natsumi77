import { ActivityType } from 'discord.js';

export function handleReady(client) {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: '티켓 문의를 감시하는 중 ❄️', type: ActivityType.Watching }],
    status: 'online',
  });
}

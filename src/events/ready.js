import { ActivityType } from 'discord.js';
import { commands } from '../commands/index.js';
import { registerGuildCommands } from '../utils/registerCommands.js';

export async function handleReady(client) {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: '티켓 문의를 감시하는 중 ❄️', type: ActivityType.Watching }],
    status: 'online',
  });

  await registerGuildCommands(client, commands);
}

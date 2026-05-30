import { ActivityType, Events } from 'discord.js';
import { commands } from '../commands/index.js';
import { registerGuildCommands } from '../utils/registerCommands.js';
import { startBotMonitor } from '../utils/botMonitor.js';
import { handleGuildMemberAdd, handleGuildMemberRemove } from './memberEvents.js';

let memberEventsRegistered = false;

export async function handleReady(client) {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: 'YUKIHA server manager', type: ActivityType.Watching }],
    status: 'online',
  });

  await registerGuildCommands(client, commands);
  startBotMonitor(client);

  if (!memberEventsRegistered) {
    client.on(Events.GuildMemberAdd, handleGuildMemberAdd);
    client.on(Events.GuildMemberRemove, handleGuildMemberRemove);
    memberEventsRegistered = true;
    console.log('[EVENTS] member events registered');
  }
}

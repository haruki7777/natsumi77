import { ActivityType, Events } from 'discord.js';
import { commands } from '../commands/index.js';
import { registerGuildCommands } from '../utils/registerCommands.js';
import { handleGuildMemberAdd, handleGuildMemberRemove } from './memberEvents.js';

let memberEventsRegistered = false;

export async function handleReady(client) {
  console.log(`[BOT] Logged in as ${client.user.tag}`);
  client.user.setPresence({
    activities: [{ name: '유키하 서버 관리 시스템 ❄️', type: ActivityType.Watching }],
    status: 'online',
  });

  await registerGuildCommands(client, commands);

  if (!memberEventsRegistered) {
    client.on(Events.GuildMemberAdd, handleGuildMemberAdd);
    client.on(Events.GuildMemberRemove, handleGuildMemberRemove);
    memberEventsRegistered = true;
    console.log('[EVENTS] 환영/퇴장 이벤트 연결 완료');
  }
}

import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';
import { config, validateConfig } from './config.js';

validateConfig();

const rest = new REST({ version: '10' }).setToken(config.token);
const body = commands.map((command) => command.data.toJSON());

console.log(`[DEPLOY] ${body.length}개 명령어 등록 중...`);

await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body });

console.log('[DEPLOY] 서버 전용 슬래시 명령어 등록 완료');

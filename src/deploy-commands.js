import { REST, Routes } from 'discord.js';
import { commands } from './commands/index.js';
import { config, validateConfig } from './config.js';

validateConfig();

const rest = new REST({ version: '10' }).setToken(config.token);
const body = commands.map((command) => command.data.toJSON());

console.log(`[DEPLOY] ${body.length}개 전역 명령어 등록 중...`);

await rest.put(Routes.applicationCommands(config.clientId), { body });

console.log('[DEPLOY] 전역 슬래시 명령어 등록 완료');
console.log('[DEPLOY] 전역 명령어는 디스코드 반영까지 몇 분 걸릴 수 있습니다.');

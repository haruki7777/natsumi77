import { REST, Routes } from 'discord.js';
import { config, validateConfig } from './config.js';

validateConfig();

const rest = new REST({ version: '10' }).setToken(config.token);

console.log('[CLEANUP] 전역 슬래시 명령어 삭제 중...');
await rest.put(Routes.applicationCommands(config.clientId), { body: [] });
console.log('[CLEANUP] 전역 슬래시 명령어 삭제 완료');
console.log('[INFO] 이제 명령어는 봇 시작 시 각 서버에 서버별 커맨드로 자동 등록됩니다.');
console.log('[INFO] Discord 클라이언트 캐시 때문에 기존 명령어가 몇 분 정도 더 보일 수 있습니다.');

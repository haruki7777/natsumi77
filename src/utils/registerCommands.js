export async function registerGuildCommands(client, commands) {
  const commandBody = commands.map((command) => command.data.toJSON());

  try {
    await client.application.commands.set([]);
    console.log('[COMMANDS] 남아있는 전역 명령어 정리 완료');
  } catch (error) {
    console.warn('[COMMANDS] 전역 명령어 정리 실패. 서버별 명령어 등록은 계속 진행합니다.', error?.message || error);
  }

  if (!client.guilds.cache.size) {
    console.warn('[COMMANDS] 등록할 서버가 없습니다. 봇이 서버에 초대되어 있는지 확인하세요.');
    return;
  }

  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.commands.set(commandBody);
      console.log(`[COMMANDS] ${guild.name} (${guild.id}) 서버 명령어 덮어쓰기 완료: ${commandBody.length}개`);
    } catch (error) {
      console.error(`[COMMANDS] ${guild.name} (${guild.id}) 서버 명령어 등록 실패`, error);
    }
  }
}

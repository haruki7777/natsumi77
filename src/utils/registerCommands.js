export async function registerGuildCommands(client, commands) {
  const commandBody = commands.map((command) => command.data.toJSON());

  if (!client.guilds.cache.size) {
    console.warn('[COMMANDS] 등록할 서버가 없습니다. 봇이 서버에 초대되어 있는지 확인하세요.');
    return;
  }

  for (const guild of client.guilds.cache.values()) {
    try {
      await guild.commands.set(commandBody);
      console.log(`[COMMANDS] ${guild.name} (${guild.id}) 서버 명령어 등록 완료: ${commandBody.length}개`);
    } catch (error) {
      console.error(`[COMMANDS] ${guild.name} (${guild.id}) 서버 명령어 등록 실패`, error);
    }
  }
}

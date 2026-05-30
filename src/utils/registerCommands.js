function normalizeCommand(command) {
  return command.data.toJSON();
}

function getCommandNames(commandBody) {
  return commandBody.map((command) => command.name).sort((a, b) => a.localeCompare(b));
}

function diffCommandNames(before, after) {
  const beforeNames = new Set(before.map((command) => command.name));
  const afterNames = new Set(after.map((command) => command.name));

  return {
    removed: [...beforeNames].filter((name) => !afterNames.has(name)),
    added: [...afterNames].filter((name) => !beforeNames.has(name)),
  };
}

export async function registerGuildCommands(client, commands) {
  const commandBody = commands.map(normalizeCommand);
  const commandNames = getCommandNames(commandBody);

  try {
    await client.application.commands.set([]);
    console.log('[COMMANDS] 전역 명령어 캐시 정리 완료');
  } catch (error) {
    console.warn('[COMMANDS] 전역 명령어 정리 실패. 서버별 명령어 등록은 계속 진행합니다.', error?.message || error);
  }

  const guilds = await client.guilds.fetch().catch((error) => {
    console.error('[COMMANDS] 서버 목록 fetch 실패', error);
    return null;
  });

  if (!guilds?.size) {
    console.warn('[COMMANDS] 등록할 서버가 없습니다. 봇이 서버에 초대되어 있는지 확인하세요.');
    return;
  }

  console.log(`[COMMANDS] 현재 코드 기준 명령어 ${commandBody.length}개: ${commandNames.join(', ')}`);

  for (const oauthGuild of guilds.values()) {
    const guild = await client.guilds.fetch(oauthGuild.id).catch((error) => {
      console.error(`[COMMANDS] 서버 fetch 실패: ${oauthGuild.id}`, error);
      return null;
    });

    if (!guild) continue;

    try {
      const oldCommands = await guild.commands.fetch();
      const { removed, added } = diffCommandNames([...oldCommands.values()], commandBody);

      await guild.commands.set(commandBody);
      const currentCommands = await guild.commands.fetch();
      const currentNames = getCommandNames([...currentCommands.values()]);

      console.log(
        `[COMMANDS] ${guild.name} (${guild.id}) 서버 명령어 동기화 완료: ${currentCommands.size}개`
      );
      console.log(`[COMMANDS] ${guild.name} 현재 목록: ${currentNames.join(', ')}`);

      if (added.length) console.log(`[COMMANDS] ${guild.name} 추가됨: ${added.join(', ')}`);
      if (removed.length) console.log(`[COMMANDS] ${guild.name} 제거됨: ${removed.join(', ')}`);
    } catch (error) {
      console.error(`[COMMANDS] ${guild.name} (${guild.id}) 서버 명령어 등록 실패`, error);
    }
  }
}

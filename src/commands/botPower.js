import { EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { getPowerTargets, getPterodactylState, sendPterodactylPowerSignal } from '../utils/pterodactylPower.js';

const ACTION_LABELS = {
  start: '시작',
  stop: '정지',
  restart: '재시작',
  kill: '강제 종료',
  status: '상태 확인',
};

function createResultEmbed({ target, action, stateBefore, result, stateAfter }) {
  const isStatus = action === 'status';
  const ok = isStatus ? stateBefore.ok : result?.ok;

  const embed = new EmbedBuilder()
    .setColor(ok ? 0x34c759 : 0xff3b30)
    .setTitle(ok ? `✅ ${target.name} ${ACTION_LABELS[action]} 처리` : `⚠️ ${target.name} ${ACTION_LABELS[action]} 실패`)
    .setDescription(
      isStatus
        ? `${target.name} 서버의 현재 패널 상태를 확인했어.`
        : ok
          ? `${target.name} 서버에 ${ACTION_LABELS[action]} 신호를 보냈어.`
          : `${target.name} 서버에 ${ACTION_LABELS[action]} 신호를 보내지 못했어.`
    )
    .addFields(
      { name: '대상', value: `\`${target.name}\``, inline: true },
      { name: '작업', value: `\`${ACTION_LABELS[action]}\``, inline: true },
      { name: '주소', value: '`보안상 숨김`', inline: true },
      { name: '이전 상태', value: `\`${stateBefore?.state || 'unknown'}\``, inline: true },
      { name: '결과', value: `\`${isStatus ? stateBefore.reason : result?.reason || 'UNKNOWN'}\``, inline: true },
      { name: '확인 후 상태', value: `\`${stateAfter?.state || '-'}\``, inline: true }
    )
    .setFooter({ text: 'YUKIHA Power Control · Pterodactyl' })
    .setTimestamp();

  const detail = result?.detail || stateBefore?.detail || stateAfter?.detail;
  if (detail) {
    embed.addFields({
      name: '상세',
      value: `\`${String(detail).replace(/`/g, '').slice(0, 900)}\``,
      inline: false,
    });
  }

  return embed;
}

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const botPowerCommand = {
  data: new SlashCommandBuilder()
    .setName('봇전원')
    .setDescription('나츠미/유즈하 서버 전원을 직접 제어합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption((option) =>
      option
        .setName('대상')
        .setDescription('전원을 제어할 봇 서버')
        .setRequired(true)
        .addChoices(
          { name: '나츠미', value: 'natsumi' },
          { name: '유즈하', value: 'yuzuha' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('작업')
        .setDescription('실행할 전원 작업')
        .setRequired(true)
        .addChoices(
          { name: '상태 확인', value: 'status' },
          { name: '시작', value: 'start' },
          { name: '정지', value: 'stop' },
          { name: '재시작', value: 'restart' },
          { name: '강제 종료', value: 'kill' }
        )
    )
    .addStringOption((option) =>
      option
        .setName('확인')
        .setDescription('강제 종료를 쓸 때만 강제종료 라고 입력')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const targetKey = interaction.options.getString('대상', true);
    const action = interaction.options.getString('작업', true);
    const targets = getPowerTargets();
    const target = targets[targetKey];

    if (!target) {
      await interaction.editReply('알 수 없는 대상이야. 나츠미나 유즈하 중에서 골라줘 😤');
      return;
    }

    const stateBefore = await getPterodactylState(target);

    if (action === 'status') {
      await interaction.editReply({ embeds: [createResultEmbed({ target, action, stateBefore })] });
      return;
    }

    if (action === 'kill') {
      const confirm = interaction.options.getString('확인') || '';
      if (confirm !== '강제종료') {
        await interaction.editReply('강제 종료는 위험해. 정말 필요할 때만 `확인` 옵션에 `강제종료`라고 적어줘. 보통은 `정지`나 `재시작`이면 충분해 😤');
        return;
      }
    }

    const result = await sendPterodactylPowerSignal(target, action);
    await wait(2000);
    const stateAfter = await getPterodactylState(target);

    await interaction.editReply({ embeds: [createResultEmbed({ target, action, stateBefore, result, stateAfter })] });
  },
};

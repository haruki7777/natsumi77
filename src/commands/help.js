import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const helpCommand = {
  data: new SlashCommandBuilder()
    .setName('도움말')
    .setDescription('유키하봇 명령어 도움말을 보여줍니다.'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('❄️ YUKIHA 도움말')
      .setDescription('필요한 기능을 골라 써. 모르면 유키하가 알려줄게… 딱히 널 위해서는 아니지만 😤')
      .addFields(
        {
          name: '🎫 티켓',
          value: '`/티켓설정` `/티켓관리` `/ticket-setup` `/ticket-list`',
        },
        {
          name: '🛰️ 상태',
          value: '`/핑` - 네트워크 상태를 이미지 카드로 표시',
        },
        {
          name: '👋 환영',
          value: '`/환영설정` `/환영인사테스트` - 환영 채널, 자동역할, 문구 설정',
        },
        {
          name: '🛡️ 관리자',
          value: '`/관리자설정` `/킥` `/밴` - 로그 채널, 퇴장로그, 제재 기능',
        }
      )
      .setFooter({ text: 'YUKIHA System · 차갑지만 일은 제대로 해요 ❄️' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

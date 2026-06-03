import { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { sendWelcome } from '../utils/welcomeSender.js';

export const welcomeTestCommand = {
  data: new SlashCommandBuilder()
    .setName('환영인사테스트')
    .setDescription('현재 설정된 환영 인사를 테스트합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await sendWelcome(interaction.member, { skipRole: true });

    if (!result.ok) {
      await interaction.editReply('환영 채널이 아직 설정되지 않았어. 먼저 `/환영설정`을 해줘 😤');
      return;
    }

    await interaction.editReply('✅ 환영 인사 테스트를 보냈어. 채널을 확인해봐 ❄️');
  },
};

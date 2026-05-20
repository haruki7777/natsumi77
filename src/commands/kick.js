import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { createModEmbed, sendModLog } from '../utils/modLog.js';

export const kickCommand = {
  data: new SlashCommandBuilder()
    .setName('킥')
    .setDescription('유저를 서버에서 추방합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((option) =>
      option.setName('유저').setDescription('추방할 유저').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('사유').setDescription('추방 사유').setRequired(false).setMaxLength(500)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('유저', true);
    const reason = interaction.options.getString('사유') || '사유 없음';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '그 유저를 서버에서 찾지 못했어.', ephemeral: true });
    }

    if (!member.kickable) {
      return interaction.reply({ content: '그 유저는 유키하가 추방할 수 없어. 역할 순서나 권한을 확인해줘 😤', ephemeral: true });
    }

    await member.kick(`YUKIHA Kick | ${interaction.user.tag}: ${reason}`);

    const embed = createModEmbed({
      title: '◇ 유키하 킥 기록',
      color: 0xffcc66,
      target: member,
      moderator: interaction.user,
      reason,
    });
    await sendModLog(interaction.guild, embed);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffcc66)
          .setTitle('◇ 킥 완료')
          .setDescription(`${user.tag} 님을 서버에서 추방했어.`)
          .addFields({ name: '사유', value: reason })
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
};

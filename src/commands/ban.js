import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { createModEmbed, sendModLog } from '../utils/modLog.js';

export const banCommand = {
  data: new SlashCommandBuilder()
    .setName('밴')
    .setDescription('유저를 서버에서 차단합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((option) =>
      option.setName('유저').setDescription('차단할 유저').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('사유').setDescription('차단 사유').setRequired(false).setMaxLength(500)
    )
    .addIntegerOption((option) =>
      option
        .setName('메시지삭제일')
        .setDescription('최근 메시지를 며칠치 삭제할지. 0~7')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('유저', true);
    const reason = interaction.options.getString('사유') || '사유 없음';
    const deleteMessageDays = interaction.options.getInteger('메시지삭제일') ?? 0;
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (member && !member.bannable) {
      return interaction.reply({ content: '그 유저는 유키하가 밴할 수 없어. 역할 순서나 권한을 확인해줘 😤', ephemeral: true });
    }

    await interaction.guild.members.ban(user.id, {
      reason: `YUKIHA Ban | ${interaction.user.tag}: ${reason}`,
      deleteMessageSeconds: deleteMessageDays * 24 * 60 * 60,
    });

    const embed = createModEmbed({
      title: '◇ 유키하 밴 기록',
      color: 0xff6688,
      target: member || user,
      moderator: interaction.user,
      reason,
    });
    await sendModLog(interaction.guild, embed);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xff6688)
          .setTitle('◇ 밴 완료')
          .setDescription(`${user.tag} 님을 서버에서 차단했어.`)
          .addFields(
            { name: '사유', value: reason },
            { name: '메시지 삭제', value: `${deleteMessageDays}일`, inline: true }
          )
          .setTimestamp(),
      ],
      ephemeral: true,
    });
  },
};

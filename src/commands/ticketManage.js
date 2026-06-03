import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } from 'discord.js';
import { Ticket } from '../models.js';

export const ticketManageCommand = {
  data: new SlashCommandBuilder()
    .setName('티켓관리')
    .setDescription('현재 열린 티켓 목록을 확인합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const tickets = await Ticket.find({ guildId: interaction.guildId, status: 'open' })
      .sort({ openedAt: -1 })
      .limit(20);

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('❄️ 열린 티켓 목록')
      .setDescription(
        tickets.length
          ? tickets
              .map((ticket, index) =>
                `${index + 1}. <#${ticket.channelId}> · <@${ticket.ownerId}> · ${ticket.categoryLabel}`
              )
              .join('\n')
          : '현재 열린 티켓이 없어. 조용하네… 뭐, 좋은 거겠지?'
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { ticketManageCommand } from './ticketManage.js';

export const ticketManageEnglishCommand = {
  data: new SlashCommandBuilder()
    .setName('ticket-list')
    .setDescription('Show currently open YUKIHA tickets.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    return ticketManageCommand.execute(interaction);
  },
};

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { ticketSetupCommand } from './ticketSetup.js';

export const ticketSetupEnglishCommand = {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Create the YUKIHA ticket panel and save ticket settings.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName('panel-channel')
        .setDescription('Channel where the ticket panel will be sent')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('log-channel')
        .setDescription('Channel where ticket logs will be sent')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('ticket-category')
        .setDescription('Category where ticket channels will be created')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName('staff-role')
        .setDescription('Staff role that can view tickets')
        .setRequired(false)
    ),

  async execute(interaction) {
    const originalGetChannel = interaction.options.getChannel.bind(interaction.options);
    const originalGetRole = interaction.options.getRole.bind(interaction.options);

    interaction.options.getChannel = (name, required) => {
      const map = {
        '패널채널': 'panel-channel',
        '로그채널': 'log-channel',
        '티켓카테고리': 'ticket-category',
      };
      return originalGetChannel(map[name] || name, required);
    };

    interaction.options.getRole = (name, required) => {
      const map = {
        '관리자역할': 'staff-role',
      };
      return originalGetRole(map[name] || name, required);
    };

    return ticketSetupCommand.execute(interaction);
  },
};

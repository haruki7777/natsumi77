import { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { commands } from './index.js';
import { registerGuildCommands } from '../utils/registerCommands.js';

export const syncCommandsCommand = {
  data: new SlashCommandBuilder()
    .setName('sync-commands')
    .setDescription('Refresh this bot slash commands for all current servers.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    await registerGuildCommands(interaction.client, commands);

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('Command sync complete')
      .setDescription('Slash commands were overwritten with the current command list from the running code.')
      .addFields({
        name: 'Command count',
        value: `\`${commands.length}\``,
        inline: true,
      })
      .setFooter({ text: 'Discord client cache can take a few minutes to refresh.' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

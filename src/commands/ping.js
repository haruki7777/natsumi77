import { SlashCommandBuilder } from 'discord.js';
import { createPingCard } from '../utils/imageCards.js';

export const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('핑')
    .setDescription('유키하의 네트워크 상태를 이미지 카드로 확인합니다.'),

  async execute(interaction) {
    const startedAt = Date.now();
    await interaction.deferReply();
    const apiPing = Date.now() - startedAt;
    const clientPing = Math.max(0, Math.round(interaction.client.ws.ping));
    const file = await createPingCard({
      clientPing,
      apiPing,
      guildCount: interaction.client.guilds.cache.size,
      userTag: interaction.user.tag,
    });

    await interaction.editReply({ files: [file] });
  },
};

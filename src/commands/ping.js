import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { buildPingCardFields, buildPingCardUrl } from '../utils/imageCards.js';

export const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('핑')
    .setDescription('유키하의 네트워크 상태를 카드로 확인합니다.'),

  async execute(interaction) {
    const startedAt = Date.now();
    await interaction.deferReply();

    const apiPing = Date.now() - startedAt;
    const clientPing = Math.max(0, Math.round(interaction.client.ws.ping));
    const guildCount = interaction.client.guilds.cache.size;
    const cardUrl = buildPingCardUrl({ clientPing, apiPing, guildCount });

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('❄️ 유키하 네트워크 상태')
      .setDescription('카드 이미지와 수치를 같이 표시해요.')
      .addFields(buildPingCardFields({ clientPing, apiPing, guildCount }))
      .setImage(cardUrl)
      .setFooter({ text: `요청자: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

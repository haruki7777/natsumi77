import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
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
    const guildCount = interaction.client.guilds.cache.size;

    const file = await createPingCard({
      clientPing,
      apiPing,
      guildCount,
      userTag: interaction.user.tag,
    });
    const imageName = file.name || 'yukiha-ping.png';

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('❄️ 유키하 네트워크 상태')
      .setDescription('PNG 카드로 안정적으로 표시해요. 카드가 늦게 뜨면 아래 수치를 확인해줘.')
      .addFields(
        { name: '디스코드 핑', value: `\`${clientPing}ms\``, inline: true },
        { name: '응답 속도', value: `\`${apiPing}ms\``, inline: true },
        { name: '서버 수', value: `\`${guildCount}\``, inline: true }
      )
      .setImage(`attachment://${imageName}`)
      .setFooter({ text: `요청자: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed], files: [file] });
  },
};

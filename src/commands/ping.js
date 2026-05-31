import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const pingCommand = {
  data: new SlashCommandBuilder()
    .setName('핑')
    .setDescription('유키하의 네트워크 상태를 확인합니다.'),

  async execute(interaction) {
    const startedAt = Date.now();
    await interaction.deferReply();

    const apiPing = Date.now() - startedAt;
    const clientPing = Math.max(0, Math.round(interaction.client.ws.ping));

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('❄️ 유키하 네트워크 상태')
      .setDescription('현재 연결 상태와 응답 속도를 확인했어.')
      .addFields(
        { name: '디스코드 핑', value: `\`${clientPing}ms\``, inline: true },
        { name: '응답 속도', value: `\`${apiPing}ms\``, inline: true },
        { name: '서버 수', value: `\`${interaction.client.guilds.cache.size}\``, inline: true }
      )
      .setFooter({ text: `요청자: ${interaction.user.tag}` })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
  },
};

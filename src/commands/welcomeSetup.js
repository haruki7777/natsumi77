import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { GuildSettings } from '../models.js';

export const welcomeSetupCommand = {
  data: new SlashCommandBuilder()
    .setName('환영설정')
    .setDescription('유키하 환영 인사 채널, 문구, 자동역할을 설정합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName('채널')
        .setDescription('환영 인사를 보낼 채널')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName('제목')
        .setDescription('환영 이미지/임베드 제목. 예: 어서 와요, {username}님')
        .setRequired(false)
        .setMaxLength(80)
    )
    .addStringOption((option) =>
      option
        .setName('내용')
        .setDescription('환영 내용. 사용 가능: {user} {username} {server} {memberCount}')
        .setRequired(false)
        .setMaxLength(700)
    )
    .addRoleOption((option) =>
      option
        .setName('자동역할')
        .setDescription('새 멤버에게 자동으로 지급할 역할')
        .setRequired(false)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('채널', true);
    const title = interaction.options.getString('제목') || '어서 와요, {username}님 ❄️';
    const description = interaction.options.getString('내용') || '유키하가 {server} 입장을 환영해요. 현재 멤버 수는 {memberCount}명이에요.';
    const role = interaction.options.getRole('자동역할');

    const saved = await GuildSettings.findOneAndUpdate(
      { guildId: interaction.guildId },
      {
        guildId: interaction.guildId,
        welcomeChannelId: channel.id,
        welcomeTitle: title,
        welcomeDescription: description,
        ...(role ? { welcomeRoleId: role.id } : {}),
      },
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('❄️ 환영 설정 완료')
      .setDescription('새 멤버가 들어오면 유키하 스타일 이미지 카드와 임베드를 보낼게.')
      .addFields(
        { name: '채널', value: `${channel}`, inline: true },
        { name: '자동역할', value: saved.welcomeRoleId ? `<@&${saved.welcomeRoleId}>` : '없음', inline: true },
        { name: '제목', value: title },
        { name: '내용', value: description }
      )
      .setFooter({ text: '테스트는 /환영인사테스트 로 확인해줘' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

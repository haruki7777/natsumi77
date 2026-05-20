import { ChannelType, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { GuildSettings } from '../models.js';

export const adminSetupCommand = {
  data: new SlashCommandBuilder()
    .setName('관리자설정')
    .setDescription('유키하 관리자 로그와 퇴장 로그 채널을 설정합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName('관리로그채널')
        .setDescription('킥/밴 같은 관리자 작업 로그 채널')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('퇴장로그채널')
        .setDescription('멤버 퇴장 로그 채널')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('퇴장문구')
        .setDescription('퇴장 메시지. 사용 가능: {user} {username} {server} {id}')
        .setRequired(false)
        .setMaxLength(500)
    ),

  async execute(interaction) {
    const modLog = interaction.options.getChannel('관리로그채널');
    const goodbye = interaction.options.getChannel('퇴장로그채널');
    const goodbyeMessage = interaction.options.getString('퇴장문구');

    const update = { guildId: interaction.guildId };
    if (modLog) update.modLogChannelId = modLog.id;
    if (goodbye) update.goodbyeChannelId = goodbye.id;
    if (goodbyeMessage) update.goodbyeMessage = goodbyeMessage;

    const saved = await GuildSettings.findOneAndUpdate(
      { guildId: interaction.guildId },
      update,
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('◇ 유키하 관리자 설정 완료')
      .setDescription('관리 로그와 퇴장 기록 설정을 저장했어. 흥, 이제 기록은 깔끔하게 남겨줄게.')
      .addFields(
        { name: '관리 로그', value: saved.modLogChannelId ? `<#${saved.modLogChannelId}>` : '미설정', inline: true },
        { name: '퇴장 로그', value: saved.goodbyeChannelId ? `<#${saved.goodbyeChannelId}>` : '미설정', inline: true },
        { name: '퇴장 문구', value: saved.goodbyeMessage || '미설정' }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

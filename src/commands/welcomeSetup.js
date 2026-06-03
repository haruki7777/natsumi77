import { ChannelType, EmbedBuilder, MessageFlags, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { GuildSettings } from '../models.js';

const MENTION_LABELS = {
  none: '멘션 없음',
  member: '입장한 멤버',
  target: '선택한 대상',
  everyone: '@everyone',
  here: '@here',
};

export const welcomeSetupCommand = {
  data: new SlashCommandBuilder()
    .setName('환영설정')
    .setDescription('유키하 환영 인사 채널, 문구, 멘션, 자동역할을 설정합니다.')
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
        .setDescription('환영 임베드 제목. 예: 어서 와요, {username}님')
        .setRequired(false)
        .setMaxLength(80)
    )
    .addStringOption((option) =>
      option
        .setName('내용')
        .setDescription('환영 설명. 사용 가능: {user} {username} {server} {memberCount}')
        .setRequired(false)
        .setMaxLength(700)
    )
    .addStringOption((option) =>
      option
        .setName('카드내용')
        .setDescription('환영 카드 중앙에 표시할 내용. 사용 가능: {user} {username} {server} {memberCount}')
        .setRequired(false)
        .setMaxLength(900)
    )
    .addStringOption((option) =>
      option
        .setName('멘션방식')
        .setDescription('환영 메시지에서 누구를 멘션할지 선택')
        .setRequired(false)
        .addChoices(
          { name: '멘션 없음', value: 'none' },
          { name: '입장한 멤버', value: 'member' },
          { name: '선택한 대상', value: 'target' },
          { name: '@everyone', value: 'everyone' },
          { name: '@here', value: 'here' }
        )
    )
    .addRoleOption((option) =>
      option
        .setName('멘션역할')
        .setDescription('멘션방식이 선택한 대상일 때 멘션할 역할')
        .setRequired(false)
    )
    .addUserOption((option) =>
      option
        .setName('멘션유저')
        .setDescription('멘션방식이 선택한 대상일 때 멘션할 유저')
        .setRequired(false)
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
    const cardText = interaction.options.getString('카드내용') || '새로 온 {user}님, {server}에 온 걸 환영해요. 현재 멤버 수는 {memberCount}명이에요.';
    const mentionMode = interaction.options.getString('멘션방식') || 'member';
    const mentionRole = interaction.options.getRole('멘션역할');
    const mentionUser = interaction.options.getUser('멘션유저');
    const role = interaction.options.getRole('자동역할');

    const mentionTarget = mentionRole
      ? { id: mentionRole.id, type: 'role', label: `<@&${mentionRole.id}>` }
      : mentionUser
        ? { id: mentionUser.id, type: 'user', label: `<@${mentionUser.id}>` }
        : { id: null, type: null, label: '없음' };

    const saved = await GuildSettings.findOneAndUpdate(
      { guildId: interaction.guildId },
      {
        guildId: interaction.guildId,
        welcomeChannelId: channel.id,
        welcomeTitle: title,
        welcomeDescription: description,
        welcomeCardText: cardText,
        welcomeMentionMode: mentionMode,
        welcomeMentionTargetId: mentionMode === 'target' ? mentionTarget.id : null,
        welcomeMentionTargetType: mentionMode === 'target' ? mentionTarget.type : null,
        ...(role ? { welcomeRoleId: role.id } : {}),
      },
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('❄️ 환영 설정 완료')
      .setDescription('새 멤버가 들어오면 한글 환영 카드로 보낼게.')
      .addFields(
        { name: '채널', value: `${channel}`, inline: true },
        { name: '자동역할', value: saved.welcomeRoleId ? `<@&${saved.welcomeRoleId}>` : '없음', inline: true },
        { name: '멘션방식', value: MENTION_LABELS[mentionMode] || mentionMode, inline: true },
        { name: '멘션대상', value: mentionMode === 'target' ? mentionTarget.label : '해당 없음', inline: true },
        { name: '제목', value: title },
        { name: '내용', value: description },
        { name: '카드내용', value: cardText }
      )
      .setFooter({ text: '테스트는 /환영인사테스트 로 확인해줘' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};

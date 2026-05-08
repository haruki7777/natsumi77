import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
} from 'discord.js';
import { GuildSettings } from '../models.js';
import { buildTicketPanelComponents } from '../utils/ticketComponents.js';

export const ticketSetupCommand = {
  data: new SlashCommandBuilder()
    .setName('티켓설정')
    .setDescription('YUKIHA 티켓 패널과 설정을 생성합니다.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName('패널채널')
        .setDescription('티켓 패널을 보낼 채널')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('로그채널')
        .setDescription('티켓 로그를 보낼 채널')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('티켓카테고리')
        .setDescription('티켓 채널이 생성될 카테고리')
        .addChannelTypes(ChannelType.GuildCategory)
        .setRequired(false)
    )
    .addRoleOption((option) =>
      option
        .setName('관리자역할')
        .setDescription('티켓을 볼 수 있는 관리자 역할')
        .setRequired(false)
    ),

  async execute(interaction) {
    const panelChannel = interaction.options.getChannel('패널채널', true);
    const logChannel = interaction.options.getChannel('로그채널');
    const ticketCategory = interaction.options.getChannel('티켓카테고리');
    const staffRole = interaction.options.getRole('관리자역할');

    const saved = await GuildSettings.findOneAndUpdate(
      { guildId: interaction.guildId },
      {
        guildId: interaction.guildId,
        panelChannelId: panelChannel.id,
        ...(logChannel ? { logChannelId: logChannel.id } : {}),
        ...(ticketCategory ? { ticketCategoryId: ticketCategory.id } : {}),
        ...(staffRole ? { staffRoleIds: [staffRole.id] } : {}),
      },
      { upsert: true, new: true }
    );

    const embed = new EmbedBuilder()
      .setColor(0x9ddcff)
      .setTitle('❄️ YUKIHA 티켓 센터')
      .setDescription(
        [
          '문의 종류를 선택하면 유키하가 전용 티켓방을 만들어줄게.',
          '',
          '• 장난 문의는 안 돼. 유키하가 삐진다구 😤',
          '• 문의 내용을 자세히 적으면 처리가 빨라져.',
          '• 티켓은 본인과 관리자만 볼 수 있어.',
        ].join('\n')
      )
      .setFooter({ text: 'YUKIHA Ticket System' });

    await panelChannel.send({ embeds: [embed], components: buildTicketPanelComponents() });

    await interaction.reply({
      content: [
        '✅ 티켓 패널 생성 완료!',
        `패널 채널: ${panelChannel}`,
        saved.logChannelId ? `로그 채널: <#${saved.logChannelId}>` : '로그 채널: 미설정',
        saved.ticketCategoryId ? `티켓 카테고리: <#${saved.ticketCategoryId}>` : '티켓 카테고리: 자동/미설정',
        saved.staffRoleIds?.length ? `관리자 역할: ${saved.staffRoleIds.map((id) => `<@&${id}>`).join(', ')}` : '관리자 역할: .env 또는 관리자 권한 사용',
      ].join('\n'),
      ephemeral: true,
    });
  },
};

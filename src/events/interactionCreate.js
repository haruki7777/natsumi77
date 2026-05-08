import {
  ActionRowBuilder,
  ChannelType,
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { customIds, TICKET_CATEGORIES } from '../constants.js';
import { Ticket } from '../models.js';
import { buildClosedTicketButtons, buildOpenTicketButtons } from '../utils/ticketComponents.js';
import { buildTicketPermissionOverwrites, getGuildSettings, isTicketStaff } from '../utils/permissions.js';
import { createTranscriptAttachment } from '../utils/transcript.js';

function cleanChannelName(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣-_]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40);
}

async function getLogChannel(guild, settings) {
  if (!settings.logChannelId) return null;
  const channel = await guild.channels.fetch(settings.logChannelId).catch(() => null);
  return channel?.isTextBased() ? channel : null;
}

async function createTicketFromModal(interaction, categoryKey) {
  const category = TICKET_CATEGORIES.find((item) => item.key === categoryKey);
  if (!category) {
    return interaction.reply({ content: '알 수 없는 티켓 종류야. 다시 선택해줘.', ephemeral: true });
  }

  const reason = interaction.fields.getTextInputValue(customIds.ticketReasonInput) || '내용 없음';

  const alreadyOpen = await Ticket.findOne({
    guildId: interaction.guildId,
    ownerId: interaction.user.id,
    status: 'open',
  });

  if (alreadyOpen) {
    return interaction.reply({
      content: `이미 열린 티켓이 있어: <#${alreadyOpen.channelId}>\n하나씩 처리하자구, 욕심쟁이야 😤`,
      ephemeral: true,
    });
  }

  const settings = await getGuildSettings(interaction.guildId);
  const staffRoleIds = settings.staffRoleIds || [];

  const channelName = cleanChannelName(`ticket-${category.key}-${interaction.user.username}`);

  const channel = await interaction.guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: settings.ticketCategoryId || null,
    topic: `YUKIHA Ticket | Owner: ${interaction.user.id} | Type: ${category.label}`,
    permissionOverwrites: buildTicketPermissionOverwrites(interaction.guild, interaction.user.id, staffRoleIds),
  });

  const ticket = await Ticket.create({
    guildId: interaction.guildId,
    channelId: channel.id,
    ownerId: interaction.user.id,
    categoryKey: category.key,
    categoryLabel: category.label,
    reason,
  });

  const embed = new EmbedBuilder()
    .setColor(0x9ddcff)
    .setTitle(`${category.emoji} ${category.label} 티켓`)
    .setDescription(
      [
        `${interaction.user} 님의 티켓이 열렸어.`,
        '',
        `**문의 내용**\n${reason}`,
        '',
        '관리자가 곧 확인할 거야. 너무 조급해하지 말라구… 그래도 기다리게 해서 미안하긴 해 ❄️',
      ].join('\n')
    )
    .setFooter({ text: `Ticket ID: ${ticket.id}` })
    .setTimestamp();

  const staffMention = staffRoleIds.length ? staffRoleIds.map((id) => `<@&${id}>`).join(' ') : '';
  await channel.send({
    content: `${interaction.user} ${staffMention}`.trim(),
    embeds: [embed],
    components: buildOpenTicketButtons(),
  });

  const logChannel = await getLogChannel(interaction.guild, settings);
  if (logChannel) {
    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('✅ 티켓 생성')
          .addFields(
            { name: '채널', value: `${channel}`, inline: true },
            { name: '유저', value: `${interaction.user}`, inline: true },
            { name: '종류', value: category.label, inline: true },
            { name: '내용', value: reason.slice(0, 1000) }
          )
          .setTimestamp(),
      ],
    });
  }

  await interaction.reply({ content: `✅ 티켓 생성 완료: ${channel}`, ephemeral: true });
}

async function closeTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channelId, guildId: interaction.guildId });
  if (!ticket) return interaction.reply({ content: '여긴 티켓 채널이 아닌 것 같아.', ephemeral: true });

  const staff = await isTicketStaff(interaction.member);
  if (!staff && interaction.user.id !== ticket.ownerId) {
    return interaction.reply({ content: '이 티켓을 닫을 권한이 없어. 흥, 규칙은 지켜야지.', ephemeral: true });
  }

  if (ticket.status === 'closed') {
    return interaction.reply({ content: '이미 닫힌 티켓이야.', ephemeral: true });
  }

  ticket.status = 'closed';
  ticket.closedAt = new Date();
  ticket.closedBy = interaction.user.id;
  await ticket.save();

  await interaction.channel.permissionOverwrites.edit(ticket.ownerId, {
    SendMessages: false,
    ViewChannel: true,
    ReadMessageHistory: true,
  });

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0xffcc66)
        .setTitle('🔒 티켓 닫힘')
        .setDescription(`${interaction.user} 님이 티켓을 닫았어.`)
        .setTimestamp(),
    ],
    components: buildClosedTicketButtons(),
  });

  const settings = await getGuildSettings(interaction.guildId);
  const logChannel = await getLogChannel(interaction.guild, settings);
  if (logChannel) {
    const transcript = await createTranscriptAttachment(interaction.channel);
    await logChannel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(0xffcc66)
          .setTitle('🔒 티켓 닫힘')
          .addFields(
            { name: '채널', value: `${interaction.channel.name}`, inline: true },
            { name: '유저', value: `<@${ticket.ownerId}>`, inline: true },
            { name: '닫은 사람', value: `${interaction.user}`, inline: true }
          )
          .setTimestamp(),
      ],
      files: [transcript],
    });
  }
}

async function reopenTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channelId, guildId: interaction.guildId });
  if (!ticket) return interaction.reply({ content: '여긴 티켓 채널이 아닌 것 같아.', ephemeral: true });

  if (!(await isTicketStaff(interaction.member))) {
    return interaction.reply({ content: '관리자만 다시 열 수 있어.', ephemeral: true });
  }

  ticket.status = 'open';
  ticket.closedAt = null;
  ticket.closedBy = null;
  await ticket.save();

  await interaction.channel.permissionOverwrites.edit(ticket.ownerId, {
    SendMessages: true,
    ViewChannel: true,
    ReadMessageHistory: true,
  });

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle('🔓 티켓 다시 열림')
        .setDescription(`${interaction.user} 님이 티켓을 다시 열었어.`)
        .setTimestamp(),
    ],
    components: buildOpenTicketButtons(),
  });
}

async function deleteTicket(interaction) {
  const ticket = await Ticket.findOne({ channelId: interaction.channelId, guildId: interaction.guildId });
  if (!ticket) return interaction.reply({ content: '여긴 티켓 채널이 아닌 것 같아.', ephemeral: true });

  if (!(await isTicketStaff(interaction.member))) {
    return interaction.reply({ content: '관리자만 삭제할 수 있어.', ephemeral: true });
  }

  await interaction.reply({ content: '🗑️ 5초 뒤 티켓 채널을 삭제할게. 잘 가라구…', ephemeral: true });
  await Ticket.deleteOne({ _id: ticket._id });

  setTimeout(() => {
    interaction.channel.delete('YUKIHA ticket deleted').catch(() => null);
  }, 5000);
}

export async function handleInteraction(interaction, commands) {
  try {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === customIds.ticketSelect) {
      const categoryKey = interaction.values[0];
      const category = TICKET_CATEGORIES.find((item) => item.key === categoryKey);
      if (!category) return interaction.reply({ content: '알 수 없는 문의 종류야.', ephemeral: true });

      const modal = new ModalBuilder()
        .setCustomId(`${customIds.ticketModalPrefix}${categoryKey}`)
        .setTitle(`YUKIHA ${category.label}`);

      const reasonInput = new TextInputBuilder()
        .setCustomId(customIds.ticketReasonInput)
        .setLabel('문의 내용을 자세히 적어줘')
        .setPlaceholder('예: 어떤 문제가 생겼는지, 언제 발생했는지, 원하는 처리 방향')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));
      await interaction.showModal(modal);
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith(customIds.ticketModalPrefix)) {
      const categoryKey = interaction.customId.slice(customIds.ticketModalPrefix.length);
      await createTicketFromModal(interaction, categoryKey);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId === customIds.closeTicket) return closeTicket(interaction);
      if (interaction.customId === customIds.reopenTicket) return reopenTicket(interaction);
      if (interaction.customId === customIds.deleteTicket) return deleteTicket(interaction);
    }
  } catch (error) {
    console.error('[Interaction Error]', error);
    const message = '처리 중 오류가 났어. 콘솔 로그를 확인해줘. 내가 일부러 그런 건 아니거든?! 😭';
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: message, ephemeral: true }).catch(() => null);
    } else {
      await interaction.reply({ content: message, ephemeral: true }).catch(() => null);
    }
  }
}

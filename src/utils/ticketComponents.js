import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import { TICKET_CATEGORIES, customIds } from '../constants.js';

export function buildTicketPanelComponents() {
  const select = new StringSelectMenuBuilder()
    .setCustomId(customIds.ticketSelect)
    .setPlaceholder('문의 종류를 선택해줘, 바보야… 아니 도와줄게 ❄️')
    .addOptions(
      TICKET_CATEGORIES.map((category) => ({
        label: category.label,
        value: category.key,
        description: category.description,
        emoji: category.emoji,
      }))
    );

  return [new ActionRowBuilder().addComponents(select)];
}

export function buildOpenTicketButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(customIds.closeTicket)
        .setLabel('티켓 닫기')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    ),
  ];
}

export function buildClosedTicketButtons() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(customIds.reopenTicket)
        .setLabel('다시 열기')
        .setEmoji('🔓')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(customIds.deleteTicket)
        .setLabel('삭제')
        .setEmoji('🗑️')
        .setStyle(ButtonStyle.Secondary)
    ),
  ];
}

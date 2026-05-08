import { PermissionFlagsBits } from 'discord.js';
import { config } from '../config.js';
import { GuildSettings } from '../models.js';

export async function getGuildSettings(guildId) {
  const saved = await GuildSettings.findOne({ guildId });
  return {
    staffRoleIds: saved?.staffRoleIds?.length ? saved.staffRoleIds : config.staffRoleIds,
    ticketCategoryId: saved?.ticketCategoryId || config.ticketCategoryId,
    logChannelId: saved?.logChannelId || config.ticketLogChannelId,
    panelChannelId: saved?.panelChannelId || null,
  };
}

export async function isTicketStaff(member) {
  if (!member) return false;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  const settings = await getGuildSettings(member.guild.id);
  return settings.staffRoleIds.some((roleId) => member.roles.cache.has(roleId));
}

export function buildTicketPermissionOverwrites(guild, ownerId, staffRoleIds) {
  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: ownerId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: guild.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  for (const roleId of staffRoleIds) {
    overwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  return overwrites;
}

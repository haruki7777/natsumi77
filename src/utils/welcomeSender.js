import { EmbedBuilder } from 'discord.js';
import { GuildSettings } from '../models.js';
import { applyPlaceholders } from './placeholders.js';

export async function sendWelcome(member, options = {}) {
  const settings = await GuildSettings.findOne({ guildId: member.guild.id });
  if (!settings?.welcomeChannelId) return { ok: false, reason: 'welcome_channel_not_set' };

  const channel = await member.guild.channels.fetch(settings.welcomeChannelId).catch(() => null);
  if (!channel?.isTextBased()) return { ok: false, reason: 'welcome_channel_missing' };

  if (!options.skipRole && settings.welcomeRoleId) {
    await member.roles.add(settings.welcomeRoleId, 'YUKIHA welcome auto role').catch((error) => {
      console.warn('[WELCOME] 자동역할 지급 실패:', error?.message || error);
    });
  }

  const title = applyPlaceholders(settings.welcomeTitle, member, member.guild);
  const description = applyPlaceholders(settings.welcomeDescription, member, member.guild);

  const embed = new EmbedBuilder()
    .setColor(0x9ddcff)
    .setTitle(title)
    .setDescription(description)
    .addFields(
      { name: '유저', value: `${member.user}`, inline: true },
      { name: '멤버 수', value: `\`${member.guild.memberCount}명\``, inline: true }
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: 'YUKIHA Welcome System ❄️' })
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  return { ok: true };
}

export async function sendGoodbye(member) {
  const settings = await GuildSettings.findOne({ guildId: member.guild.id });
  if (!settings?.goodbyeChannelId) return { ok: false, reason: 'goodbye_channel_not_set' };

  const channel = await member.guild.channels.fetch(settings.goodbyeChannelId).catch(() => null);
  if (!channel?.isTextBased()) return { ok: false, reason: 'goodbye_channel_missing' };

  const message = applyPlaceholders(settings.goodbyeMessage, member, member.guild);
  const embed = new EmbedBuilder()
    .setColor(0x7088aa)
    .setTitle('◇ 유키하 퇴장 기록')
    .setDescription(message)
    .addFields(
      { name: '유저', value: `${member.user?.tag || member.id}`, inline: true },
      { name: '유저 ID', value: `${member.id}`, inline: true }
    )
    .setTimestamp();

  await channel.send({ embeds: [embed] });
  return { ok: true };
}

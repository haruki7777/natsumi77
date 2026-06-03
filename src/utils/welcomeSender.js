import { EmbedBuilder } from 'discord.js';
import { GuildSettings } from '../models.js';
import { buildWelcomeCardDescription, buildWelcomeCardFields, buildWelcomeImageCardUrl } from './imageCards.js';
import { applyPlaceholders } from './placeholders.js';

function buildWelcomeMention(settings, member) {
  const mode = settings?.welcomeMentionMode || 'member';

  if (mode === 'none') return null;
  if (mode === 'member') return `${member.user}`;
  if (mode === 'everyone') return '@everyone';
  if (mode === 'here') return '@here';

  if (mode === 'target' && settings.welcomeMentionTargetId) {
    if (settings.welcomeMentionTargetType === 'role') return `<@&${settings.welcomeMentionTargetId}>`;
    if (settings.welcomeMentionTargetType === 'user') return `<@${settings.welcomeMentionTargetId}>`;
  }

  return null;
}

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
  const cardText = applyPlaceholders(settings.welcomeCardText, member, member.guild);
  const mention = buildWelcomeMention(settings, member);
  const imageCardUrl = buildWelcomeImageCardUrl({ member, guild: member.guild, cardText });

  const embed = new EmbedBuilder()
    .setColor(0x9ddcff)
    .setTitle(title)
    .setDescription(buildWelcomeCardDescription({ cardText }))
    .addFields(
      { name: '💬 안내', value: description.slice(0, 1000), inline: false },
      ...buildWelcomeCardFields({ member, guild: member.guild })
    )
    .setImage(imageCardUrl)
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
    .setFooter({ text: 'YUKIHA Welcome System ❄️ · Korean Card Mode' })
    .setTimestamp();

  await channel.send({
    content: mention || undefined,
    embeds: [embed],
    allowedMentions: {
      parse: mention === '@everyone' ? ['everyone'] : mention === '@here' ? ['everyone'] : [],
      users: settings.welcomeMentionMode === 'member' ? [member.id] : settings.welcomeMentionTargetType === 'user' ? [settings.welcomeMentionTargetId] : [],
      roles: settings.welcomeMentionTargetType === 'role' ? [settings.welcomeMentionTargetId] : [],
    },
  });
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

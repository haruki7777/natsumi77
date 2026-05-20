import { EmbedBuilder } from 'discord.js';
import { GuildSettings } from '../models.js';

export async function sendModLog(guild, embed) {
  const settings = await GuildSettings.findOne({ guildId: guild.id });
  if (!settings?.modLogChannelId) return false;

  const channel = await guild.channels.fetch(settings.modLogChannelId).catch(() => null);
  if (!channel?.isTextBased()) return false;

  await channel.send({ embeds: [embed] }).catch(() => null);
  return true;
}

export function createModEmbed({ title, color = 0x9ddcff, target, moderator, reason }) {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .addFields(
      { name: '대상', value: `${target.user?.tag || target.tag || target.id}\nID: ${target.id}`, inline: true },
      { name: '관리자', value: `${moderator.tag}\nID: ${moderator.id}`, inline: true },
      { name: '사유', value: reason || '사유 없음' }
    )
    .setFooter({ text: 'YUKIHA Moderation System ❄️' })
    .setTimestamp();
}

import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    channelId: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    categoryKey: { type: String, required: true },
    categoryLabel: { type: String, required: true },
    reason: { type: String, default: '내용 없음' },
    status: { type: String, enum: ['open', 'closed'], default: 'open', index: true },
    openedAt: { type: Date, default: Date.now },
    closedAt: { type: Date, default: null },
    closedBy: { type: String, default: null },
  },
  { timestamps: true }
);

const guildSettingsSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, unique: true },
    panelChannelId: String,
    logChannelId: String,
    ticketCategoryId: String,
    staffRoleIds: [String],
  },
  { timestamps: true }
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
export const GuildSettings = mongoose.model('GuildSettings', guildSettingsSchema);

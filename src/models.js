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
    welcomeChannelId: String,
    welcomeRoleId: String,
    welcomeTitle: { type: String, default: '어서 와요, {user}님 ❄️' },
    welcomeDescription: {
      type: String,
      default: '유키하가 {server} 입장을 환영해요. 규칙을 확인하고 즐겁게 지내줘요.',
    },
    welcomeCardText: {
      type: String,
      default: '새로 온 {user}님, {server}에 온 걸 환영해요. 현재 멤버 수는 {memberCount}명이에요.',
    },
    welcomeMentionMode: {
      type: String,
      enum: ['none', 'member', 'target', 'everyone', 'here'],
      default: 'member',
    },
    welcomeMentionTargetId: { type: String, default: null },
    welcomeMentionTargetType: { type: String, enum: ['role', 'user', null], default: null },
    welcomeCleanupOnLeave: { type: Boolean, default: true },
    goodbyeChannelId: String,
    goodbyeMessage: { type: String, default: '{user}님이 서버를 떠났어요.' },
    modLogChannelId: String,
  },
  { timestamps: true }
);

const welcomeMessageSchema = new mongoose.Schema(
  {
    guildId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

welcomeMessageSchema.index({ guildId: 1, userId: 1, deletedAt: 1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
export const GuildSettings = mongoose.model('GuildSettings', guildSettingsSchema);
export const WelcomeMessage = mongoose.model('WelcomeMessage', welcomeMessageSchema);

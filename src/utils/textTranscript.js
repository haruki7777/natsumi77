import { AttachmentBuilder } from 'discord.js';

function safeText(value = '') {
  return String(value)
    .replaceAll('\r', '')
    .trim();
}

export async function createTextTranscriptAttachment(channel) {
  const messages = [];
  let before;

  while (true) {
    const batch = await channel.messages.fetch({ limit: 100, before });
    if (batch.size === 0) break;

    messages.push(...batch.values());
    before = batch.last().id;

    if (messages.length >= 1000) break;
  }

  messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  const lines = [];
  lines.push('YUKIHA 티켓 저장 로그');
  lines.push(`채널명: #${channel.name}`);
  lines.push(`채널ID: ${channel.id}`);
  lines.push(`저장시간: ${new Date().toLocaleString('ko-KR')}`);
  lines.push('='.repeat(60));
  lines.push('');

  for (const message of messages) {
    const nickname = message.member?.displayName || message.author.globalName || message.author.username;
    const username = message.author.tag;
    const userId = message.author.id;
    const time = new Date(message.createdTimestamp).toLocaleString('ko-KR');
    const content = safeText(message.content || '[내용 없음]');

    lines.push(`[${time}]`);
    lines.push(`닉네임: ${nickname}`);
    lines.push(`계정명: ${username}`);
    lines.push(`유저ID: ${userId}`);
    lines.push(`내용: ${content}`);

    if (message.attachments.size > 0) {
      lines.push('첨부파일:');
      for (const attachment of message.attachments.values()) {
        lines.push(`- ${attachment.name || '파일'}: ${attachment.url}`);
      }
    }

    lines.push('-'.repeat(60));
  }

  if (messages.length === 0) {
    lines.push('저장할 메시지가 없습니다.');
  }

  return new AttachmentBuilder(Buffer.from(lines.join('\n'), 'utf-8'), {
    name: `${channel.name}-messages.txt`,
  });
}

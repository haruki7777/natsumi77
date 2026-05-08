import { AttachmentBuilder } from 'discord.js';

function escapeHtml(text = '') {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export async function createTranscriptAttachment(channel) {
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

  const rows = messages
    .map((message) => {
      const attachments = [...message.attachments.values()]
        .map((a) => `<a href="${escapeHtml(a.url)}">${escapeHtml(a.name || a.url)}</a>`)
        .join('<br>');

      return `
        <div class="msg">
          <img src="${escapeHtml(message.author.displayAvatarURL())}" />
          <div>
            <div class="meta"><b>${escapeHtml(message.author.tag)}</b> · ${new Date(message.createdTimestamp).toLocaleString('ko-KR')}</div>
            <div class="content">${escapeHtml(message.content || '').replaceAll('\n', '<br>')}</div>
            ${attachments ? `<div class="attachments">${attachments}</div>` : ''}
          </div>
        </div>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(channel.name)} transcript</title>
<style>
body{font-family:Arial,Apple SD Gothic Neo,sans-serif;background:#10131a;color:#eef2ff;padding:24px}
.header{border-bottom:1px solid #2b3245;padding-bottom:16px;margin-bottom:16px}
.msg{display:flex;gap:12px;padding:12px;border-bottom:1px solid #252b3a}
.msg img{width:40px;height:40px;border-radius:50%}
.meta{color:#aeb7d3;margin-bottom:6px}.content{white-space:normal;line-height:1.5}.attachments{margin-top:8px}a{color:#9ddcff}
</style>
</head>
<body>
<div class="header"><h1>YUKIHA Ticket Transcript</h1><p>#${escapeHtml(channel.name)}</p></div>
${rows || '<p>메시지가 없습니다.</p>'}
</body>
</html>`;

  return new AttachmentBuilder(Buffer.from(html, 'utf-8'), {
    name: `${channel.name}-transcript.html`,
  });
}

import { sendGoodbye, sendWelcome } from '../utils/welcomeSender.js';

export async function handleGuildMemberAdd(member) {
  await sendWelcome(member).catch((error) => {
    console.error('[WELCOME] 환영 인사 처리 실패:', error);
  });
}

export async function handleGuildMemberRemove(member) {
  await sendGoodbye(member).catch((error) => {
    console.error('[GOODBYE] 퇴장 기록 처리 실패:', error);
  });
}

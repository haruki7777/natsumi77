export const TICKET_CATEGORIES = [
  {
    key: 'support',
    label: '일반 문의',
    description: '궁금한 점이나 도움이 필요할 때',
    emoji: '❄️',
  },
  {
    key: 'report',
    label: '신고 문의',
    description: '유저 신고, 서버 문제 제보',
    emoji: '🚨',
  },
  {
    key: 'payment',
    label: '결제/후원 문의',
    description: '결제, 후원, 보상 관련 문의',
    emoji: '💎',
  },
  {
    key: 'partner',
    label: '제휴 문의',
    description: '서버 제휴 및 협업 문의',
    emoji: '🤝',
  },
];

export const customIds = {
  ticketSelect: 'yukiha_ticket_select',
  ticketModalPrefix: 'yukiha_ticket_modal:',
  ticketReasonInput: 'yukiha_ticket_reason',
  saveTicket: 'yukiha_ticket_save',
  closeTicket: 'yukiha_ticket_close',
  reopenTicket: 'yukiha_ticket_reopen',
  deleteTicket: 'yukiha_ticket_delete',
};

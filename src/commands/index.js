import { ticketSetupCommand } from './ticketSetup.js';
import { ticketManageCommand } from './ticketManage.js';
import { ticketSetupEnglishCommand } from './ticketSetupEnglish.js';
import { ticketManageEnglishCommand } from './ticketManageEnglish.js';

const list = [];
list.push(ticketSetupCommand);
list.push(ticketManageCommand);
list.push(ticketSetupEnglishCommand);
list.push(ticketManageEnglishCommand);

export const commands = list;

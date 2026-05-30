import { ticketSetupCommand } from './ticketSetup.js';
import { ticketManageCommand } from './ticketManage.js';
import { ticketSetupEnglishCommand } from './ticketSetupEnglish.js';
import { ticketManageEnglishCommand } from './ticketManageEnglish.js';
import { pingCommand } from './ping.js';
import { helpCommand } from './help.js';
import { welcomeSetupCommand } from './welcomeSetup.js';
import { welcomeTestCommand } from './welcomeTest.js';
import { adminSetupCommand } from './adminSetup.js';
import { kickCommand } from './kick.js';
import { banCommand } from './ban.js';
import { syncCommandsCommand } from './syncCommands.js';

const list = [];
list.push(ticketSetupCommand);
list.push(ticketManageCommand);
list.push(ticketSetupEnglishCommand);
list.push(ticketManageEnglishCommand);
list.push(pingCommand);
list.push(helpCommand);
list.push(welcomeSetupCommand);
list.push(welcomeTestCommand);
list.push(adminSetupCommand);
list.push(kickCommand);
list.push(banCommand);
list.push(syncCommandsCommand);

export const commands = list;

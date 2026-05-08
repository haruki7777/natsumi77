import { Client, Collection, Events, GatewayIntentBits, Partials } from 'discord.js';
import { commands } from './commands/index.js';
import { config, validateConfig } from './config.js';
import { connectDatabase } from './database.js';
import { handleInteraction } from './events/interactionCreate.js';
import { handleReady } from './events/ready.js';

validateConfig();
await connectDatabase();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();
for (const command of commands) {
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => handleReady(client));
client.on(Events.InteractionCreate, (interaction) => handleInteraction(interaction, client.commands));

client.on('shardDisconnect', (event, shardId) => {
  console.warn(`[Discord] Shard ${shardId} disconnected. code=${event?.code ?? 'unknown'} reason=${event?.reason ?? 'unknown'}`);
});

client.on('shardReconnecting', (shardId) => {
  console.warn(`[Discord] Shard ${shardId} reconnecting...`);
});

client.on('error', (error) => {
  console.error('[Discord Client Error]', error);
});

client.on('warn', (warning) => {
  console.warn('[Discord Client Warning]', warning);
});

process.on('unhandledRejection', (error) => console.error('[UnhandledRejection]', error));
process.on('uncaughtException', (error) => console.error('[UncaughtException]', error));

await client.login(config.token);

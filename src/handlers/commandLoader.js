import fs from 'node:fs/promises';
import path from 'node:path';
import { Collection } from 'discord.js';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '../commands');
  const files = [];

  async function walk(dir) {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.js')) files.push(full);
    }
  }

  await walk(commandsPath);
  client.commands = new Collection();

  for (const file of files) {
    const module = await import(pathToFileURL(file).href);
    const command = module.default ?? module;
    if (!command?.data || !command?.execute) continue;
    client.commands.set(command.data.name, command);
  }

  return [...client.commands.values()];
}

export async function registerCommands(client, config) {
  const commands = [...client.commands.values()].map(command => command.data.toJSON());

  if (config.discord.guildId) {
    const guild = await client.guilds.fetch(config.discord.guildId);
    await guild.commands.set(commands);
    console.log(`Registered ${commands.length} guild command(s).`);
  } else {
    await client.application.commands.set(commands);
    console.log(`Registered ${commands.length} global command(s).`);
  }
}

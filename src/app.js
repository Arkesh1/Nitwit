import 'dotenv/config';

import {
  Client,
  Collection,
  GatewayIntentBits,
  Partials,
  Events
} from 'discord.js';

import config from './config/config.js';
import { loadCommands, registerCommands } from './handlers/commandLoader.js';
import {
  rememberNitwitMessage,
  replyToNitwitMention,
  maybeAutoReply
} from './services/nitwitService.js';


class NitwitClient extends Client {
  constructor() {
    super({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ],
      partials: [
        Partials.Channel,
        Partials.Message
      ]
    });

    this.commands = new Collection();
  }
}

const client = new NitwitClient();

if (!config.discord.token) {
  throw new Error('DISCORD_TOKEN is missing from .env');
}

if (!config.discord.clientId) {
  throw new Error('CLIENT_ID is missing from .env');
}

if (!config.groq.apiKey) {
  throw new Error('GROQ_API_KEY is missing from .env');
}

client.once(Events.ClientReady, async readyClient => {
  console.log(`Nitwit online as ${readyClient.user.tag}`);
    readyClient.user.setPresence({
    status: 'online',
    activities: [
      {
        name: 'Custom Status',
        state: 'Powered By Railway!',
        type: 4
      }
    ]
  });


  try {
    await registerCommands(client, config);
    console.log('Nitwit slash commands registered.');
  } catch (error) {
    console.error('Failed to register slash commands:', error);
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, config, client);
  } catch (error) {
    console.error(`Command /${interaction.commandName} failed:`, error);

    const response = {
      content: 'Something went wrong.',
      ephemeral: true
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(response).catch(() => {});
    } else {
      await interaction.reply(response).catch(() => {});
    }
  }
});

client.on(Events.MessageCreate, async message => {
  if (!message.guild || message.author.bot) {
    return;
  }

  // Store every normal user message first.
  rememberNitwitMessage(message);

  const isNitwitMentioned =
    message.mentions.users.has(
      client.user.id
    ) ||
    /\bnitwit\b/i.test(
      message.content
    );

  // @Nitwit / "nitwit" gets priority.
  if (isNitwitMentioned) {
    const result =
      await replyToNitwitMention(
        message
      );

    await message.reply({
      content: result.reply,
      allowedMentions: {
        repliedUser: false
      }
    }).catch(error =>
      console.error(
        'Mention reply failed:',
        error
      )
    );

    return;
  }

  // Automatic behavior is limited
  // to the configured channel.
  if (
    config.nitwit.channelId &&
    message.channelId !==
      config.nitwit.channelId
  ) {
    return;
  }

  try {
    const reply =
      await maybeAutoReply(
        message
      );

    if (!reply) {
      return;
    }

    await message.reply({
      content: reply,
      allowedMentions: {
        repliedUser: false
      }
    });

  } catch (error) {
    console.error(
      'Automatic Nitwit reply failed:',
      error
    );
  }
});
  // Automatic behavior is limited to the configured channel.
  if (
    config.nitwit.channelId &&
    message.channelId !== config.nitwit.channelId
  ) {
    return;
  }

  try {
    const reply = await maybeAutoReply(message);
    if (!reply) return;

    await message.reply({
      content: reply,
      allowedMentions: { repliedUser: false }
    });
  } catch (error) {
    console.error('Automatic Nitwit reply failed:', error);
  }
});

const commands = await loadCommands(client);
console.log(`Loaded ${commands.length} command(s).`);

await client.login(config.discord.token);

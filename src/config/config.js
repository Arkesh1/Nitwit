import 'dotenv/config';

function numberEnv(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

export default {
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID || null
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions'
  },

  nitwit: {
    channelId: process.env.NITWIT_CHANNEL_ID || null,
    autoReplyChance: numberEnv('NITWIT_AUTO_REPLY_CHANCE', 0.08),
    globalCooldownMs: numberEnv('NITWIT_GLOBAL_COOLDOWN_MS', 180000),
    userCooldownMs: numberEnv('NITWIT_USER_COOLDOWN_MS', 900000),
    contextMessages: numberEnv('NITWIT_CONTEXT_MESSAGES', 4),
    maxOutputTokens: numberEnv('NITWIT_MAX_OUTPUT_TOKENS', 80),

    mentionReplies: [
      'Why are you tagging me? I am very busy doing nothing!',
      'Why did you summon me? I was busy doing absolutely nothing.',
      "Please don't disturb me. I'm currently busy doing nothing.",
      'You tagged me? Unbelievable. I was doing nothing important.',
      "What do you want? Can't you see I'm extremely busy doing nothing?",
      'I was peacefully doing nothing and now you ruined it.'
    ]
  }
};

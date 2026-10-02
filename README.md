# Nitwit

A separate Discord bot inspired by the modular structure of TitanBot.

## Features

- `@Nitwit` → fixed random response, **never calls AI**
- `/nitwit` → forces one AI-generated response to the current conversation
- Automatic contextual replies in one configured channel
- Random response probability
- Global and per-user cooldowns
- Recent-message context buffer
- Groq/OpenAI-compatible chat completions
- If the latest message starts a new topic, the AI is instructed to focus on the latest message instead of unrelated older messages

## Requirements

- Node.js 20+
- Discord bot application
- Discord Message Content Intent
- Groq API key

## Setup

1. Copy `.env.example` to `.env`.
2. Fill in:
   - `DISCORD_TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID` (recommended while testing)
   - `GROQ_API_KEY`
   - `NITWIT_CHANNEL_ID`
3. Install dependencies:

```bash
npm install
```

4. Start:

```bash
npm start
```

During development:

```bash
npm run dev
```

## Important settings

```env
NITWIT_AUTO_REPLY_CHANCE=0.08
NITWIT_GLOBAL_COOLDOWN_MS=180000
NITWIT_USER_COOLDOWN_MS=900000
NITWIT_CONTEXT_MESSAGES=15
NITWIT_MAX_OUTPUT_TOKENS=80
```

The 8% value is only the probability that Nitwit gets an opportunity to speak. The global cooldown then prevents it from talking too frequently.

## Discord permissions/intents

Enable **Message Content Intent** in the Discord Developer Portal.

The bot needs at least:

- View Channels
- Send Messages
- Read Message History

## Current architecture

```text
src/
├── app.js
├── commands/
│   └── Nitwit/
│       └── nitwit.js
├── config/
│   └── config.js
├── handlers/
│   └── commandLoader.js
└── services/
    ├── conversationService.js
    ├── groqService.js
    └── nitwitService.js
```

This is intentionally separate from TitanBot. TitanBot was used as the structural reference; Nitwit has its own bot token, application, configuration, and codebase.

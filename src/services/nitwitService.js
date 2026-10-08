import config from '../config/config.js';
import {
  generateNitwitReply
} from './groqService.js';

const MIN_MESSAGES = 5;
const MAX_MESSAGES = 10;

// Keep recent messages separately for each channel.
const channelMessages = new Map();

// Track automatic reply counters separately for each channel.
const channelCounters = new Map();

const MAX_CONTEXT_MESSAGES = 15;

function randomMessageTarget() {
  return (
    Math.floor(
      Math.random() *
        (MAX_MESSAGES - MIN_MESSAGES + 1)
    ) + MIN_MESSAGES
  );
}

function getChannelState(channelId) {
  if (!channelCounters.has(channelId)) {
    channelCounters.set(channelId, {
      count: 0,
      target: randomMessageTarget()
    });
  }

  return channelCounters.get(channelId);
}

/**
 * Store a message in Nitwit's local conversation memory.
 */
export function rememberNitwitMessage(message) {
  if (!message?.channelId) {
    return;
  }

  const content =
    message.content?.trim();

  if (!content) {
    return;
  }

  if (!channelMessages.has(message.channelId)) {
    channelMessages.set(
      message.channelId,
      []
    );
  }

  const messages =
    channelMessages.get(message.channelId);

  messages.push({
    author: message.author?.username || 'User',
    content,
    isBot: Boolean(message.author?.bot),
    timestamp: Date.now()
  });

  // Keep only the latest messages.
  if (
    messages.length >
    MAX_CONTEXT_MESSAGES
  ) {
    messages.splice(
      0,
      messages.length - MAX_CONTEXT_MESSAGES
    );
  }
}

/**
 * Get recent messages for a channel.
 */
function getNitwitContext(
  channelId,
  limit = 3
) {
  const messages =
    channelMessages.get(channelId) || [];

  return messages.slice(
    Math.max(0, messages.length - limit)
  );
}

/**
 * Convert our local messages into the format
 * expected by the Groq service.
 */
function formatContext(messages) {
  return messages.map(message => ({
    author: message.author,
    content: message.content
  }));
}

/**
 * Check whether recent conversation actually
 * contains something worth responding to.
 */
function hasUsefulContext(messages) {
  if (
    !Array.isArray(messages) ||
    messages.length === 0
  ) {
    return false;
  }

  const ignored = new Set([
    'lol',
    'lmao',
    'haha',
    'hahaha',
    'ok',
    'okay',
    'yes',
    'no',
    'bro',
    'bruh',
    'nitwit',
    '😂',
    '🤣',
    '😭',
    '?',
    '??',
    '???'
  ]);

  let usefulCount = 0;

  for (const message of messages) {
    const text =
      String(message.content || '')
        .trim()
        .toLowerCase();

    if (!text) {
      continue;
    }

    if (ignored.has(text)) {
      continue;
    }

    // Ignore extremely short messages.
    if (text.length < 4) {
      continue;
    }

    // Remove emojis and punctuation.
    const cleaned =
      text.replace(
        /[\p{Emoji_Presentation}\p{Extended_Pictographic}\s!?.,]+/gu,
        ''
      );

    if (!cleaned) {
      continue;
    }

    usefulCount++;
  }

  return usefulCount >= 1;
}

/**
 * Determine whether the message calls Nitwit.
 */
export function isNitwitNameTrigger(
  message,
  client
) {
  const content =
    message.content?.toLowerCase() || '';

  const mentioned =
    message.mentions?.users?.has(
      client.user.id
    );

  const named =
    /\bnitwit\b/i.test(content);

  return mentioned || named;
}

/**
 * Handle @Nitwit / "nitwit" messages.
 *
 * Uses the current message + up to 2 previous
 * messages when useful context exists.
 */
export async function replyToNitwitMention(
  message
) {
  try {
    const allMessages =
      getNitwitContext(
        message.channelId,
        3
      );

    console.log(
      `Nitwit mention: found ${allMessages.length} recent message(s).`
    );

    // Need at least 2 messages so Nitwit has
    // an actual conversation to understand.
    if (allMessages.length < 2) {
      console.log(
        'Nitwit mention: not enough context, using preset reply.'
      );

      return {
        reply: getMentionReply(),
        usedAI: false
      };
    }

    if (!hasUsefulContext(allMessages)) {
      console.log(
        'Nitwit mention: no useful context, using preset reply.'
      );

      return {
        reply: getMentionReply(),
        usedAI: false
      };
    }

    console.log(
      'Nitwit mention: useful context found, using Groq.'
    );

    const context =
      formatContext(allMessages);

    const reply =
      await generateNitwitReply(context);

    if (!reply) {
      return {
        reply: getMentionReply(),
        usedAI: false
      };
    }

    return {
      reply,
      usedAI: true
    };

  } catch (error) {
    console.error(
      'Nitwit mention error:',
      error
    );

    return {
      reply: getMentionReply(),
      usedAI: false
    };
  }
}

/**
 * Random 5–10 message auto-reply.
 */
function shouldAutoReply(channelId) {
  const state =
    getChannelState(channelId);

  state.count++;

  console.log(
    `Nitwit counter [${channelId}]: ${state.count}/${state.target}`
  );

  if (
    state.count <
    state.target
  ) {
    return false;
  }

  // Reset immediately for the next cycle.
  state.count = 0;
  state.target =
    randomMessageTarget();

  console.log(
    `Nitwit will reply again after ${state.target} messages.`
  );

  return true;
}

export function getMentionReply() {
  return randomItem(
    config.nitwit.mentionReplies
  );
}

function randomItem(items) {
  return items[
    Math.floor(
      Math.random() * items.length
    )
  ];
}

/**
 * Automatic AI reply every 5–10 messages.
 */
export async function maybeAutoReply(
  message
) {
  if (
    !shouldAutoReply(
      message.channelId
    )
  ) {
    return null;
  }

  const context =
    getNitwitContext(
      message.channelId,
      config.nitwit.contextMessages || 5
    );

  console.log(
    `Nitwit auto-reply: found ${context.length} message(s).`
  );

  if (!context.length) {
    console.log(
      'Nitwit auto-reply: no context available.'
    );

    return null;
  }

  try {
    const reply =
      await generateNitwitReply(
        formatContext(context)
      );

    return reply || null;

  } catch (error) {
    console.error(
      'Nitwit auto-reply error:',
      error
    );

    return null;
  }
}

/**
 * /nitwit command.
 */
export async function forceReplyToCurrentContext(
  channel
) {
  const context =
    getNitwitContext(
      channel.id,
      config.nitwit.contextMessages || 5
    );

  console.log(
    `Nitwit /nitwit: found ${context.length} message(s).`
  );

  if (!context.length) {
    return 'I walked in and forgot what everyone was talking about.';
  }

  try {
    const reply =
      await generateNitwitReply(
        formatContext(context)
      );

    return (
      reply ||
      'My brain is buffering.'
    );

  } catch (error) {
    console.error(
      'Nitwit /nitwit error:',
      error
    );

    return 'Something exploded in my brain.';
  }
}

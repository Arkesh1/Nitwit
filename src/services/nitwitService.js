import config from '../config/config.js';
import {
  getRecentMessages
} from './conversationService.js';

import {
  generateNitwitReply
} from './groqService.js';

const MIN_MESSAGES = 5;
const MAX_MESSAGES = 10;

// Track each channel separately
const channelCounters = new Map();

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

function shouldAutoReply(channelId) {
  const state = getChannelState(channelId);

  state.count++;

  console.log(
    `Nitwit counter [${channelId}]: ${state.count}/${state.target}`
  );

  if (state.count < state.target) {
    return false;
  }

  state.count = 0;
  state.target = randomMessageTarget();

  console.log(
    `Nitwit will reply again after ${state.target} messages.`
  );

  return true;
}

function randomItem(items) {
  return items[
    Math.floor(Math.random() * items.length)
  ];
}

export function getMentionReply() {
  return randomItem(
    config.nitwit.mentionReplies
  );
}

/**
 * Detect whether a message directly calls Nitwit.
 */
export function isNitwitNameTrigger(message, client) {
  const content =
    message.content?.toLowerCase() || '';

  const isMentioned =
    message.mentions?.users?.has(client.user.id);

  const usesName =
    /\bnitwit\b/i.test(content);

  return isMentioned || usesName;
}

/**
 * Checks whether the conversation contains useful context
 * worth sending to Groq.
 */
function hasUsefulContext(context) {
  if (!Array.isArray(context) || context.length === 0) {
    return false;
  }

  const ignoredMessages = new Set([
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

  let usefulMessages = 0;

  for (const item of context.slice(-3)) {
    const content =
      typeof item === 'string'
        ? item
        : item?.content || '';

    const text = content
      .trim()
      .toLowerCase();

    if (!text) {
      continue;
    }

    if (ignoredMessages.has(text)) {
      continue;
    }

    // Ignore extremely short/random messages.
    if (text.length < 4) {
      continue;
    }

    // Ignore messages that are only emojis/punctuation.
    const cleaned = text.replace(
      /[\p{Emoji_Presentation}\p{Extended_Pictographic}\s!?.,]+/gu,
      ''
    );

    if (!cleaned) {
      continue;
    }

    usefulMessages++;
  }

  return usefulMessages >= 1;
}

/**
 * Handles a direct @Nitwit / "nitwit" request.
 *
 * Uses Groq only when the recent conversation
 * contains useful context.
 */
export async function replyToNitwitMention(message) {
  try {
    const context = getRecentMessages(
      message.channelId,
      3
    );

    console.log(
      `Nitwit mention: found ${context.length} recent message(s).`
    );

    if (!hasUsefulContext(context)) {
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
      'Nitwit mention context error:',
      error
    );

    return {
      reply: getMentionReply(),
      usedAI: false
    };
  }
}

export async function maybeAutoReply(message) {
  if (!shouldAutoReply(message.channelId)) {
    return null;
  }

  const context = getRecentMessages(
    message.channelId,
    config.nitwit.contextMessages
  );

  if (!context.length) {
    console.log(
      'Nitwit: no conversation history found.'
    );

    return null;
  }

  console.log(
    `Nitwit auto-reply: using ${context.length} message(s).`
  );

  try {
    const reply =
      await generateNitwitReply(context);

    if (!reply) {
      return null;
    }

    return reply;

  } catch (error) {
    console.error(
      'Nitwit auto-reply error:',
      error
    );

    return null;
  }
}

export async function forceReplyToCurrentContext(
  channel
) {
  const context = getRecentMessages(
    channel.id,
    config.nitwit.contextMessages
  );

  console.log(
    `Nitwit /nitwit: found ${context.length} message(s).`
  );

  if (!context.length) {
    return 'I walked in and forgot what everyone was talking about.';
  }

  try {
    const reply =
      await generateNitwitReply(context);

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

import config from '../config/config.js';
import {
  getRecentMessages
} from './conversationService.js';

import {
  generateNitwitReply
} from './groqService.js';

let messagesSinceLastReply = 0;

function shouldAutoReply() {
  messagesSinceLastReply++;

  // Reply every 2 messages
  if (messagesSinceLastReply >= 2) {
    messagesSinceLastReply = 0;
    return true;
  }

  return false;
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

export async function maybeAutoReply(message) {
  if (!shouldAutoReply()) {
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
    const reply = await generateNitwitReply(
      context
    );

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
    const reply = await generateNitwitReply(
      context
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

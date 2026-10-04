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

  // Reset for the next random interval
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

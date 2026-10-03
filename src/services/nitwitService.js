import config from '../config/config.js';
import {
  getRecentMessages
} from './conversationService.js';

import {
  generateNitwitReply
} from './groqService.js';

let lastGlobalReplyAt = 0;

const lastUserReplyAt = new Map();

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

function canAutoReply(userId) {
  const now = Date.now();

  if (
    now - lastGlobalReplyAt <
    config.nitwit.globalCooldownMs
  ) {
    return false;
  }

  const lastUser =
    lastUserReplyAt.get(userId) || 0;

  if (
    now - lastUser <
    config.nitwit.userCooldownMs
  ) {
    return false;
  }

  return (
    Math.random() <
    config.nitwit.autoReplyChance
  );
}

function markAutoReply(userId) {
  const now = Date.now();

  lastGlobalReplyAt = now;
  lastUserReplyAt.set(userId, now);
}

export async function maybeAutoReply(message) {
  if (!canAutoReply(message.author.id)) {
    return null;
  }

  const context = getRecentMessages(
    message.channelId,
    config.nitwit.contextMessages
  );

  if (!context.length) {
    console.log('Nitwit: no message history found.');
    return null;
  }

  console.log(
    `Nitwit automatic reply using ${context.length} message(s).`
  );

  const reply = await generateNitwitReply(context);

  if (!reply) {
    return null;
  }

  markAutoReply(message.author.id);

  return reply;
}

export async function forceReplyToCurrentContext(channel) {
  const context = getRecentMessages(
    channel.id,
    config.nitwit.contextMessages
  );

  console.log(
    `Nitwit /nitwit found ${context.length} message(s).`
  );

  if (!context.length) {
    return 'I walked in and forgot what everyone was talking about.';
  }

  return generateNitwitReply(context);
}

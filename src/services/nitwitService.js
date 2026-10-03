import config from '../config/config.js';
import { getRecentMessages } from './conversationService.js';
import { generateNitwitReply } from './groqService.js';

let lastGlobalReplyAt = 0;
const lastUserReplyAt = new Map();

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function getMentionReply() {
  return randomItem(config.nitwit.mentionReplies);
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

  return Math.random() < config.nitwit.autoReplyChance;
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

  const context = await getRecentMessages(
    message.channelId,
    config.nitwit.contextMessages
  );

  if (!context.length) {
    return null;
  }

  const reply = await generateNitwitReply(context);

  if (!reply) {
    return null;
  }

  markAutoReply(message.author.id);

  return reply;
}

export async function forceReplyToCurrentContext(message) {
  const context = await getRecentMessages(
    message.channelId,
    config.nitwit.contextMessages
  );

  if (!context.length) {
    return null;
  }

  return generateNitwitReply(context, {
    forceReply: true
  });
}

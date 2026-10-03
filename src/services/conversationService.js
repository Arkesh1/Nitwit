const histories = new Map();

export function rememberMessage(message, maxMessages = 30) {
  if (!message.guildId) return;

  const list = histories.get(message.channelId) || [];

  list.push({
    id: message.id,
    userId: message.author.id,
    username: message.member?.displayName || message.author.globalName || message.author.username,
    content: message.cleanContent.trim(),
    timestamp: message.createdTimestamp
  });

  while (list.length > maxMessages) list.shift();
  histories.set(message.channelId, list);
}

export function getRecentMessages(channelId, count = 15) {
  const list = histories.get(channelId) || [];
  return list.slice(-count);
}

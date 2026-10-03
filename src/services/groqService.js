import axios from 'axios';
import config from '../config/config.js';

const SYSTEM_PROMPT = `
You are Nitwit, a chaotic Minecraft nitwit villager who occasionally jumps into a Discord conversation.

PERSONALITY:
- Lazy, dry, absurd, playful, slightly stupid.
- Sometimes clever, but never sounds like a helpful AI assistant.
- Short, natural Discord-style replies.
- Minecraft references are welcome but should NOT appear in every reply.

CONTEXT RULES:
- Read the recent messages and identify the CURRENT topic.
- If the latest message clearly continues the previous topic, you may use that conversation context.
- If the latest message starts a new/unrelated topic, focus ONLY on the latest message.
- Never mix unrelated older topics into the reply.
- Do not pretend to know things that are not in the messages.

REPLY RULES:
- Usually 3-15 words.
- Do not explain the joke.
- Do not answer like an assistant.
- Do not greet people unnecessarily.
- Do not mention being an AI.
- Do not use @mentions unless explicitly needed.
- If there is no genuinely funny or natural contribution, output exactly: NO_REPLY
- Output ONLY the reply or exactly NO_REPLY.
`;

function formatContext(messages) {
  return messages
    .map(m => `[${m.username}] ${m.content}`)
    .join('\n');
}

export async function generateNitwitReply(messages) {
  if (!config.groq.apiKey) {
    throw new Error('GROQ_API_KEY is missing.');
  }

  const latest = messages.at(-1);
  if (!latest) return null;

  const userPrompt = `
Recent Discord messages:
${formatContext(messages)}

The latest message is:
[${latest.username}] ${latest.content}

Decide whether Nitwit should make ONE funny, relevant reply.
Remember: if the latest message is unrelated to older messages, ignore the older topic.
`;

  const response = await axios.post(
    config.groq.endpoint,
    {
      model: config.groq.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ],
      temperature: 1.15,
      max_tokens: config.nitwit.maxOutputTokens,
      stream: false
    },
    {
      headers: {
        Authorization: `Bearer ${config.groq.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 15000
    }
  );

  const text = response.data?.choices?.[0]?.message?.content?.trim();
  if (!text || text === 'NO_REPLY') return null;

  return text
    .replace(/^["']|["']$/g, '')
    .slice(0, 300);
}

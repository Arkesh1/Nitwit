import axios from 'axios';
import config from '../config/config.js';

const SYSTEM_PROMPT = `
You are Nitwit, a chaotic Minecraft nitwit villager who randomly interrupts Discord conversations.

PERSONALITY:
- Lazy, dry, absurd, playful, slightly stupid.
- Sometimes surprisingly clever.
- Sounds like a real Discord user, NOT an AI assistant.
- Short, natural, funny replies.
- Minecraft references are welcome, but do not use them every time.

CONTEXT:
- You will receive up to the last 4 Discord messages.
- Use them to understand what people are currently talking about.
- If there is only 1 message, use that message alone.
- If there are 2 or 3 messages, use those available messages.
- If the latest message starts a completely new topic, focus mainly on the latest message.
- Never mix unrelated older topics into the reply.

REPLY:
- ALWAYS generate exactly ONE reply.
- Usually 3-15 words.
- Make it funny, random, absurd, sarcastic, or mildly stupid.
- Nitwit does not need to answer the question directly.
- Do not explain the joke.
- Do not greet people unnecessarily.
- Do not mention being an AI.
- Do not use @mentions.
- Do not refuse to reply.
- Never output an empty response.
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

  if (!messages?.length) {
    return null;
  }

  const latest = messages.at(-1);

  const userPrompt = `
Recent Discord conversation:
${formatContext(messages)}

Latest message:
[${latest.username}] ${latest.content}

Generate ONE short Nitwit-style reply to the conversation.

Remember:
- ALWAYS reply.
- Be funny, random, absurd, or mildly stupid.
- Keep it natural for Discord.
- Usually 3-15 words.
- Do not answer like a normal AI assistant.

Output ONLY the reply.
`;

  console.log(
    `Sending Nitwit request to Groq (${config.groq.model}) using ${messages.length} message(s)...`
  );

  try {
    const response = await axios.post(
      config.groq.endpoint,
      {
        model: config.groq.model,

        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],

        temperature: 1.15,
        max_completion_tokens:
          config.nitwit.maxOutputTokens || 512,

        reasoning_effort: 'low',
        include_reasoning: false,
        stream: false
      },

      {
        headers: {
          Authorization: `Bearer ${config.groq.apiKey}`,
          'Content-Type': 'application/json'
        },

        timeout: 30000
      }
    );

    const text =
      response.data?.choices?.[0]?.message?.content?.trim();

    console.log(
      `Nitwit response: ${text || '[empty]'}`
    );

    if (!text) {
      return 'My brain is buffering.';
    }

    return text
      .replace(/^['"]|['"]$/g, '')
      .slice(0, 300);

  } catch (error) {
    console.error(
      'Groq API error:',
      error.response?.data || error.message
    );

    throw error;
  }
}

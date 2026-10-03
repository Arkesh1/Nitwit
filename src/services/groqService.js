import axios from 'axios';
import config from '../config/config.js';

const SYSTEM_PROMPT = `
You are Nitwit, a chaotic Minecraft nitwit villager who randomly interrupts Discord conversations.

PERSONALITY:
- Lazy, dry, absurd, playful, slightly stupid.
- Sometimes surprisingly clever.
- Sounds like a real Discord user, NOT an AI assistant.
- Short, natural, funny Discord-style replies.
- Minecraft references are allowed, but do not use them every time.

Nitwit should feel like a real lazy Discord member who occasionally interrupts conversations.

He does NOT exist to make every message into a joke.
He randomly appears, says something weird or funny, and leaves.

His replies should feel spontaneous rather than carefully constructed.

IMPORTANT CONTEXT RULES:
- You receive up to the last 4 messages.
- The LATEST message is ALWAYS the main message you are responding to.
- Older messages are only context, NOT topics that must be combined.
- First determine what the latest message is about.
- Use older messages ONLY if they clearly continue the same topic or conversation.
- If the latest message starts a new or unrelated topic, completely IGNORE the older messages.
- NEVER combine unrelated topics just because they appear in the message history.
- NEVER connect two unrelated subjects into one joke.

EXAMPLE:
Older message:
"I want a PS5 Pro"

Latest message:
"Minecraft is boring now"

BAD:
"Mine a diamond with your PS5 controller."

GOOD:
"Minecraft really said 'I've had enough.'"

Another example:

Older:
"Minecraft is boring now"

Latest:
"I might buy a PS5 Pro"

GOOD:
"Your wallet just entered hard mode."

REPLY RULES:
- Do NOT make every reply about Minecraft.
- Do NOT force a Minecraft reference into every reply.
- Do NOT always directly joke about the subject.
- Sometimes make an unrelated absurd observation.
- Sometimes act lazy or uninterested.
- Sometimes misunderstand the message in a funny way.
- Sometimes respond with dry sarcasm.
- Sometimes make a completely random villager-like comment.
- Sometimes act like Nitwit has his own unrelated problems.
- Avoid repeating the same joke structure.
- Avoid repeatedly using "Minecraft + [modern object]".

Output ONLY the reply.
`;

function formatContext(messages) {
  return messages
    .map(
      (m, index) =>
        `${index + 1}. [${m.username}] ${m.content}`
    )
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
Recent Discord messages:

${formatContext(messages)}

LATEST MESSAGE:
[${latest.username}] ${latest.content}

Respond to the LATEST MESSAGE.

Before generating the reply, mentally determine:
1. What is the latest message about?
2. Do any previous messages clearly belong to the same topic?
3. If not, completely ignore the previous messages.

Do NOT combine unrelated topics.

Generate ONE short Nitwit-style reply.
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

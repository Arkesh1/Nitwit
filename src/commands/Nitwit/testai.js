import { SlashCommandBuilder } from 'discord.js';
import axios from 'axios';
import config from '../../config/config.js';

export const data = new SlashCommandBuilder()
  .setName('testai')
  .setDescription('Ask the AI about the latest message.');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const messages = await interaction.channel.messages.fetch({
      limit: 10
    });

    const latestMessage = messages
      .filter(message => !message.author.bot)
      .first();

    if (!latestMessage) {
      return interaction.editReply('No recent message found.');
    }

    const question = latestMessage.content.trim();

    if (!question) {
      return interaction.editReply('The latest message has no text to ask.');
    }

    console.log(`Test AI question: ${question}`);

    const response = await axios.post(
      config.groq.endpoint,
      {
        model: config.groq.model,
        messages: [
          {
            role: 'system',
            content:
              'Answer the user question clearly and naturally. Do not mention being an AI unless relevant.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        temperature: 0.7,
        max_completion_tokens: 512,
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

    const answer =
      response.data?.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      return interaction.editReply('The AI returned an empty response.');
    }

    console.log(`Test AI answer: ${answer}`);

    await interaction.editReply(answer.slice(0, 2000));
  } catch (error) {
    console.error(
      'Test AI error:',
      error.response?.data || error.message
    );

    await interaction.editReply(
      'AI request failed. Check the Railway logs.'
    );
  }
}

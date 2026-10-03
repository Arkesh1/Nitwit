import { SlashCommandBuilder } from 'discord.js';
import { forceReplyToCurrentContext } from '../../services/nitwitService.js';

export const data = new SlashCommandBuilder()
  .setName('nitwit')
  .setDescription('Make Nitwit reply to the current conversation.');

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const reply = await forceReplyToCurrentContext(
      interaction.channel
    );

    if (!reply) {
      return interaction.editReply(
        'My brain stopped working. Try again.'
      );
    }

    await interaction.editReply(reply);

  } catch (error) {
    console.error('Nitwit command error:', error);

    await interaction.editReply(
      'Something exploded in my brain.'
    );
  }
}

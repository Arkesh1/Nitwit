import { SlashCommandBuilder } from 'discord.js';
import { forceReplyToCurrentContext } from '../../services/nitwitService.js';

const NITWIT_ROLE_ID = '1553049952899567616';

export const data = new SlashCommandBuilder()
  .setName('nitwit')
  .setDescription('Make Nitwit reply to the current conversation.');

export async function execute(interaction) {
  // Check role
  if (!interaction.member.roles.cache.has(NITWIT_ROLE_ID)) {
    return interaction.reply({
      content: 'You are not allowed to use this command.',
      ephemeral: true
    });
  }

  await interaction.deferReply();

  try {
    const reply = await forceReplyToCurrentContext(
      interaction.channel
    );

    await interaction.editReply(
      reply || 'My brain is buffering.'
    );

  } catch (error) {
    console.error('Nitwit command error:', error);

    await interaction.editReply(
      'Something exploded in my brain.'
    );
  }
}

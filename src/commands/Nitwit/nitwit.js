import { SlashCommandBuilder } from 'discord.js';
import { forceReplyToCurrentContext } from '../../services/nitwitService.js';

export default {
  data: new SlashCommandBuilder()
    .setName('nitwit')
    .setDescription('Make Nitwit react to the current conversation once.'),

  category: 'Nitwit',

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const reply = await forceReplyToCurrentContext(interaction.channel);

      if (!reply) {
        await interaction.editReply('I have nothing useful to say. This is exhausting.');
        return;
      }

      await interaction.editReply(reply);
    } catch (error) {
      console.error('Nitwit command error:', error);
      await interaction.editReply('My brain has stopped working. Try again later.');
    }
  }
};

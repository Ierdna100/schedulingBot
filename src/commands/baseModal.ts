import { ActionRowModalData, CacheType, CommandInteractionOptionResolver, ModalBuilder, ModalComponentData, ModalSubmitInteraction } from 'discord.js';

abstract class BaseModal {
    abstract modalBuilder: ModalBuilder;

    abstract reply(
        interaction: ModalSubmitInteraction<CacheType>, 
        userId: string,
        components: ActionRowModalData[]
        ): Promise<void>;
}

export {BaseModal};

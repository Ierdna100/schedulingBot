// prettier-ignore
import { ActionRowModalData, CacheType, CommandInteractionOptionResolver, ModalBuilder, ModalComponentData, ModalSubmitFields, ModalSubmitInteraction } from "discord.js";
import { InteractionReply } from "../../dto/InteractionArguments.js";

abstract class Modal_Base {
    abstract modalBuilder: ModalBuilder;

    abstract reply(interaction: ModalSubmitInteraction<CacheType>, userId: string, components: ModalSubmitFields): Promise<InteractionReply>;
}

export default Modal_Base;

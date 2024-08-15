import {
    BaseMessageOptions,
    CacheType,
    ChatInputCommandInteraction,
    CommandInteractionOptionResolver,
    InteractionReplyOptions,
    MessagePayload
} from "discord.js";

export type CommandInteraction = ChatInputCommandInteraction<CacheType>;

export type CommandOptions = Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">;

export type InteractionReply = string | MessagePayload | InteractionReplyOptions | null;

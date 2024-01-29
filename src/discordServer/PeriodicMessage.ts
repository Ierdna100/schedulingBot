import { Message, MessageEditOptions, TextChannel } from "discord.js";
import { PeriodicMessageType } from "../dto/PeriodicMessageType.js";
import { Application } from "../Application.js";
import { MongoModels } from "../dto/MongoModels.js";

export abstract class PeriodicMessage {
    public abstract messageType: PeriodicMessageType;
    public messageToUpdate: Message | undefined;
    public channel: TextChannel | undefined;

    constructor(channelId: string) {
        this.initializePeriodicMessage(channelId);
    }

    public async initializePeriodicMessage(channelId: string) {
        let channel = await Application.instance.discordClient.client.channels.fetch(channelId);

        if (channel == null) {
            throw new Error("Channel provided for periodic message was null!");
        }

        if (!channel.isTextBased()) {
            throw new Error("Channel provided for periodic message was not text based!");
        }

        this.channel = channel as TextChannel;
        let messageData = (await Application.instance.collections.periodicMessages.findOne({
            type: this.messageType
        })) as MongoModels.PeriodicMessageMetadata | null;

        if (messageData == null) {
            await this.createPeriodicMessage();
        } else {
            try {
                this.messageToUpdate = await channel.messages.fetch(messageData.messageId);
            } catch (e) {
                this.createPeriodicMessage();
            }
        }

        Application.logger.info(`Periodic message of type ${this.messageType} initialized!`);

        await this.fetchNewestData();
        await this.updateMessage();
    }

    public async checkMessageExistsAndUpdate(messageContent: MessageEditOptions): Promise<void> {
        if (this.messageToUpdate == undefined) {
            await this.createPeriodicMessage();
            return;
        }

        try {
            await this.messageToUpdate.edit(messageContent);
            return;
        } catch (e) {
            await this.createPeriodicMessage();
            await this.messageToUpdate.edit(messageContent);
        }
    }

    public async createPeriodicMessage(): Promise<void> {
        await Application.instance.collections.periodicMessages.deleteMany({ type: this.messageType });

        this.messageToUpdate = await this.channel!.send("**Periodic Message Template**");
        await Application.instance.collections.periodicMessages.insertOne({
            type: this.messageType,
            messageId: this.messageToUpdate.id
        });

        Application.logger.info(`Periodic message of type ${this.messageType} created!`);
    }

    public abstract fetchNewestData(): Promise<void>;

    public abstract updateMessage(): Promise<void>;
}

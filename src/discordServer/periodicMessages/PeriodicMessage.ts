import { Message, TextChannel } from "discord.js";
import { Application } from "../../Application.js";
import { PeriodicMessageType } from "../../dto/PeriodicMessageType.js";
import { MongoModels } from "../../dto/MongoModels.js";
import { Schedule } from "../../dto/Schedule.js";
import { ScheduleFormatter } from "../../UI/ScheduleFormatter.js";
import { EmbedColors } from "../../dto/EmbedColors.js";

export class PeriodicMessage {
    public messageType = PeriodicMessageType.schedules;
    public messageToUpdate: Message | undefined;
    public channel: TextChannel | undefined;
    public schedulesInMemory: Schedule[] | undefined;

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
        let messageData = (await Application.instance.collections.periodicMessages.findOne({ type: this.messageType })) as MongoModels.PeriodicMessageMetadata;

        if (messageData == null) {
            await this.createPeriodicMessage();
        } else {
            this.messageToUpdate = await this.channel.messages.fetch(messageData.messageId);
        }

        await this.updateMessage();
    }

    public async createPeriodicMessage(): Promise<void> {
        this.messageToUpdate = await this.channel!.send("**Periodic Message Template**");
        await Application.instance.collections.periodicMessages.insertOne({
            type: this.messageType,
            messageId: this.messageToUpdate.id
        });
    }

    public async fetchNewestData(): Promise<void> {
        this.schedulesInMemory = (await Application.instance.collections.schedules.find().toArray()) as MongoModels.Schedule[];
    }

    public async updateMessage(): Promise<void> {
        if (this.schedulesInMemory == undefined) {
            await this.fetchNewestData();
        }

        const embed = (await ScheduleFormatter.FormatSchedulesAsEmbed(this.schedulesInMemory!))
            .setColor(EmbedColors.blue)
            .setTimestamp(new Date())
            .setFooter({ text: 'Want your name and schedule to appear here? Type "/help" and follow the instructions!' });

        this.messageToUpdate!.edit({ content: "", embeds: [embed] });

        setTimeout(() => this.updateMessage(), Application.instance.env.updateFreqSec * 1000);
    }
}

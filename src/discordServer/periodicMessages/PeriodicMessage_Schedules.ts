import { Application } from "../../Application.js";
import { PeriodicMessageType } from "../../dto/PeriodicMessageType.js";
import { MongoModels } from "../../dto/MongoModels.js";
import { Schedule } from "../../dto/Schedule.js";
import { ScheduleFormatter } from "../../UI/ScheduleFormatter.js";
import { EmbedColors } from "../../dto/EmbedColors.js";
import { PeriodicMessage } from "../PeriodicMessage.js";
import { APIEmbed, EmbedBuilder } from "discord.js";

export class PeriodicMessage_Schedules extends PeriodicMessage {
    public messageType = PeriodicMessageType.schedules;
    public schedulesInMemory: Schedule[] = [];

    public async fetchNewestData(): Promise<void> {
        this.schedulesInMemory = (await Application.instance.collections.schedules.find().toArray()) as MongoModels.Schedule[];
    }

    public async updateMessage(): Promise<void> {
        if (this.schedulesInMemory == undefined) {
            await this.fetchNewestData();
        }

        const embedsToSend: EmbedBuilder[] = [];
        const currentDate = new Date();

        const dataForToday = await ScheduleFormatter.formatSchedulesAsEmbed(this.schedulesInMemory!, new Date(currentDate), new Date(currentDate));
        embedsToSend.push(dataForToday.embed.setColor(EmbedColors.cyan));

        if (dataForToday.generateNextDay) {
            const midnightForNextDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
            midnightForNextDay.setHours(0, 0, 0, 0);

            const dataForTomorrow = await ScheduleFormatter.formatSchedulesAsEmbed(this.schedulesInMemory!, midnightForNextDay, midnightForNextDay);

            embedsToSend.push(dataForTomorrow.embed.setColor(EmbedColors.purple));
        }

        embedsToSend[embedsToSend.length - 1]
            .setTimestamp(new Date())
            .setFooter({ text: 'Want your name and schedule to appear here? Type "/help" and follow the instructions!' });

        this.checkMessageExistsAndUpdate({ content: "", embeds: embedsToSend });

        setTimeout(() => this.updateMessage(), Application.instance.env.updateFreqSec * 1000);
    }
}

import { Application } from "../../Application.js";
import { PeriodicMessageType } from "../../dto/PeriodicMessageType.js";
import { MongoModels } from "../../dto/MongoModels.js";
import { Schedule } from "../../dto/Schedule.js";
import { ScheduleFormatter } from "../../UI/ScheduleFormatter.js";
import { EmbedColors } from "../../dto/EmbedColors.js";
import { PeriodicMessage } from "../PeriodicMessage.js";

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

        const embed = (await ScheduleFormatter.FormatSchedulesAsEmbed(this.schedulesInMemory!))
            .setColor(EmbedColors.blue)
            .setTimestamp(new Date())
            .setFooter({ text: 'Want your name and schedule to appear here? Type "/help" and follow the instructions!' });

        this.checkMessageExistsAndUpdate({ content: "", embeds: [embed] });

        setTimeout(() => this.updateMessage(), Application.instance.env.updateFreqSec * 1000);
    }
}

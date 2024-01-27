// prettier-ignore
import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption } from "discord.js";
import fs from "fs";
import { BaseCRUDCommand } from "../BaseCRUDCommand.js";
import { Schools } from "../../../dto/Schools.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../../dto/InteractionArguments.js";
import { PermissionsManager } from "../../../administration/PermissionsManager.js";
import { Authlevel } from "../../../dto/AuthLevel.js";
import { CRUD } from "../../../dto/CRUD.js";
import { Application } from "../../../Application.js";
import { Dayoff } from "../../../dto/Dayoff.js";
import { MongoModels } from "../../../dto/MongoModels.js";
import { DaysInMonth } from "../../../dto/DaysInMonth.js";

class Command_Daysoff extends BaseCRUDCommand {
    // prettier-ignore
    public commandBuilder = new SlashCommandBuilder()
        .setName("daysoff")
        .setDescription("Manage the days off")
        .setDefaultMemberPermissions("8")
        .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName("add")
                .setDescription("Add a day off to the list of days off")
                .addStringOption(new SlashCommandStringOption()
                    .setName("day")
                    .setDescription("Day that will be off (YYYY/MM/DD)")
                    .setMinLength(10)
                    .setMaxLength(10)
                    .setRequired(true))
                .addStringOption(new SlashCommandStringOption()
                    .setName("reason")
                    .setDescription("Reason why day will be off")
                    .setMaxLength(64)
                    .setRequired(true))
                .addStringOption(new SlashCommandStringOption()
                    .setName("affected_school")
                    .setDescription("Schools affected by day off")
                    .addChoices(
                        { name: "Vanier", value: Schools.Vanier },
                        { name: "Bois-de-Boulogne", value: Schools.Bdeb },
                        { name: "All", value: Schools.All })
                    .setRequired(true)))
            .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName("remove")
                .setDescription("Remove a day off from the list of days off")
                .addStringOption(new SlashCommandStringOption()
                    .setName("day")
                    .setDescription("Day that will be off (YYYY/MM/DD)")
                    .setMinLength(10)
                    .setMaxLength(10)
                    .setRequired(true))
                .addStringOption(new SlashCommandStringOption()
                    .setName("affected_school")
                    .setDescription("Schools affected by day off")
                    .addChoices(
                        { name: "Vanier", value: Schools.Vanier },
                        { name: "Bois-de-Boulogne", value: Schools.Bdeb },
                        { name: "All", value: Schools.All })
                    .setRequired(true)))
            .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName("get")
                .setDescription("Get list of current days off"));

    async reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        if ((await PermissionsManager.getUserAuthLevel(executorId)) != Authlevel.admin) {
            return { content: "**You are not an administrator! You cannot use this command.**" };
        }

        switch (options.getSubcommand(true) as CRUD) {
            case CRUD.create:
                return await this.replyCreate(interaction, executorId, options);
            case CRUD.delete:
                return await this.replyDelete(interaction, executorId, options);
            case CRUD.read:
                return await this.replyRead(interaction, executorId, options);
        }
    }

    async replyRead(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const daysoffCount = await Application.instance.collections.daysoff.estimatedDocumentCount();
        if (daysoffCount == 0) {
            return "**No days off are registered!**";
        }

        let stringOutput = "# Days off\n";

        const daysoffUnorderedWCtors = (await Application.instance.collections.daysoff.find().toArray()) as unknown as MongoModels.Dayoff[];
        const daysOffUnordered: Dayoff[] = [];
        daysoffUnorderedWCtors.forEach((e) =>
            daysOffUnordered.push({
                date: new Date(e.date),
                reason: e.reason,
                affectedSchools: e.affectedSchools
            })
        );
        const daysoff = daysOffUnordered.sort((a, b) => a.date.getTime() - b.date.getTime());

        for (const school of Object.values(Schools)) {
            let schoolHasDayoff = false;

            for (const dayoff of daysoff) {
                if (dayoff.affectedSchools != school) {
                    continue;
                }

                if (!schoolHasDayoff) {
                    stringOutput += `## ${school}\n`;
                }

                schoolHasDayoff = true;
                stringOutput += `- \`${dayoff.date.toDateString()}\` : ${dayoff.reason}`;
            }
        }

        return { content: stringOutput, ephemeral: true };
    }

    async replyCreate(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const dayAsString = options.getString("day", true);
        const affectedSchoolsAsString = options.getString("affected_school", true);
        const reason = options.getString("reason");

        // String: 0000/00/00
        // CharAt: 0123456789
        if (!(dayAsString.charAt(4) == "/" && dayAsString.charAt(7) == "/")) {
            return "**Day declaration was invalid! Please use the `YYYY/MM/DD` format!";
        }

        const year = parseInt(dayAsString.substring(0, 4));
        const month = parseInt(dayAsString.substring(5, 7));
        const day = parseInt(dayAsString.substring(8));

        if (Number.isNaN(year)) return "**Year was NaN!**";
        if (Number.isNaN(month)) return "**Month was NaN!**";
        if (Number.isNaN(day)) return "**Day was NaN!**";

        if (month < 1 || month > 12) return "**Month was out of bounds!**";
        if (day < 1 || day > DaysInMonth[month]) return "**Day was out of bounds!**";

        const date = new Date(year, month, day, 0, 0, 0, 0);

        let affectedSchools: Schools;
        switch (affectedSchoolsAsString) {
            case Schools.Vanier:
                affectedSchools = Schools.Vanier;
                break;
            case Schools.Bdeb:
                affectedSchools = Schools.Bdeb;
                break;
            case Schools.All:
                affectedSchools = Schools.All;
                break;
            default:
                return "**School ID was invalid!**";
        }

        const existingDayoff = (await Application.instance.collections.daysoff.findOne({
            date: date,
            affectedSchools: affectedSchools
        })) as unknown as MongoModels.Dayoff | null;

        if (existingDayoff == null) {
            await Application.instance.collections.daysoff.insertOne({
                date: date,
                reason: reason,
                affectedSchools: affectedSchools
            });

            return `**Successfully added day off on \`${date.toDateString()}\` for schools \`${affectedSchools}\` for reason :** ${reason}`;
        }

        await Application.instance.collections.daysoff.replaceOne(
            { _id: existingDayoff._id },
            {
                date: date,
                reason: reason,
                affectedSchools: affectedSchools
            }
        );

        return `**Successfully replaced a day off on \`${date.toDateString()}\` for schools \`${affectedSchools}\` for reason :** ${reason}`;
    }

    async replyDelete(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const dayAsString = options.getString("day", true);
        const affectedSchoolsAsString = options.getString("affected_school", true);

        // String: 0000/00/00
        // CharAt: 0123456789
        if (!(dayAsString.charAt(4) == "/" && dayAsString.charAt(7) == "/")) {
            return "**Day declaration was invalid! Please use the `YYYY/MM/DD` format!";
        }

        const year = parseInt(dayAsString.substring(0, 4));
        const month = parseInt(dayAsString.substring(5, 7)) + 1;
        const day = parseInt(dayAsString.substring(8));

        if (Number.isNaN(year)) return "**Year was NaN!**";
        if (Number.isNaN(month)) return "**Month was NaN!**";
        if (Number.isNaN(day)) return "**Day was NaN!**";

        if (month < 1 || month > 12) return "**Month was out of bounds!**";
        if (day < 1 || day > DaysInMonth[month]) return "**Day was out of bounds!**";

        const date = new Date(year, month, day, 0, 0, 0, 0);

        const existingSchedule = await Application.instance.collections.daysoff.deleteOne({ date: date, affectedSchools: affectedSchoolsAsString });
        if (existingSchedule.acknowledged && existingSchedule.deletedCount) {
            return "**Successfully deleted day off!**";
        }

        return "**No day off found to delete**";
    }
}

export default Command_Daysoff;

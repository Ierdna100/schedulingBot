// prettier-ignore
import { SlashCommandBuilder, SlashCommandSubcommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption } from "discord.js";
import fs from "fs";
import { Schools } from "../../../dto/Schools.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../../dto/InteractionArguments.js";
import { PermissionsManager } from "../../../administration/PermissionsManager.js";
import { Authlevel } from "../../../dto/AuthLevel.js";
import { CRUD } from "../../../dto/CRUD.js";
import { Application } from "../../../Application.js";
import { Dayoff } from "../../../dto/Dayoff.js";
import { MongoModels } from "../../../dto/MongoModels.js";
import { DaysInMonth } from "../../../dto/DaysInMonth.js";
import { TimeFormatter } from "../../../UI/TimeFormatter.js";
import { CRUDCommand } from "../CRUDCommand.js";

class Command_Daysoff extends CRUDCommand {
    // prettier-ignore
    public commandBuilder = new SlashCommandBuilder()
        .setName("daysoff")
        .setDescription("Manage the days off")
        .setDefaultMemberPermissions("8")
        .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName(CRUD.create)
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
                .setName(CRUD.delete)
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
                .setName("addrange")
                .setDescription("Add a range of days off")
                .addStringOption(new SlashCommandStringOption()
                    .setName("start")
                    .setDescription("Day that will begin the series of days off (YYYY/MM/DD)")
                    .setMinLength(10)
                    .setMaxLength(10)
                    .setRequired(true))
                .addStringOption(new SlashCommandStringOption()
                    .setName("end")
                    .setDescription("Day that will begin the series of days off (YYYY/MM/DD)")
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
                    .setRequired(true))
                .addStringOption(new SlashCommandStringOption()
                    .setName("reason")
                    .setDescription("Reason why day will be off")
                    .setMaxLength(64)
                    .setRequired(true)))
            .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName(CRUD.read)
                .setDescription("Get list of current days off"));

    async reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        if ((await PermissionsManager.getUserAuthLevel(executorId)) != Authlevel.admin) {
            return { content: "**You are not an administrator! You cannot use this command.**" };
        }

        switch (options.getSubcommand(true) as CRUD | "addrange") {
            case CRUD.create:
                return await this.replyCreate(interaction, executorId, options);
            case CRUD.delete:
                return await this.replyDelete(interaction, executorId, options);
            case CRUD.read:
                return await this.replyRead(interaction, executorId, options);
            case "addrange":
                return await this.replyCreateMultiple(interaction, executorId, options);
        }
    }

    async replyRead(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const daysoffCount = await Application.instance.collections.daysoff.estimatedDocumentCount();
        if (daysoffCount == 0) {
            return { content: "**No days off are registered!**", ephemeral: true };
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
                stringOutput += `- \`${dayoff.date.toDateString()}\` : ${dayoff.reason}\n`;
            }
        }

        return { content: stringOutput, ephemeral: true };
    }

    async replyCreateMultiple(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const startDayAsString = options.getString("start", true);
        const endDayAsString = options.getString("end", true);
        const affectedSchools = options.getString("affected_school", true) as Schools;
        const reason = options.getString("reason", true);

        const datePossibleErrorStart = TimeFormatter.stringToDate(startDayAsString);
        if (datePossibleErrorStart.isError) {
            return { content: datePossibleErrorStart.message, ephemeral: true };
        }
        const startDate = datePossibleErrorStart.date;

        const datePossibleErrorEnd = TimeFormatter.stringToDate(endDayAsString);
        if (datePossibleErrorEnd.isError) {
            return { content: datePossibleErrorEnd.message, ephemeral: true };
        }
        const endDate = datePossibleErrorEnd.date;

        if (endDate.getTime() < startDate.getTime()) {
            return { content: "**Starting date provided occurs before ending date!**", ephemeral: true };
        }

        const daysoff: Dayoff[] = [];
        for (let i = startDate.getTime(); i <= endDate.getTime(); i += 1000 * 60 * 60 * 24) {
            daysoff.push({
                date: new Date(i),
                reason: reason,
                affectedSchools: affectedSchools
            });
        }

        await Application.instance.collections.daysoff.insertMany(daysoff);
        return { content: `${daysoff.length} days off were added!`, ephemeral: true };
    }

    async replyCreate(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const dayAsString = options.getString("day", true);
        const affectedSchools = options.getString("affected_school", true) as Schools;
        const reason = options.getString("reason", true);

        const datePossibleError = TimeFormatter.stringToDate(dayAsString);
        let date;
        if (datePossibleError.isError) {
            return { content: datePossibleError.message, ephemeral: true };
        } else {
            date = datePossibleError.date;
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

            return {
                content: `**Successfully added day off on \`${date.toDateString()}\` for schools \`${affectedSchools}\` for reason :** ${reason}`,
                ephemeral: true
            };
        }

        await Application.instance.collections.daysoff.replaceOne(
            { _id: existingDayoff._id },
            {
                date: date,
                reason: reason,
                affectedSchools: affectedSchools
            }
        );

        return {
            content: `**Successfully replaced a day off on \`${date.toDateString()}\` for schools \`${affectedSchools}\` for reason :** ${reason}`,
            ephemeral: true
        };
    }

    async replyDelete(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const dayAsString = options.getString("day", true);
        const affectedSchoolsAsString = options.getString("affected_school", true);

        // String: 0000/00/00
        // CharAt: 0123456789
        if (!(dayAsString.charAt(4) == "/" && dayAsString.charAt(7) == "/")) {
            return { content: "**Day declaration was invalid! Please use the `YYYY/MM/DD` format!", ephemeral: true };
        }

        const year = parseInt(dayAsString.substring(0, 4));
        const month = parseInt(dayAsString.substring(5, 7)) + 1;
        const day = parseInt(dayAsString.substring(8));

        if (Number.isNaN(year)) return { content: "**Year was NaN!**", ephemeral: true };
        if (Number.isNaN(month)) return { content: "**Month was NaN!**", ephemeral: true };
        if (Number.isNaN(day)) return { content: "**Day was NaN!**", ephemeral: true };

        if (month < 1 || month > 12) return { content: "**Month was out of bounds!**", ephemeral: true };
        if (day < 1 || day > DaysInMonth[month]) return { content: "**Day was out of bounds!**", ephemeral: true };

        const date = new Date(year, month, day, 0, 0, 0, 0);

        const existingSchedule = await Application.instance.collections.daysoff.deleteOne({ date: date, affectedSchools: affectedSchoolsAsString });
        if (existingSchedule.acknowledged && existingSchedule.deletedCount) {
            return { content: "**Successfully deleted day off!**", ephemeral: true };
        }

        return { content: "**No day off found to delete**", ephemeral: true };
    }
}

export default Command_Daysoff;

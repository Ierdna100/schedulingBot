import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../../dto/InteractionArguments.js";
import { CRUDCommand } from "../CRUDCommand.js";
import { CRUD } from "../../../dto/CRUD.js";
import { Schools } from "../../../dto/Schools.js";
import { PermissionsManager } from "../../../administration/PermissionsManager.js";
import { Authlevel } from "../../../dto/AuthLevel.js";
import { Application } from "../../../Application.js";
import { FlippedDay } from "../../../dto/FlippedDay.js";
import { MongoModels } from "../../../dto/MongoModels.js";
import { WeekdayEnum, WeekdayInFrench, WeekdayToKeys } from "../../../dto/Schedule.js";
import { Weekdays } from "../../../dto/Weekdays.js";
import { TimeFormatter } from "../../../UI/TimeFormatter.js";

class CRUDCommand_FlippedDays extends CRUDCommand {
    // prettier-ignore
    commandBuilder = new SlashCommandBuilder()
        .setName("daysoff")
        .setDescription("Manage the days off")
        .setDefaultMemberPermissions("8")
        .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName(CRUD.create)
                .setDescription("Add a flipped day to the list of flipped days")
                .addStringOption(new SlashCommandStringOption()
                    .setName("day")
                    .setDescription("Day that will be flipped (YYYY/MM/DD)")
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
                    .setName("new_day")
                    .setDescription("New day value it should be")
                    .addChoices(
                        { name: "Monday", value: "1" },
                        { name: "Tuesday", value: "2" },
                        { name: "Wednesday", value: "3" },
                        { name: "Thursday", value: "4" },
                        { name: "Friday", value: "5" })
                    .setRequired(true)))
            .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName(CRUD.delete)
                .setDescription("Remove a day off from the list of flipped days")
                .addStringOption(new SlashCommandStringOption()
                    .setName("day")
                    .setDescription("Day that will be flipped (YYYY/MM/DD)")
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
                .setName(CRUD.read)
                .setDescription("Get list of current flipped days"));

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
        const daysoffCount = await Application.instance.collections.flippedDays.estimatedDocumentCount();
        if (daysoffCount == 0) {
            return { content: "**No flipped days are registered!**", ephemeral: true };
        }

        let stringOutput = "# Flipped days\n";

        const daysoffUnorderedWCtors = (await Application.instance.collections.daysoff.find().toArray()) as unknown as MongoModels.FlippedDay[];
        const daysOffUnordered: FlippedDay[] = [];
        daysoffUnorderedWCtors.forEach((e) =>
            daysOffUnordered.push({
                date: new Date(e.date),
                affectedSchools: e.affectedSchools,
                replacedDay: e.replacedDay
            })
        );
        const flippedDays = daysOffUnordered.sort((a, b) => a.date.getTime() - b.date.getTime());

        for (const school of Object.values(Schools)) {
            let schoolHasDayoff = false;

            for (const day of flippedDays) {
                if (day.affectedSchools != school) {
                    continue;
                }

                if (!schoolHasDayoff) {
                    stringOutput += `## ${school}\n`;
                }

                schoolHasDayoff = true;
                stringOutput += `- \`${day.date.toDateString()}\` : Usually a \`${Object.keys(Weekdays)[day.date.getDay()]}\`, has schedule for a \`${
                    Object.keys(Weekdays)[day.replacedDay]
                }\`\n`;
            }
        }

        return { content: stringOutput, ephemeral: true };
    }

    async replyCreate(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const dayAsString = options.getString("start", true);
        const affectedSchools = options.getString("affected_school", true) as Schools;
        const replacedDay = parseInt(options.getString("new_day", true));

        const datePossibleError = TimeFormatter.stringToDate(dayAsString);
        if (datePossibleError.isError) {
            return { content: datePossibleError.message, ephemeral: true };
        }
        const date = datePossibleError.date;

        const existingFlippedDay = await Application.instance.collections.daysoff.findOne<MongoModels.Dayoff>({
            date: date,
            affectedSchools: affectedSchools
        });

        if (existingFlippedDay == null) {
            await Application.instance.collections.daysoff.insertOne({
                date: date,
                affectedSchools: affectedSchools,
                replacedDay: replacedDay
            });
            return {
                content: `Flipped day on \`${date.toISOString()}\` (It is a \`${Object.keys(Weekdays)[date.getDay()]}\` with the schedule of a \`${
                    Object.keys(Weekdays)[replacedDay]
                }\`) was added!`,
                ephemeral: true
            };
        }

        await Application.instance.collections.daysoff.replaceOne(
            { _id: existingFlippedDay._id },
            {
                date: date,
                affectedSchools: affectedSchools,
                replacedDay: replacedDay
            }
        );

        return {
            content: `Replaced flipped day on \`${date.toISOString()}\` (It is a \`${Object.keys(Weekdays)[date.getDay()]}\` with the schedule of a \`${
                Object.keys(Weekdays)[replacedDay]
            }\`) was added!`,
            ephemeral: true
        };
    }

    async replyDelete(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const dayAsString = options.getString("day", true);
        const affectedSchoolsAsString = options.getString("affected_school", true);

        const datePossibleError = TimeFormatter.stringToDate(dayAsString);
        if (datePossibleError.isError) {
            return { content: datePossibleError.message, ephemeral: true };
        }
        const date = datePossibleError.date;

        const existingSchedule = await Application.instance.collections.daysoff.deleteOne({ date: date, affectedSchools: affectedSchoolsAsString });
        if (existingSchedule.acknowledged && existingSchedule.deletedCount) {
            return { content: "**Successfully deleted day off!**", ephemeral: true };
        }

        return { content: "**No day off found to delete**", ephemeral: true };
    }
}

export default CRUDCommand_FlippedDays;

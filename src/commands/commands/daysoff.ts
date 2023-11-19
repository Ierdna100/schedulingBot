import { SlashCommandBuilder, ChatInputCommandInteraction, CacheType, CommandInteractionOptionResolver, SlashCommandSubcommandBuilder, SlashCommandUserOption, SlashCommandSubcommandGroupBuilder, SlashCommandIntegerOption, SlashCommandStringOption } from "discord.js";
import { BaseCRUDCommand } from "../baseCRUDCommand.js";
import fs from 'fs';
import { Dayoff } from "../../data/types/dayoff.js";
import { School } from "../../data/types/schedule.js";

class Daysoff_Command extends BaseCRUDCommand {
    public commandBuilder = new SlashCommandBuilder()
        .setName("daysoff")
        .setDescription("Manage the days off")
        .setDefaultMemberPermissions("8")
        .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName("add")
                .setDescription("Add a day off to the list of days off")
                .addIntegerOption(new SlashCommandIntegerOption()
                    .setMinValue(1)
                    .setMaxValue(31)
                    .setName("day")
                    .setDescription("Day of the month where day will be off")
                    .setRequired(true))
                .addIntegerOption(new SlashCommandIntegerOption()
                    .setMinValue(1)
                    .setMaxValue(12)
                    .setName("month")
                    .setDescription("Month where day will be off")
                    .setRequired(true))
                .addIntegerOption(new SlashCommandIntegerOption()
                    .setMinValue(2023)
                    .setName("year")
                    .setDescription("Year where day will be off")
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
                        { name: "Vanier", value: School.Vanier },
                        { name: "Bois-de-Boulogne", value: School.Bdeb },
                        { name: "All", value: School.All })
                    .setRequired(true)))
            .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName("remove")
                .setDescription("Remove a day off from the list of days off")
                .addIntegerOption(new SlashCommandIntegerOption()
                    .setMinValue(1)
                    .setMaxValue(31)
                    .setName("day")
                    .setDescription("Day of the month of selected day to remove")
                    .setRequired(true))
                .addIntegerOption(new SlashCommandIntegerOption()
                    .setMinValue(1)
                    .setMaxValue(12)
                    .setName("month")
                    .setDescription("Month of selected day to remove")
                    .setRequired(true))
                .addIntegerOption(new SlashCommandIntegerOption()
                    .setMinValue(2023)
                    .setName("year")
                    .setDescription("Year of selected day to remove")
                    .setRequired(true)))
            .addSubcommand(new SlashCommandSubcommandBuilder()
                .setName("get")
                .setDescription("Get list of current days off"));

    async reply(interaction: ChatInputCommandInteraction<CacheType>, userId: string, isOp: boolean, isBanned: boolean, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        if (!isOp) {
            await interaction.reply({content: "**You are not an administrator! You cannot use this command.**"});
            return;
        }

        const subcommand = options.getSubcommand(true);

        switch (subcommand) {
            case "add":
                await this.replyPost(interaction, userId, options);
                break;
            case "remove":
                await this.replyDelete(interaction, userId, options);
                break;
            case "get":
                await this.replyGet(interaction, userId, options);
                break;
        }
    }

    async replyGet(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const daysoff: Dayoff[] | [] = JSON.parse(fs.readFileSync("./data/daysoff.json").toString());

        if (daysoff.length == 0) {
            interaction.reply("**No days off!**");
            return;
        }

        let stringOutput = "# Days off:\n";

        for (const dayoff of daysoff) {
            stringOutput += `\`${dayoff.year}-${dayoff.month}-${dayoff.day}: (${dayoff.affectedSchool}) ${dayoff.reason}\``;
        }

        await interaction.reply({content: stringOutput, ephemeral: true});
    }

    async replyPost(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        const daysoff: Dayoff[] = JSON.parse(fs.readFileSync("./data/daysoff.json").toString());

        const day: number = options.getInteger("day", true);
        const month: number = options.getInteger("month", true);
        const year: number = options.getInteger("year", true);
        const reason: string = options.getString("reason", true);
        const affectedSchool: School = options.getString("affected_school", true) as School;

        for (let i = 0; i < daysoff.length; i++) {
            if (daysoff[i].day == day && daysoff[i].month == month && daysoff[i].year == year) {
                daysoff[i].reason = reason;
                fs.writeFileSync("./data/daysoff.json", JSON.stringify(daysoff, null, "\t"));
                interaction.reply("**Day off already exists! Updated reason.**");
                return;
            }
        }

        daysoff.push({
            day: day,
            month: month,
            year: year,
            reason: reason,
            affectedSchool: affectedSchool
        });

        fs.writeFileSync("./data/daysoff.json", JSON.stringify(daysoff, null, "\t"));
        await interaction.reply(`**Added day off successfully!**`);
    }

    async replyDelete(interaction: ChatInputCommandInteraction<CacheType>, userId: string, options: Omit<CommandInteractionOptionResolver<CacheType>, "getMessage" | "getFocused">): Promise<void> {
        let daysoff: Dayoff[] = JSON.parse(fs.readFileSync("./data/daysoff.json").toString());

        if (daysoff.length == 0) {
            await interaction.reply("**There are no days off!**");
            return;
        }

        const day: number = options.getInteger("day", true);
        const month: number = options.getInteger("month", true);
        const year: number = options.getInteger("year", true);

        for (let i = 0; i < daysoff.length; i++) {
            if (daysoff[i].day == day && daysoff[i].month == month && daysoff[i].year == year) {
                const lastElement = daysoff.pop();

                if (lastElement == undefined) {
                    daysoff = [];
                    break;
                }

                daysoff[i] = lastElement;

                fs.writeFileSync("./data/bannedUsers.json", JSON.stringify(daysoff, null, "\t"));
                interaction.reply("**Removed day off!**");
                return;
            }
        }

        await interaction.reply("**Day off does not exist!**");
    }
}

export default Daysoff_Command;

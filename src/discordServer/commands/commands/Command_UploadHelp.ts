import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, SlashCommandBuilder } from "discord.js";
import { CommandInteraction, CommandOptions, InteractionReply } from "../../../dto/InteractionArguments.js";
import { Command } from "../Command.js";
import path from "path";
import fs from "fs";

const helpImagesFilepath = "./static/instructionsImages/";
const instructionsDeclarationFilepath = "./static/instructions.json";

const instructions = JSON.parse(fs.readFileSync(instructionsDeclarationFilepath).toString());

// prettier-ignore
const prevButton = new ButtonBuilder()
    .setCustomId('help-prev')
    .setLabel("<- prev")
    .setStyle(ButtonStyle.Primary);
// prettier-ignore
const nextButton = new ButtonBuilder()
    .setCustomId('help-next')
    .setLabel("next ->")
    .setStyle(ButtonStyle.Primary);

class Command_UploadHelp extends Command {
    // prettier-ignore
    public commandBuilder = new SlashCommandBuilder()
        .setName("upload_help")
        .setDescription("Get instructions on how to upload your schedule");

    public async reply(interaction: CommandInteraction, executorId: string, options: CommandOptions): Promise<InteractionReply> {
        const firstFilepath = path.join(helpImagesFilepath, instructions[0].filename + ".png");

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(prevButton.setDisabled(true), nextButton.setDisabled(false));

        return {
            content: `**(1/${instructions.length})** ` + instructions[0].description,
            files: [firstFilepath],
            components: [buttons],
            ephemeral: true
        };
    }

    public static async onButtonNext(interaction: ButtonInteraction) {
        const nextPageIdx = this.getHelpPageIndex(interaction) + 1;

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            prevButton.setDisabled(false),
            nextButton.setDisabled(nextPageIdx + 1 == instructions.length)
        );

        interaction.update({
            content: `**(${nextPageIdx + 1}/${instructions.length})** ` + instructions[nextPageIdx].description,
            files: [path.join(helpImagesFilepath, instructions[nextPageIdx].filename + ".png")],
            components: [buttons]
        });
    }

    public static async onButtonPrev(interaction: ButtonInteraction) {
        const prevPageIdx = this.getHelpPageIndex(interaction) - 1;

        // prettier-ignore
        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            prevButton.setDisabled(prevPageIdx == 0),
            nextButton.setDisabled(false)
        );

        interaction.update({
            content: `**(${prevPageIdx + 1}/${instructions.length})** ` + instructions[prevPageIdx].description,
            files: [path.join(helpImagesFilepath, instructions[prevPageIdx].filename + ".png")],
            components: [buttons]
        });
    }

    private static getHelpPageIndex(interaction: ButtonInteraction): number {
        const str = interaction.message.content;
        const start = str.indexOf("(");
        const end = str.indexOf("/");
        return parseInt(str.substring(start + 1, end)) - 1;
    }
}

export default Command_UploadHelp;

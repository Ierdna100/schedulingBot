const { ModalBuilder, ActionRowBuilder, TextInputBuilder } = require("@discordjs/builders")

const fields = {
    username: new TextInputBuilder()
        .setCustomId("username")
        .setMaxLength(20)
        .setPlaceholder("Display name")
        .setRequired(true)
        .setLabel("Your display name")
        .setStyle("Short"),
    schedule: new TextInputBuilder()
        .setCustomId("schedule")
        .setPlaceholder("Your schedule here")
        .setRequired(true)
        .setLabel("Your schedule")
        .setStyle("Paragraph"),
    classDefinitions: new TextInputBuilder()
        .setCustomId("classes")
        .setPlaceholder("Your classes definitions here")
        .setRequired(true)
        .setLabel("Your classes definitions")
        .setStyle("Paragraph"),
}

const scheduleModal = new ModalBuilder()
    .setCustomId("schedule_modal")
    .setTitle("Input your schedule")
    .setComponents(
        new ActionRowBuilder().setComponents(fields.username),
        new ActionRowBuilder().setComponents(fields.schedule),
        new ActionRowBuilder().setComponents(fields.classDefinitions)
    )

module.exports = { scheduleModal }
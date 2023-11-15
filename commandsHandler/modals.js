const { ModalBuilder, ActionRowBuilder, TextInputBuilder } = require("@discordjs/builders")

const scheduleFields = {
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
        .setStyle("Paragraph")
}

const scheduleModal = new ModalBuilder()
    .setCustomId("schedule_modal")
    .setTitle("Input your schedule")
    .setComponents(
        new ActionRowBuilder().setComponents(scheduleFields.username),
        new ActionRowBuilder().setComponents(scheduleFields.schedule),
    )

const dayoffFields = {
    day: new TextInputBuilder()
        .setCustomId("day")
        .setPlaceholder("Epoch time (GMT-05:00 assumed)")
        .setRequired(true)
        .setLabel("Day in which day off takes place.")
        .setStyle("Short"),
    reason: new TextInputBuilder()
        .setCustomId("reason")
        .setMaxLength(64)
        .setPlaceholder("Reason of day off")
        .setRequired(true)
        .setLabel("Reason of day off")
        .setStyle("Short"),
}

const dayoffModal = new ModalBuilder()
    .setCustomId("dayoff_modal")
    .setTitle("Input your schedule")
    .setComponents(
        new ActionRowBuilder().setComponents(dayoffFields.day),
        new ActionRowBuilder().setComponents(dayoffFields.reason),
    )

module.exports = { scheduleModal, dayoffModal }
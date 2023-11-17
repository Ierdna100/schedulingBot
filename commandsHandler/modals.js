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
        .setStyle("Paragraph"),
    school: new TextInputBuilder()
        .setCustomId("school")
        .setMaxLength(1)
        .setPlaceholder("School ID")
        .setRequired(true)
        .setLabel("1 = BdeB, 2 = Vanier, 3 = Other")
        .setStyle("Short"),
}

const scheduleModal = new ModalBuilder()
    .setCustomId("schedule_modal")
    .setTitle("Input your schedule")
    .setComponents(
        new ActionRowBuilder().setComponents(scheduleFields.username),
        new ActionRowBuilder().setComponents(scheduleFields.school),
        new ActionRowBuilder().setComponents(scheduleFields.schedule),
    )

const dayoffFields = {
    day: new TextInputBuilder()
        .setCustomId("day")
        .setPlaceholder("nov12")
        .setRequired(true)
        .setLabel("Day in which day off takes place. (mmmDD)")
        .setStyle("Short"),
    reason: new TextInputBuilder()
        .setCustomId("reason")
        .setMaxLength(64)
        .setPlaceholder("Reason of day off")
        .setRequired(true)
        .setLabel("Reason of day off")
        .setStyle("Short"),
    pingOnDay: new TextInputBuilder()
        .setCustomId("ping_on_day")
        .setMaxLength(1)
        .setPlaceholder("Y")
        .setRequired(true)
        .setLabel("Ping on day?")
        .setStyle("Short"),
}

const dayoffModal = new ModalBuilder()
    .setCustomId("dayoff_modal")
    .setTitle("Input your schedule")
    .setComponents(
        new ActionRowBuilder().setComponents(dayoffFields.day),
        new ActionRowBuilder().setComponents(dayoffFields.reason),
        new ActionRowBuilder().setComponents(dayoffFields.pingOnDay)
    )

module.exports = { scheduleModal, dayoffModal }
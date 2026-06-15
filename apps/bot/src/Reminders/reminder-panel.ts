import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  ModalBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import type { ReminderRecord } from "./reminder-service.js";

export const REMINDER_CUSTOM_ID_PREFIX = "rem";

export type ReminderPanelMode = "list" | "detail";

export interface ReminderPanelInput {
  readonly reminders: readonly ReminderRecord[];
  readonly selectedReminder?: ReminderRecord | undefined;
}

export function reminderInteractionFlags(): readonly [
  MessageFlags.IsComponentsV2,
  MessageFlags.Ephemeral,
] {
  return [MessageFlags.IsComponentsV2, MessageFlags.Ephemeral];
}

export function reminderMessageFlags(): readonly [MessageFlags.IsComponentsV2] {
  return [MessageFlags.IsComponentsV2];
}

export function buildReminderPanel(input: ReminderPanelInput): ContainerBuilder {
  const container = new ContainerBuilder()
    .setAccentColor(0x02fe97)
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(buildPanelSummary(input)),
    );

  if (input.reminders.length === 0) {
    return container;
  }

  container
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addActionRowComponents(
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        buildReminderSelect(input.reminders, input.selectedReminder?.id),
      ),
    );

  if (input.selectedReminder) {
    container
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          buildReminderDetail(input.selectedReminder),
        ),
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId(buildReminderCustomId("edit-message", input.selectedReminder.id))
            .setLabel("Edit message")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(buildReminderCustomId("edit-time", input.selectedReminder.id))
            .setLabel("Edit time")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(buildReminderCustomId("toggle-delivery", input.selectedReminder.id))
            .setLabel(input.selectedReminder.delivery === "dm" ? "Use channel" : "Use DM")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(buildReminderCustomId("cancel", input.selectedReminder.id))
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Danger),
        ),
      );
  }

  return container;
}

export function buildReminderMessageModal(reminder: ReminderRecord): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(buildReminderCustomId("modal-message", reminder.id))
    .setTitle("Edit reminder message")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("message")
          .setLabel("Reminder message")
          .setRequired(true)
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(1000)
          .setValue(reminder.message.slice(0, 1000)),
      ),
    );
}

export function buildReminderTimeModal(reminder: ReminderRecord): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(buildReminderCustomId("modal-time", reminder.id))
    .setTitle("Edit reminder time")
    .addComponents(
      new ActionRowBuilder<TextInputBuilder>().addComponents(
        new TextInputBuilder()
          .setCustomId("time")
          .setLabel("New time")
          .setPlaceholder("10m, in 2 hours, 2026-06-15T09:30:00, 09:30")
          .setRequired(true)
          .setStyle(TextInputStyle.Short)
          .setValue(formatDiscordTimestamp(reminder.remindAt)),
      ),
    );
}

export function buildReminderCustomId(action: string, reminderId?: string): string {
  return [REMINDER_CUSTOM_ID_PREFIX, action, reminderId].filter(Boolean).join(":");
}

export function parseReminderCustomId(customId: string):
  | {
      readonly action: string;
      readonly reminderId: string | undefined;
    }
  | undefined {
  const [prefix, action, reminderId] = customId.split(":");

  if (prefix !== REMINDER_CUSTOM_ID_PREFIX || !action) {
    return undefined;
  }

  return { action, reminderId };
}

function buildReminderSelect(
  reminders: readonly ReminderRecord[],
  selectedId: string | undefined,
): StringSelectMenuBuilder {
  const options = reminders.slice(0, 25).map((reminder) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(formatReminderOptionLabel(reminder))
      .setDescription(reminder.message.slice(0, 100))
      .setValue(reminder.id)
      .setDefault(reminder.id === selectedId),
  );

  return new StringSelectMenuBuilder()
    .setCustomId(buildReminderCustomId("select"))
    .setPlaceholder("Choose a reminder to inspect")
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);
}

function buildPanelSummary(input: ReminderPanelInput): string {
  if (input.reminders.length === 0) {
    return "## Reminders\nYou do not have active reminders.";
  }

  return [
    "## Reminders",
    `You have ${input.reminders.length} active reminder${input.reminders.length === 1 ? "" : "s"}.`,
    "Choose one from the menu to inspect or modify it.",
  ].join("\n");
}

function buildReminderDetail(reminder: ReminderRecord): string {
  return [
    "### Selected reminder",
    `**When:** <t:${toDiscordTimestamp(reminder.remindAt)}:F> (<t:${toDiscordTimestamp(reminder.remindAt)}:R>)`,
    `**Delivery:** ${reminder.delivery === "dm" ? "DM" : "Channel"}`,
    `**Message:** ${reminder.message}`,
  ].join("\n");
}

function formatReminderOptionLabel(reminder: ReminderRecord): string {
  const label = `${formatDiscordTimestamp(reminder.remindAt)} - ${reminder.message}`;
  return label.length > 100 ? `${label.slice(0, 97)}...` : label;
}

function formatDiscordTimestamp(date: Date): string {
  return `<t:${toDiscordTimestamp(date)}:R>`;
}

function toDiscordTimestamp(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

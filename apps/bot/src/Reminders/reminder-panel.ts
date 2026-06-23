import type { MessageFlags } from "discord.js";
import {
	ActionRowBuilder,
	ContainerBuilder,
	ModalBuilder,
	SeparatorBuilder,
	StringSelectMenuBuilder,
	StringSelectMenuOptionBuilder,
	TextDisplayBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

import type { ButtonInput } from "#ComponentsV2";
import {
	buildButtonRow,
	buildContainer,
	componentsV2EphemeralFlags,
	componentsV2Flags,
} from "#ComponentsV2";

import type { ReminderRecord } from "./reminder-service.js";

export const REMINDER_CUSTOM_ID_PREFIX = "rem";

export interface ReminderPanelInput {
	readonly reminders: readonly ReminderRecord[];
	readonly selectedReminder?: ReminderRecord | undefined;
}

export function reminderInteractionFlags(): readonly [
	typeof MessageFlags.IsComponentsV2,
	typeof MessageFlags.Ephemeral,
] {
	return componentsV2EphemeralFlags();
}

export function reminderMessageFlags(): readonly [
	typeof MessageFlags.IsComponentsV2,
] {
	return componentsV2Flags();
}

export function buildReminderPanel(
	input: ReminderPanelInput,
): ContainerBuilder {
	const summary = buildPanelSummary(input);

	if (input.reminders.length === 0) {
		return buildContainer({
			accentColor: 0x02fe97,
			content: summary,
		});
	}

	const container = new ContainerBuilder()
		.setAccentColor(0x02fe97)
		.addTextDisplayComponents(
			new TextDisplayBuilder().setContent(summary),
		)
		.addSeparatorComponents(
			new SeparatorBuilder().setDivider(true),
		)
		.addActionRowComponents(
			new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
				buildReminderSelect(
					input.reminders,
					input.selectedReminder?.id,
				),
			),
		);

	if (input.selectedReminder) {
		const actionButtons: ButtonInput[] = [
			{
				customId: buildReminderCustomId(
					"edit-message",
					input.selectedReminder.id,
				),
				label: "Edit message",
				style: "primary",
			},
			{
				customId: buildReminderCustomId(
					"edit-time",
					input.selectedReminder.id,
				),
				label: "Edit time",
				style: "primary",
			},
			{
				customId: buildReminderCustomId(
					"toggle-delivery",
					input.selectedReminder.id,
				),
				label:
					input.selectedReminder.delivery === "dm"
						? "Use channel"
						: "Use DM",
				style: "secondary",
			},
			...(input.selectedReminder.delivery === "channel"
				? [
						{
							customId: buildReminderCustomId(
								"change-channel",
								input.selectedReminder.id,
							),
							label: "Change channel",
							style: "secondary" as const,
						},
					]
				: []),
			{
				customId: buildReminderCustomId(
					"cancel",
					input.selectedReminder.id,
				),
				label: "Cancel",
				style: "danger",
			},
		];

		container
			.addSeparatorComponents(
				new SeparatorBuilder().setDivider(true),
			)
			.addTextDisplayComponents(
				new TextDisplayBuilder().setContent(
					buildReminderDetail(input.selectedReminder),
				),
			)
			.addActionRowComponents(
				buildButtonRow(actionButtons),
			);
	}

	return container;
}

export function buildReminderMessageModal(
	reminder: ReminderRecord,
): ModalBuilder {
	return new ModalBuilder()
		.setCustomId(
			buildReminderCustomId("modal-message", reminder.id),
		)
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

export function buildReminderTimeModal(
	reminder: ReminderRecord,
): ModalBuilder {
	return new ModalBuilder()
		.setCustomId(
			buildReminderCustomId("modal-time", reminder.id),
		)
		.setTitle("Edit reminder time")
		.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(
				new TextInputBuilder()
					.setCustomId("time")
					.setLabel("New time")
					.setPlaceholder(
						"10m, in 2 hours, 2026-06-15T09:30:00, 09:30",
					)
					.setRequired(true)
					.setStyle(TextInputStyle.Short)
					.setValue(
						formatDiscordTimestamp(reminder.remindAt),
					),
			),
		);
}

export function buildReminderCustomId(
	action: string,
	reminderId?: string,
): string {
	return [REMINDER_CUSTOM_ID_PREFIX, action, reminderId]
		.filter(Boolean)
		.join(":");
}

export function parseReminderCustomId(customId: string):
	| {
			readonly action: string;
			readonly reminderId: string | undefined;
	  }
	| undefined {
	const separatorIndex = customId.indexOf(":");
	if (separatorIndex === -1) {
		return undefined;
	}

	const prefix = customId.slice(0, separatorIndex);
	if (prefix !== REMINDER_CUSTOM_ID_PREFIX) {
		return undefined;
	}

	const afterPrefix = customId.slice(separatorIndex + 1);
	const actionSeparatorIndex = afterPrefix.indexOf(":");
	const action =
		actionSeparatorIndex === -1
			? afterPrefix
			: afterPrefix.slice(0, actionSeparatorIndex);

	if (!action) {
		return undefined;
	}

	const reminderId =
		actionSeparatorIndex === -1
			? undefined
			: afterPrefix.slice(actionSeparatorIndex + 1);

	return { action, reminderId: reminderId || undefined };
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

function buildPanelSummary(
	input: ReminderPanelInput,
): string {
	if (input.reminders.length === 0) {
		return "## Reminders\nYou do not have active reminders.";
	}

	return [
		"## Reminders",
		`You have ${input.reminders.length} active reminder${input.reminders.length === 1 ? "" : "s"}.`,
		"Choose one from the menu to inspect or modify it.",
	].join("\n");
}

function buildReminderDetail(
	reminder: ReminderRecord,
): string {
	return [
		"### Selected reminder",
		`**When:** <t:${toDiscordTimestamp(reminder.remindAt)}:F> (<t:${toDiscordTimestamp(reminder.remindAt)}:R>)`,
		`**Delivery:** ${reminder.delivery === "dm" ? "DM" : `Channel (<#${reminder.channelId}>)`}`,
		`>>> **${reminder.message}**`,
	].join("\n");
}

function formatReminderOptionLabel(
	reminder: ReminderRecord,
): string {
	const label = `${formatRelativeTime(reminder.remindAt)} - ${reminder.message}`;
	return label.length > 100
		? `${label.slice(0, 97)}...`
		: label;
}

function formatRelativeTime(date: Date): string {
	const diff = date.getTime() - Date.now();
	const seconds = Math.floor(Math.abs(diff) / 1000);
	const prefix = diff >= 0 ? "in " : "";
	const suffix = diff < 0 ? " ago" : "";

	if (seconds < 60) return `${prefix}<1m${suffix}`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${prefix}${minutes}m${suffix}`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${prefix}${hours}h${suffix}`;
	const days = Math.floor(hours / 24);
	return `${prefix}${days}d${suffix}`;
}

function formatDiscordTimestamp(date: Date): string {
	return `<t:${toDiscordTimestamp(date)}:R>`;
}

function toDiscordTimestamp(date: Date): number {
	return Math.floor(date.getTime() / 1000);
}

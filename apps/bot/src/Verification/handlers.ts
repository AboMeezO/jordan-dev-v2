import type {
	ButtonInteraction,
	Client,
	GuildMember,
	ModalSubmitInteraction,
	TextChannel,
} from "discord.js";
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from "discord.js";

import { Logger } from "#Logger";

import * as api from "./api.js";
import { type FormSection, getNextSection, getPreviousSection, getSectionIndex, SECTIONS } from "./sections.js";

const log = new Logger("verification");

const APPLICATION_DATA = new Map<string, Record<string, string>>();

function getAppData(discordUserId: string): Record<string, string> {
	if (!APPLICATION_DATA.has(discordUserId)) {
		APPLICATION_DATA.set(discordUserId, {});
	}
	return APPLICATION_DATA.get(discordUserId)!;
}

async function sendSectionModal(
	interaction: ButtonInteraction | ModalSubmitInteraction,
	section: FormSection,
	data: Record<string, string>,
): Promise<void> {
	const modal = new ModalBuilder()
		.setCustomId(`verify_section:${section.key}`)
		.setTitle(section.title);

	for (const field of section.fields) {
		const input = new TextInputBuilder()
			.setCustomId(field.customId)
			.setLabel(field.label)
			.setStyle(field.style === "paragraph" ? TextInputStyle.Paragraph : TextInputStyle.Short)
			.setRequired(field.required)
			.setMaxLength(field.maxLength ?? 4000);

		if (field.placeholder) {
			input.setPlaceholder(field.placeholder);
		}

		const existing = data[field.customId];
		if (existing) {
			input.setValue(existing);
		}

		modal.addComponents(
			new ActionRowBuilder<TextInputBuilder>().addComponents(input),
		);
	}

	if (interaction.isButton()) {
		await interaction.showModal(modal);
	}
}

async function sendVerifyButton(channel: TextChannel): Promise<void> {
	const embed = new EmbedBuilder()
		.setTitle("Welcome to Jordan Devs!")
		.setDescription(
			"To gain access to the community, please verify yourself by clicking the button below. " +
			"You'll be guided through a short application process in DMs.",
		)
		.setColor(0x5865F2);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId("verify:start")
			.setLabel("Verify")
			.setStyle(ButtonStyle.Primary),
	);

	await channel.send({ embeds: [embed], components: [row] });
}

export async function handleGuildMemberAdd(
	member: GuildMember,
): Promise<void> {
	try {
		const config = await api.getGuildConfig(member.guild.id);
		await member.roles.add(config.unverifiedRoleId);
		log.info(`Assigned unverified role to ${member.user.tag} in ${member.guild.id}`);
	} catch (error) {
		log.error(`Failed to assign unverified role to ${member.user.tag}:`, error);
	}
}

export async function handleButton(
	interaction: ButtonInteraction,
	client: Client,
): Promise<void> {
	if (interaction.customId === "verify:start") {
		await handleVerifyStart(interaction);
		return;
	}

	if (interaction.customId.startsWith("verify:next_section:")) {
		await handleNextSection(interaction);
		return;
	}

	if (interaction.customId.startsWith("verify:prev_section:")) {
		await handlePrevSection(interaction);
		return;
	}

	if (interaction.customId === "verify:submit") {
		await handleSubmit(interaction);
		return;
	}

	if (interaction.customId.startsWith("admin:inspect:")) {
		await handleAdminInspect(interaction);
		return;
	}

	if (interaction.customId.startsWith("admin:claim:")) {
		await handleAdminClaim(interaction);
		return;
	}

	if (interaction.customId.startsWith("admin:approve:")) {
		await handleAdminApprove(interaction, client);
		return;
	}

	if (interaction.customId.startsWith("admin:reject:")) {
		await handleAdminRejectStart(interaction);
		return;
	}
}

async function handleVerifyStart(
	interaction: ButtonInteraction,
): Promise<void> {
	await interaction.deferReply({ ephemeral: true });

	const dmChannel = await interaction.user.createDM();
	const firstSection = SECTIONS[0]!;

	const embed = createSectionEmbed(firstSection, 0);

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`verify:next_section:${firstSection.key}`)
			.setLabel("Start")
			.setStyle(ButtonStyle.Success),
	);

	await dmChannel.send({ embeds: [embed], components: [row] });
	await interaction.editReply({
		content: "I've sent you a DM with the verification steps. Please check your DMs!",
	});
}

function createSectionEmbed(section: FormSection, index: number): EmbedBuilder {
	return new EmbedBuilder()
		.setTitle(`${section.title} (${index + 1}/${SECTIONS.length})`)
		.setDescription(section.description)
		.setColor(0x5865F2)
		.setFooter({ text: `Section ${index + 1} of ${SECTIONS.length}` });
}

async function handleNextSection(interaction: ButtonInteraction): Promise<void> {
	const parts = interaction.customId.split(":");
	const sectionKey = parts[2] ?? "";
	const section = SECTIONS[getSectionIndex(sectionKey)];
	if (!section) return;

	const data = getAppData(interaction.user.id);
	await sendSectionModal(interaction, section, data);
}

async function handlePrevSection(interaction: ButtonInteraction): Promise<void> {
	const parts = interaction.customId.split(":");
	const sectionKey = parts[2] ?? "";
	const prevSection = getPreviousSection(sectionKey);
	if (!prevSection) return;

	const embed = createSectionEmbed(prevSection, getSectionIndex(prevSection.key));

	const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId(`verify:next_section:${prevSection.key}`)
			.setLabel("Edit Section")
			.setStyle(ButtonStyle.Primary),
	);

	if (interaction.isMessageComponent()) {
		await interaction.update({ embeds: [embed], components: [row] });
	}
}

export async function handleModalSubmit(
	interaction: ModalSubmitInteraction,
): Promise<void> {
	if (interaction.customId.startsWith("verify_reject:")) {
		await handleRejectConfirm(interaction);
		return;
	}

	if (!interaction.customId.startsWith("verify_section:")) return;

	const parts = interaction.customId.split(":");
	const sectionKey = parts[1] ?? "";
	const sectionIndex = getSectionIndex(sectionKey);
	const section = SECTIONS[sectionIndex];
	if (!section) return;

	const data = getAppData(interaction.user.id);

	for (const field of section.fields) {
		const value = interaction.fields.getTextInputValue(field.customId);
		if (value) {
			data[field.customId] = value;
		}
	}

	const nextSection = getNextSection(sectionKey);
	if (nextSection) {
		const embed = createSectionEmbed(nextSection, getSectionIndex(nextSection.key));

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`verify:prev_section:${nextSection.key}`)
				.setLabel("← Previous")
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId(`verify:next_section:${nextSection.key}`)
				.setLabel("Fill Section")
				.setStyle(ButtonStyle.Primary),
		);

		await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
	} else {
		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId("verify:prev_section:links")
				.setLabel("← Previous")
				.setStyle(ButtonStyle.Secondary),
			new ButtonBuilder()
				.setCustomId("verify:submit")
				.setLabel("Submit Application")
				.setStyle(ButtonStyle.Success),
		);

		await interaction.reply({
			content: "You've completed all sections! Review and submit your application.",
			components: [row],
			ephemeral: true,
		});
	}
}

async function handleSubmit(interaction: ButtonInteraction): Promise<void> {
	const data = getAppData(interaction.user.id);

	const requiredFields = ["displayName", "githubHandle", "strongestProject", "projectExplanation",
		"techStack", "experienceLevel", "purposeOfJoining", "selfIntroduction", "referralSource"];

	const missing = requiredFields.filter((f) => !data[f]);
	if (missing.length > 0) {
		await interaction.reply({
			content: `You're missing some required fields: ${missing.join(", ")}. Please go back and fill them in.`,
			ephemeral: true,
		});
		return;
	}

	function buildPayload() {
		return {
			discordUserId: interaction.user.id,
			guildId: interaction.guildId!,
			displayName: data.displayName ?? "",
			githubHandle: data.githubHandle ?? "",
			strongestProject: data.strongestProject ?? "",
			projectExplanation: data.projectExplanation ?? "",
			techStack: data.techStack ?? "",
			experienceLevel: data.experienceLevel ?? "",
			purposeOfJoining: data.purposeOfJoining ?? "",
			selfIntroduction: data.selfIntroduction ?? "",
			linkedInUrl: data.linkedInUrl ?? null,
			portfolioUrl: data.portfolioUrl ?? null,
			referralSource: data.referralSource ?? "",
			referralOtherText: data.referralOtherText ?? null,
		};
	}

	await interaction.deferReply({ ephemeral: true });

	try {
		const existingApp = await api.getApplicationByUser(interaction.user.id);
		if (existingApp && existingApp.status === "DRAFTING") {
			await api.updateApplication(existingApp.id, buildPayload());
			const submitted = await api.submitApplication(existingApp.id, interaction.user.id);

			await notifyAdmins(interaction, submitted, interaction.client);
			await interaction.editReply({
				content: "Your application has been submitted for review! An admin will review it shortly.",
			});
			return;
		}

		const app = await api.createApplication(buildPayload());

		const submitted = await api.submitApplication(app.id, interaction.user.id);

		await notifyAdmins(interaction, submitted, interaction.client);
		await interaction.editReply({
			content: "Your application has been submitted for review! An admin will review it shortly.",
		});
	} catch (error) {
		log.error("Submit failed:", error);
		await interaction.editReply({
			content: "Something went wrong while submitting your application. Please try again later.",
		});
	}
}

async function notifyAdmins(
	interaction: ButtonInteraction,
	application: api.ApplicationDetail,
	client: Client,
): Promise<void> {
	try {
		const config = await api.getGuildConfig(interaction.guildId!);
		const guild = client.guilds.cache.get(interaction.guildId!);
		if (!guild) return;

		const reviewerRole = guild.roles.cache.get(config.reviewerRoleId);
		const mention = reviewerRole ? `<@&${config.reviewerRoleId}>` : "@here";

		const channel = guild.channels.cache.get(config.verificationChannelId) as TextChannel | undefined;
		if (!channel) return;



		const embed = new EmbedBuilder()
			.setTitle("New Application Submitted")
			.setDescription(`**${application.displayName}** (${application.githubHandle})`)
			.addFields(
				{ name: "Experience", value: application.experienceLevel, inline: true },
				{ name: "Tech Stack", value: application.techStack, inline: true },
				{ name: "Referral Source", value: application.referralSource, inline: true },
			)
			.setColor(0xFEE75C)
			.setFooter({ text: `Application ID: ${application.id}` })
			.setTimestamp();

		const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`admin:inspect:${application.id}`)
				.setLabel("Inspect Full Application")
				.setStyle(ButtonStyle.Primary),
		);

		await channel.send({ content: `${mention} — New application to review!`, embeds: [embed], components: [row] });
	} catch (error) {
		log.error("Failed to notify admins:", error);
	}
}

async function handleAdminInspect(interaction: ButtonInteraction): Promise<void> {
	const parts = interaction.customId.split(":");
	const applicationId = parts[2]!;

	try {
		const app = await api.getApplicationDetail(applicationId);


		const embed = new EmbedBuilder()
			.setTitle(`Application: ${app.displayName}`)
			.setURL(`https://github.com/${app.githubHandle}`)
			.addFields(
				{ name: "Status", value: app.status, inline: true },
				{ name: "Experience Level", value: app.experienceLevel, inline: true },
				{ name: "Tech Stack", value: app.techStack },
				{ name: "Strongest Project", value: app.strongestProject },
				{ name: "Project Explanation", value: app.projectExplanation.substring(0, 1024) },
				{ name: "Purpose of Joining", value: app.purposeOfJoining.substring(0, 1024) },
				{ name: "Self Introduction", value: app.selfIntroduction.substring(0, 1024) },
				{ name: "Referral Source", value: app.referralSource, inline: true },
			)
			.setColor(0x5865F2);

		if (app.linkedInUrl) embed.addFields({ name: "LinkedIn", value: app.linkedInUrl, inline: true });
		if (app.portfolioUrl) embed.addFields({ name: "Portfolio", value: app.portfolioUrl, inline: true });

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`admin:claim:${applicationId}`)
				.setLabel("Claim Review")
				.setStyle(ButtonStyle.Primary),
		);

		await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
	} catch (error) {
		log.error("Failed to inspect application:", error);
		await interaction.reply({ content: "Failed to load application details.", ephemeral: true });
	}
}

async function handleAdminApprove(
	interaction: ButtonInteraction,
	client: Client,
): Promise<void> {
	const parts = interaction.customId.split(":");
	const applicationId = parts[2]!;

	await interaction.deferReply({ ephemeral: true });

	try {
		const app = await api.approveApplication(applicationId, interaction.user.id);
		const config = await api.getGuildConfig(app.guildId);

		const guild = client.guilds.cache.get(app.guildId);
		if (guild) {
			const userDiscordId = app.discordUserId;
			if (userDiscordId) {
				const member = guild.members.cache.get(userDiscordId);
				if (member) {
					await member.roles.remove(config.unverifiedRoleId);
					await member.roles.add(config.verifiedRoleId);

					const dmChannel = await member.createDM();
					await dmChannel.send({
						content: "🎉 Congratulations! Your application has been approved. Welcome to Jordan Devs!",
					});
				}
			}
		}

		await interaction.editReply({ content: "Application approved and roles granted." });

		if (interaction.message) {
	
			const updatedEmbed = new EmbedBuilder()
				.setTitle("Application Approved")
				.setDescription(`✅ **${app.displayName}** was approved by <@${interaction.user.id}>`)
				.setColor(0x57F287);
			await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
		}
	} catch (error) {
		log.error("Failed to approve application:", error);
		await interaction.editReply({ content: "Failed to approve application." });
	}
}

async function handleRejectConfirm(interaction: ModalSubmitInteraction): Promise<void> {
	const parts = interaction.customId.split(":");
	const applicationId = parts[1]!;
	const reason = interaction.fields.getTextInputValue("rejectionReason");

	await interaction.deferReply({ ephemeral: true });

	try {
		const app = await api.rejectApplication(applicationId, interaction.user.id, reason);

		const guild = interaction.client.guilds.cache.get(app.guildId);
		if (guild) {
			const userDiscordId = app.discordUserId;
			if (userDiscordId) {
				const member = guild.members.cache.get(userDiscordId);
				if (member) {
					const dmChannel = await member.createDM();
					await dmChannel.send({
						content: `Your application was not approved.\n\n**Reason:** ${reason}\n\nYou can reapply at any time by clicking the Verify button again.`,
					});
				}
			}
		}

		await interaction.editReply({ content: "Application rejected. The user has been notified." });

		if (interaction.message) {
	
			const updatedEmbed = new EmbedBuilder()
				.setTitle("Application Rejected")
				.setDescription(`❌ **${app.displayName}** was rejected by <@${interaction.user.id}>`)
				.addFields({ name: "Reason", value: reason })
				.setColor(0xED4245);
			await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
		}
	} catch (error) {
		log.error("Failed to reject application:", error);
		await interaction.editReply({ content: "Failed to reject application." });
	}
}

async function handleAdminRejectStart(interaction: ButtonInteraction): Promise<void> {
	const parts = interaction.customId.split(":");
	const applicationId = parts[2]!;
	const modal = new ModalBuilder()
		.setCustomId(`verify_reject:${applicationId}`)
		.setTitle("Reject Application");

	const reasonInput = new TextInputBuilder()
		.setCustomId("rejectionReason")
		.setLabel("Rejection Reason")
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true)
		.setPlaceholder("Explain why the application was rejected and what the user can improve")
		.setMaxLength(1000);

	modal.addComponents(
		new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput),
	);

	await interaction.showModal(modal);
}

async function handleAdminClaim(
	interaction: ButtonInteraction,
): Promise<void> {
	const parts = interaction.customId.split(":");
	const applicationId = parts[2]!;

	await interaction.deferReply({ ephemeral: true });

	try {
		const app = await api.claimReview(applicationId, interaction.user.id);
			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId(`admin:approve:${applicationId}`)
				.setLabel("Approve")
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId(`admin:reject:${applicationId}`)
				.setLabel("Reject")
				.setStyle(ButtonStyle.Danger),
		);

		await interaction.editReply({
			content: `You claimed review of **${app.displayName}**'s application.`,
			components: [row],
		});
	} catch (error) {
		log.error("Failed to claim application:", error);
		await interaction.editReply({ content: "Failed to claim application." });
	}
}

export { handleRejectConfirm, sendVerifyButton };

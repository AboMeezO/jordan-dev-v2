import {
	commandTree,
	roleNames,
	shellOutput,
	userDisplayName,
} from "#ChatCommands";

export const groupsCommand = commandTree({
	aliases: ["roles"],
	allowPrefixless: true,
	description: "List your server roles.",
	name: "groups",
	permission: "public",
	usage: {
		examples: [
			{
				command: "groups",
				description:
					"List your role names in server order.",
			},
			{
				command: "roles",
				description: "Alias for `groups`.",
			},
		],
		formats: ["groups"],
		useCases: [
			"Inspect the Discord role groups attached to your member profile.",
		],
	},
	async execute({ message }) {
		const roles = roleNames(message);

		await message.reply(
			shellOutput([
				`${userDisplayName(message)} : ${roles.length > 0 ? roles.join(" ") : "no-groups"}`,
			]),
		);
	},
});

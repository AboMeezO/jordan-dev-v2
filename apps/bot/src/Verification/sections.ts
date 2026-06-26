export type FormField = {
	customId: string;
	label: string;
	style: "short" | "paragraph";
	required: boolean;
	placeholder?: string;
	minLength?: number;
	maxLength?: number;
};

export type FormSection = {
	key: string;
	title: string;
	description: string;
	fields: FormField[];
};

export const SECTIONS: FormSection[] = [
	{
		key: "basic_info",
		title: "Basic Information",
		description: "Let's start with who you are.",
		fields: [
			{
				customId: "displayName",
				label: "What name should we call you?",
				style: "short",
				required: true,
				placeholder: "Your name or handle",
				maxLength: 100,
			},
			{
				customId: "githubHandle",
				label: "What's your GitHub username?",
				style: "short",
				required: true,
				placeholder: "e.g. octocat",
				maxLength: 100,
			},
		],
	},
	{
		key: "project",
		title: "Your Strongest Project",
		description: "Tell us about the project you're most proud of.",
		fields: [
			{
				customId: "strongestProject",
				label: "What's your strongest project?",
				style: "short",
				required: true,
				placeholder: "Project name",
				maxLength: 200,
			},
			{
				customId: "projectExplanation",
				label: "Short explanation of the project",
				style: "paragraph",
				required: true,
				placeholder: "What does it do? What was your role?",
				minLength: 20,
				maxLength: 2000,
			},
		],
	},
	{
		key: "tech",
		title: "Tech Stack & Experience",
		description: "What technologies do you work with?",
		fields: [
			{
				customId: "techStack",
				label: "Your main tech stack",
				style: "short",
				required: true,
				placeholder: "e.g. TypeScript, React, Node.js, PostgreSQL",
				maxLength: 500,
			},
			{
				customId: "experienceLevel",
				label: "Experience level",
				style: "short",
				required: true,
				placeholder: "junior / mid / senior / staff",
				maxLength: 20,
			},
		],
	},
	{
		key: "motivation",
		title: "Motivation",
		description: "Why do you want to join us?",
		fields: [
			{
				customId: "purposeOfJoining",
				label: "What's your purpose of joining?",
				style: "paragraph",
				required: true,
				placeholder: "What are you hoping to get out of this community?",
				minLength: 10,
				maxLength: 1000,
			},
			{
				customId: "selfIntroduction",
				label: "Short self-introduction",
				style: "paragraph",
				required: true,
				placeholder: "Tell us a bit about yourself as a developer",
				minLength: 20,
				maxLength: 2000,
			},
		],
	},
	{
		key: "referral",
		title: "How did you find us?",
		description: "One last thing — how did you hear about the community?",
		fields: [
			{
				customId: "referralSource",
				label: "How did you hear about us?",
				style: "short",
				required: true,
				placeholder: "reddit / friend_invite / web_search / github / other",
				maxLength: 50,
			},
			{
				customId: "referralOtherText",
				label: "If 'other', please specify",
				style: "short",
				required: false,
				placeholder: "Only needed if you selected 'other'",
				maxLength: 500,
			},
		],
	},
	{
		key: "links",
		title: "Optional Links",
		description: "Any additional links you'd like to share?",
		fields: [
			{
				customId: "linkedInUrl",
				label: "LinkedIn URL (optional)",
				style: "short",
				required: false,
				placeholder: "https://linkedin.com/in/your-profile",
				maxLength: 500,
			},
			{
				customId: "portfolioUrl",
				label: "Portfolio URL (optional)",
				style: "short",
				required: false,
				placeholder: "https://your-portfolio.dev",
				maxLength: 500,
			},
		],
	},
];

export function getSectionIndex(key: string): number {
	return SECTIONS.findIndex((s) => s.key === key);
}

export function getNextSection(currentKey: string): FormSection | null {
	const index = getSectionIndex(currentKey);
	if (index === -1 || index >= SECTIONS.length - 1) return null;
	return SECTIONS[index + 1] ?? null;
}

export function getPreviousSection(currentKey: string): FormSection | null {
	const index = getSectionIndex(currentKey);
	if (index <= 0) return null;
	return SECTIONS[index - 1] ?? null;
}

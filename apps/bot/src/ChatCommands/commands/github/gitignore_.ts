import { subcommand } from "#ChatCommands";
import { safeInline, safeOutput } from "#ChatCommands";

const GITIGNORE_TEMPLATES: Record<string, string> = {
	node: `node_modules/
dist/
build/
*.js.map
*.d.ts.map
*.tsbuildinfo
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
.env
.env.local
.env.*.local
`,
	python: `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
*.egg-info/
.eggs/
dist/
build/
*.egg
.idea/
.vscode/
*.pyc
`,
	java: `*.class
*.jar
*.war
*.nar
target/
build/
!.mvn/wrapper/maven-wrapper.jar
!**/src/main/**/target/
!**/src/test/**/target/
.idea/
*.iml
.settings
.project
.classpath
.vscode/
`,
	nextjs: `.next/
out/
node_modules/
dist/
build/
*.tsbuildinfo
.next/
`,
	react: `node_modules/
dist/
build/
*.js.map
*.css.map
.env
.env.local
`,
	vscode: `.vscode/
!.vscode/extensions.json
!.vscode/settings.json
*.code-workspace
`,
	jetbrains: `.idea/
*.iml
*.ipr
*.iws
out/
.idea_modules/
`,
	windows: `Thumbs.db
ehthumbs.db
Desktop.ini
$RECYCLE.BIN/
*.cab
*.msi
*.msm
*.msp
`,
	macos: `.DS_Store
.DS_Store?
.AppleDouble
.LSOverride
Icon
._*
.DocumentRevisions-V100
.fseventsd
.Spotlight-V100
.TemporaryItems
.Trashes
`,
	linux: `*~
.fuse_hidden*
.directory
.Trash-*
.nfs*
`,
};

const TEMPLATE_ALIASES: Record<string, string> = {
	nodejs: "node",
	js: "node",
	typescript: "node",
	py: "python",
	reactjs: "react",
	webstorm: "jetbrains",
	intellij: "jetbrains",
	mac: "macos",
	windows: "windows",
	win: "windows",
	linux: "linux",
	ubuntu: "linux",
};

export const gitignoreCommand = subcommand({
	name: "gitignore",
	aliases: ["ignore"],
	description: "Generate .gitignore templates.",
	category: "Git / GitHub Tools",
	cooldown: 2_000,
	inputLimits: { maxInputLength: 500 },
	availability: {
		contexts: ["guild", "dm"],
	},
	usage: {
		formats: [
			"gitignore <template> [template...]",
			"gitignore list",
		],
		arguments: [
			{
				name: "template",
				description:
					"Template names: node, python, react, nextjs, vscode, jetbrains, windows, macos, linux",
				required: true,
			},
		],
		examples: [
			{
				command: "gitignore node",
				description: "Node.js gitignore.",
			},
			{
				command: "gitignore node react vscode",
				description: "Merge multiple templates.",
			},
			{
				command: "gitignore list",
				description: "List available templates.",
			},
		],
	},
	async execute({ invocation, message }) {
		const args = invocation.positionalArgs
			.map((a) => a.toLowerCase())
			.filter(Boolean);

		if (args.length === 0 || args[0] === "list") {
			const names = Object.keys(GITIGNORE_TEMPLATES).sort();
			await message.reply(
				safeInline(
					`Available templates: ${names.join(", ")}\nUse \`gitignore <template>\` to generate.`,
					1900,
				),
			);
			return;
		}

		const seen = new Set<string>();
		const contents: string[] = [];
		const unknown: string[] = [];

		for (const arg of args) {
			const normalized = TEMPLATE_ALIASES[arg] ?? arg;

			if (seen.has(normalized)) {
				continue;
			}

			seen.add(normalized);

			const template = GITIGNORE_TEMPLATES[normalized];

			if (template) {
				contents.push(
					`### ${normalized} ###\n${template.trim()}`,
				);
			} else {
				unknown.push(arg);
			}
		}

		if (contents.length === 0) {
			await message.reply("No valid templates found.");
			return;
		}

		const output = contents.join("\n\n");

		const safe = safeOutput(output);

		if ("content" in safe) {
			let reply = safe.content;

			if (unknown.length > 0) {
				reply += `\n\nUnknown templates: ${unknown.join(", ")}`;
			}

			await message.reply({ content: reply });
		} else {
			await message.reply({ files: [safe.attachment] });
		}
	},
});

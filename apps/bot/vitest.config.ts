import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

const srcDir = resolve(__dirname, "src");

export default defineConfig({
	resolve: {
		alias: {
			"#Utilities": resolve(srcDir, "Utilities/index.ts"),
			"#Database": resolve(srcDir, "Database/index.ts"),
			"#ChatCommands": resolve(srcDir, "ChatCommands/index.ts"),
			"#Config": resolve(srcDir, "config.ts"),
			"#AuditLog": resolve(srcDir, "audit-log.ts"),
			"#Logger": resolve(srcDir, "Logger/index.ts"),
			"#ComponentsV2": resolve(srcDir, "ComponentsV2/index.ts"),
			"#EmojiRegistry": resolve(srcDir, "EmojiRegistry/index.ts"),
		},
	},
	test: {
		include: ["src/__tests__/**/*.test.ts"],
		environment: "node",
	},
});

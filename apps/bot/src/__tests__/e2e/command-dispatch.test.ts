import { describe, expect,it } from "vitest";

import { commandTree } from "../../ChatCommands/hierarchy.js";
import { ChatCommandRegistry } from "../../ChatCommands/registry.js";
import { toTreeNode } from "../../ChatCommands/registry.js";
import { renderCommandTree } from "../../ChatCommands/usage-guide.js";

function createTestRegistry(): ChatCommandRegistry {
	const registry = new ChatCommandRegistry();

	const testCommand = commandTree({
		name: "testcmd",
		description: "A test command.",
		permission: "public",
		async execute({ message, invocation }) {
			await message.reply(
				`Executed: ${invocation.commandPath.join(" ")}`,
			);
		},
	});

	registry.register(testCommand);
	return registry;
}

describe("command dispatch", () => {
	it("registers and resolves a command", () => {
		const registry = createTestRegistry();
		const roots = registry.listRootCommands();
		expect(roots).toHaveLength(1);
		expect(roots[0]?.name).toBe("testcmd");
	});

	it("resolves commands by path via find()", () => {
		const registry = createTestRegistry();
		const resolved = registry.find(["testcmd"], "");
		expect(resolved).toBeDefined();
		expect(resolved?.command.name).toBe("testcmd");
		expect(resolved?.allowPrefixless).toBe(true);
	});

	it("returns undefined for unknown commands", () => {
		const registry = createTestRegistry();
		const resolved = registry.find(["nonexistent"], "");
		expect(resolved).toBeUndefined();
	});

	it("builds command tree nodes", () => {
		const registry = createTestRegistry();
		const trees = registry.listRootTreeNodes();
		expect(trees).toHaveLength(1);
		const tree = trees[0]!;
		expect(tree.name).toBe("testcmd");
		expect(tree.allowPrefixless).toBe(true);
		expect(tree.enabled).toBe(true);
		expect(tree.children).toEqual([]);
	});

	it("renders command tree as string", () => {
		const registry = createTestRegistry();
		const trees = registry.listRootTreeNodes();
		const rendered = renderCommandTree(trees);
		expect(rendered).toContain("testcmd");
	});

	it("creates tree node with toTreeNode", () => {
		const registry = createTestRegistry();
		const root = registry.listRootCommands()[0]!;
		const node = toTreeNode(root, [root.name]);
		expect(node.name).toBe("testcmd");
		expect(node.path).toEqual(["testcmd"]);
	});
});

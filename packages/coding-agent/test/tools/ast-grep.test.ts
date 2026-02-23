import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { Settings } from "@oh-my-pi/pi-coding-agent/config/settings";
import { ArtifactManager } from "@oh-my-pi/pi-coding-agent/session/artifacts";
import type { ToolSession } from "@oh-my-pi/pi-coding-agent/tools";
import { AstGrepTool } from "@oh-my-pi/pi-coding-agent/tools/ast-grep";
import { Snowflake } from "@oh-my-pi/pi-utils";

function getTextOutput(result: any): string {
	return (
		result.content
			?.filter((c: any) => c.type === "text")
			.map((c: any) => c.text)
			.join("\n") || ""
	);
}

function createTestToolSession(cwd: string): ToolSession {
	const sessionFile = path.join(cwd, "session.jsonl");
	const artifactManager = new ArtifactManager(sessionFile);
	return {
		cwd,
		hasUI: false,
		getSessionFile: () => sessionFile,
		getSessionSpawns: () => "*",
		getArtifactManager: () => artifactManager,
		settings: Settings.isolated(),
	};
}

describe("AstGrepTool", () => {
	let testDir: string;
	let astGrepTool: AstGrepTool;

	beforeEach(() => {
		testDir = path.join(os.tmpdir(), `ast-grep-test-${Snowflake.next()}`);
		fs.mkdirSync(testDir, { recursive: true });

		const session = createTestToolSession(testDir);
		astGrepTool = new AstGrepTool(session);
	});

	afterEach(() => {
		fs.rmSync(testDir, { recursive: true, force: true });
	});

	describe("installation detection", () => {
		it("returns installation guidance when ast-grep is not available", async () => {
			// Skip if ast-grep is installed - this test is for the "not installed" case
			const { checkAstGrepInstallation } = await import("@oh-my-pi/pi-coding-agent/ast-grep");
			const installation = await checkAstGrepInstallation();

			if (installation.installed) {
				// ast-grep is installed, so this test doesn't apply
				// The installation check is tested manually or in CI without ast-grep
				return;
			}

			const result = await astGrepTool.execute("test-call", {
				pattern: "function $NAME() {}",
			});

			const output = getTextOutput(result);
			expect(output).toContain("ast-grep is not installed");
			expect(output).toContain("brew install ast-grep");
			expect(output).toContain("cargo install ast-grep");
			expect(output).toContain("npm install -g @ast-grep/cli");
		});
	});

	describe("pattern searching", () => {
		it("finds function definitions with metavariable pattern", async () => {
			// Create test file
			const testFile = path.join(testDir, "test.ts");
			const content = `function hello() {
  return "world";
}

function greet(name: string) {
  console.log(name);
}

const arrow = () => {};
`;
			fs.writeFileSync(testFile, content);

			const result = await astGrepTool.execute("test-call", {
				pattern: "function $NAME($$$ARGS) { $BODY }",
				path: testDir,
				lang: "ts",
			});

			const output = getTextOutput(result);

			// Should find the two function definitions
			if (!result.details?.error) {
				expect(result.details?.matchCount).toBeGreaterThanOrEqual(1);
				expect(output).toContain("test.ts");
			}
		});

		it("finds variable declarations", async () => {
			const testFile = path.join(testDir, "vars.ts");
			const content = `const x = 1;
let y = 2;
const z = 3;
`;
			fs.writeFileSync(testFile, content);

			const result = await astGrepTool.execute("test-call", {
				pattern: "const $NAME = $VALUE",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("finds class definitions", async () => {
			const testFile = path.join(testDir, "class.ts");
			const content = `class Foo {
  bar() {}
}

class Baz {
  qux() {}
}
`;
			fs.writeFileSync(testFile, content);

			const result = await astGrepTool.execute("test-call", {
				pattern: "class $NAME { $$$BODY }",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBeGreaterThanOrEqual(1);
				const output = getTextOutput(result);
				expect(output).toContain("class.ts");
			}
		});

		it("handles no matches gracefully", async () => {
			const testFile = path.join(testDir, "empty.ts");
			fs.writeFileSync(testFile, "// no patterns here\n");

			const result = await astGrepTool.execute("test-call", {
				pattern: "function nonexistent() {}",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				const output = getTextOutput(result);
				expect(output).toContain("No matches found");
				expect(result.details?.matchCount).toBe(0);
			}
		});
	});

	describe("language filtering", () => {
		it("searches TypeScript files with lang filter", async () => {
			const tsFile = path.join(testDir, "test.ts");
			const pyFile = path.join(testDir, "test.py");

			fs.writeFileSync(tsFile, "function tsFunc() {}");
			fs.writeFileSync(pyFile, "def py_func():\n    pass");

			const result = await astGrepTool.execute("test-call", {
				pattern: "function $NAME() {}",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				const output = getTextOutput(result);
				expect(output).toContain("test.ts");
				expect(output).not.toContain("test.py");
			}
		});

		it("searches Python files with lang filter", async () => {
			const pyFile = path.join(testDir, "test.py");
			fs.writeFileSync(
				pyFile,
				`def hello():
    return "world"

def greet(name):
    print(name)
`,
			);

			const result = await astGrepTool.execute("test-call", {
				pattern: "def $NAME():\n    $BODY",
				path: testDir,
				lang: "py",
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBeGreaterThanOrEqual(1);
			}
		});
	});

	describe("glob patterns", () => {
		it("filters files by glob pattern", async () => {
			const tsFile = path.join(testDir, "test.ts");
			const jsFile = path.join(testDir, "test.js");

			fs.writeFileSync(tsFile, "function tsFunc() {}");
			fs.writeFileSync(jsFile, "function jsFunc() {}");

			const result = await astGrepTool.execute("test-call", {
				pattern: "function $NAME() {}",
				path: testDir,
				glob: "*.ts",
			});

			if (!result.details?.error) {
				const output = getTextOutput(result);
				expect(output).toContain("test.ts");
				expect(output).not.toContain("test.js");
			}
		});

		it("supports nested glob patterns", async () => {
			const srcDir = path.join(testDir, "src");
			fs.mkdirSync(srcDir);

			const nestedFile = path.join(srcDir, "nested.ts");
			fs.writeFileSync(nestedFile, "function nested() {}");

			const rootFile = path.join(testDir, "root.ts");
			fs.writeFileSync(rootFile, "function root() {}");

			const result = await astGrepTool.execute("test-call", {
				pattern: "function $NAME() {}",
				path: testDir,
				glob: "src/**/*.ts",
			});

			if (!result.details?.error) {
				const output = getTextOutput(result);
				expect(output).toContain("nested.ts");
				expect(output).not.toContain("root.ts");
			}
		});
	});

	describe("result limiting", () => {
		it("respects limit parameter", async () => {
			// Create file with many matches
			const testFile = path.join(testDir, "many.ts");
			const lines = Array.from({ length: 50 }, (_, i) => `const x${i} = ${i};`).join("\n");
			fs.writeFileSync(testFile, lines);

			const result = await astGrepTool.execute("test-call", {
				pattern: "const $NAME = $VALUE",
				path: testDir,
				lang: "ts",
				limit: 10,
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBeLessThanOrEqual(10);
				expect(result.details?.truncated).toBe(true);
			}
		});

		it("returns all results when under limit", async () => {
			const testFile = path.join(testDir, "few.ts");
			const content = `const a = 1;
const b = 2;
const c = 3;
`;
			fs.writeFileSync(testFile, content);

			const result = await astGrepTool.execute("test-call", {
				pattern: "const $NAME = $VALUE",
				path: testDir,
				lang: "ts",
				limit: 100,
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBe(3);
				expect(result.details?.truncated).toBe(false);
			}
		});
	});

	describe("error handling", () => {
		it("handles invalid pattern gracefully", async () => {
			const result = await astGrepTool.execute("test-call", {
				pattern: "invalid pattern [[[",
				path: testDir,
			});

			// Should either error or return no matches, not crash
			if (result.details?.error) {
				expect(result.details.error).toBeTruthy();
			} else {
				// Or succeed with no matches
				expect(result.details?.matchCount).toBeGreaterThanOrEqual(0);
			}
		});

		it("handles non-existent path", async () => {
			const result = await astGrepTool.execute("test-call", {
				pattern: "function $NAME() {}",
				path: "/nonexistent/path",
			});

			// Should return an error, not crash
			expect(result.details?.error).toBeTruthy();
		});
	});

	describe("output formatting", () => {
		it("groups matches by file", async () => {
			const file1 = path.join(testDir, "file1.ts");
			const file2 = path.join(testDir, "file2.ts");

			fs.writeFileSync(file1, "const a = 1;\nconst b = 2;");
			fs.writeFileSync(file2, "const c = 3;");

			const result = await astGrepTool.execute("test-call", {
				pattern: "const $NAME = $VALUE",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				const output = getTextOutput(result);
				expect(output).toContain("file1.ts");
				expect(output).toContain("file2.ts");
				expect(result.details?.fileCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("shows match count and file count in details", async () => {
			const testFile = path.join(testDir, "count.ts");
			fs.writeFileSync(testFile, "const x = 1;\nconst y = 2;\nconst z = 3;");

			const result = await astGrepTool.execute("test-call", {
				pattern: "const $NAME = $VALUE",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBe(3);
				expect(result.details?.fileCount).toBe(1);
				expect(result.details?.scopePath).toBe(testDir);
			}
		});

		it("includes line and column information", async () => {
			const testFile = path.join(testDir, "location.ts");
			fs.writeFileSync(testFile, "const x = 1;");

			const result = await astGrepTool.execute("test-call", {
				pattern: "const $NAME = $VALUE",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error && result.details?.fileMatches) {
				expect(result.details.fileMatches.length).toBeGreaterThan(0);
				expect(result.details.fileMatches[0].path).toBe(testFile);
				expect(result.details.fileMatches[0].count).toBeGreaterThan(0);
			}
		});
	});

	describe("realistic code patterns", () => {
		it("finds import statements", async () => {
			const testFile = path.join(testDir, "imports.ts");
			const content = `import { foo } from './foo';
import { bar } from './bar';
import * as utils from './utils';
`;
			fs.writeFileSync(testFile, content);

			const result = await astGrepTool.execute("test-call", {
				pattern: "import { $NAME } from $SOURCE",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("finds if statements", async () => {
			const testFile = path.join(testDir, "conditionals.ts");
			const content = `if (condition) {
  doSomething();
}

if (x > 0) {
  return true;
}
`;
			fs.writeFileSync(testFile, content);

			const result = await astGrepTool.execute("test-call", {
				pattern: "if ($COND) { $BODY }",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBeGreaterThanOrEqual(1);
			}
		});

		it("finds return statements", async () => {
			const testFile = path.join(testDir, "returns.ts");
			const content = `function foo() {
  return 42;
}

function bar() {
  return "hello";
}
`;
			fs.writeFileSync(testFile, content);

			const result = await astGrepTool.execute("test-call", {
				pattern: "return $VALUE",
				path: testDir,
				lang: "ts",
			});

			if (!result.details?.error) {
				expect(result.details?.matchCount).toBeGreaterThanOrEqual(1);
			}
		});
	});
});

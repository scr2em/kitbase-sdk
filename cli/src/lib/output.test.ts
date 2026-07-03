import { describe, it, expect, vi, afterEach } from "vitest";
import { printResult } from "./output.js";

// Regression coverage for a real bug: a response shaped like { points: [...], provider: "ALL" }
// (a metadata field alongside the actual collection, under an endpoint-specific name rather than
// the usual paginated `data` envelope) was falling through to the single-object renderer, which
// JSON.stringify'd the array field inline instead of rendering it as a table.

function captureLog(): { lines: string[] } {
	const lines: string[] = [];
	vi.spyOn(console, "log").mockImplementation((msg?: unknown) => {
		lines.push(String(msg ?? ""));
	});
	return { lines };
}

afterEach(() => {
	vi.restoreAllMocks();
});

describe("printResult", () => {
	it("prints pretty-printed JSON when --json is set, regardless of shape", () => {
		const { lines } = captureLog();
		printResult({ a: 1 }, { json: true });
		expect(lines.join("\n")).toBe(JSON.stringify({ a: 1 }, null, 2));
	});

	it("prints '(no content)' for null/undefined", () => {
		const { lines } = captureLog();
		printResult(null, { json: false });
		expect(lines.join("\n")).toContain("no content");
	});

	it("renders a plain array of objects as a table", () => {
		const { lines } = captureLog();
		printResult([{ id: "1", name: "a" }, { id: "2", name: "b" }], { json: false });
		const output = lines.join("\n");
		expect(output).toContain("id");
		expect(output).toContain("name");
		expect(output).toContain("1");
		expect(output).toContain("a");
		// Must not have degraded to a raw JSON dump.
		expect(output).not.toContain('{"id"');
	});

	it("unwraps the paginated { data: [...], page, totalPages } envelope into a table + page footer", () => {
		const { lines } = captureLog();
		printResult({ data: [{ id: "1" }], page: 0, size: 20, totalElements: 1, totalPages: 1 }, { json: false });
		const output = lines.join("\n");
		expect(output).toContain("id");
		expect(output).toMatch(/page 1 of 1/);
	});

	it("does not treat an object with an empty array field as paginated", () => {
		const { lines } = captureLog();
		printResult({ data: [], page: 0, totalPages: 0 }, { json: false });
		expect(lines.join("\n")).toContain("no results");
	});

	describe("wrapper objects with a differently-named primary collection", () => {
		it("renders the array field as a table instead of dumping it as JSON (the reported bug)", () => {
			const { lines } = captureLog();
			printResult(
				{
					provider: "ALL",
					points: [
						{ jobId: "a", presenceRate: 0.5 },
						{ jobId: "b", presenceRate: 1 },
					],
				},
				{ json: false },
			);
			const output = lines.join("\n");
			expect(output).not.toContain("[{"); // the literal bug: a raw JSON array embedded in the output
			expect(output).toContain("jobId");
			expect(output).toContain("presenceRate");
			expect(output).toContain("provider: ALL");
		});

		it("picks the largest array-of-objects field as primary when there's more than one", () => {
			const { lines } = captureLog();
			printResult(
				{
					small: [{ x: 1 }],
					big: [{ y: 1 }, { y: 2 }, { y: 3 }],
				},
				{ json: false },
			);
			const output = lines.join("\n");
			expect(output).toContain("y");
		});

		it("omits scalar metadata that doesn't exist rather than erroring, when there is none", () => {
			const { lines } = captureLog();
			printResult({ points: [{ jobId: "a" }] }, { json: false });
			const output = lines.join("\n");
			expect(output).toContain("jobId");
		});
	});

	it("renders a genuine single object (no array field) as key: value pairs", () => {
		const { lines } = captureLog();
		printResult({ id: "abc", name: "Widget", enabled: true }, { json: false });
		const output = lines.join("\n");
		expect(output).toContain("id");
		expect(output).toContain("abc");
		expect(output).toContain("Widget");
	});

	it("renders an array-of-scalars field on a single object as a comma-joined list, not raw JSON", () => {
		const { lines } = captureLog();
		printResult({ id: "abc", tags: ["a", "b", "c"] }, { json: false });
		const output = lines.join("\n");
		expect(output).toContain("a, b, c");
		expect(output).not.toContain('["a"');
	});
});

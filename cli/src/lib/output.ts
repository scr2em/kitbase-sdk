import chalk from "chalk";

/** Columns to prefer, in order, when rendering a table of objects with unknown shape. */
const PREFERRED_COLUMNS = [
	"id",
	"key",
	"name",
	"slug",
	"orgSlug",
	"email",
	"status",
	"enabled",
	"role",
	"createdAt",
	"updatedAt",
];
const MAX_COLUMNS = 6;

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Best-effort unwrap of the API's `{ data: [...], page, size, totalElements, totalPages }` envelope. */
function unwrapPagination(value: unknown): { items: unknown[]; page?: number; totalPages?: number } | null {
	if (!isPlainObject(value) || !Array.isArray(value["data"])) {
		return null;
	}
	const page = typeof value["page"] === "number" ? value["page"] : undefined;
	const totalPages = typeof value["totalPages"] === "number" ? value["totalPages"] : undefined;
	return { items: value["data"] as unknown[], page, totalPages };
}

function pickColumns(rows: Record<string, unknown>[]): string[] {
	const allKeys = new Set<string>();
	for (const row of rows) {
		for (const key of Object.keys(row)) {
			if (!isPlainObject(row[key]) && !Array.isArray(row[key])) {
				allKeys.add(key);
			}
		}
	}

	const preferred = PREFERRED_COLUMNS.filter((c) => allKeys.has(c));
	const rest = [...allKeys].filter((c) => !preferred.includes(c));
	return [...preferred, ...rest].slice(0, MAX_COLUMNS);
}

function formatCell(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function printTable(rows: Record<string, unknown>[]): void {
	if (rows.length === 0) {
		console.log(chalk.dim("(no results)"));
		return;
	}

	const columns = pickColumns(rows);
	const widths = columns.map((col) =>
		Math.max(col.length, ...rows.map((row) => formatCell(row[col]).length)),
	);

	const renderRow = (cells: string[]) =>
		cells.map((cell, i) => cell.padEnd(widths[i] ?? 0)).join("  ");

	console.log(chalk.bold(renderRow(columns)));
	console.log(chalk.dim(renderRow(widths.map((w) => "-".repeat(w)))));
	for (const row of rows) {
		console.log(renderRow(columns.map((col) => formatCell(row[col]))));
	}
}

function printSingleObject(obj: Record<string, unknown>): void {
	const keyWidth = Math.max(...Object.keys(obj).map((k) => k.length));
	for (const [key, value] of Object.entries(obj)) {
		console.log(`${chalk.dim(key.padEnd(keyWidth))}  ${formatCell(value)}`);
	}
}

/** Prints an API response, either as raw JSON (`--json`) or a human-friendly rendering. */
export function printResult(data: unknown, options: { json: boolean }): void {
	if (options.json) {
		console.log(JSON.stringify(data, null, 2));
		return;
	}

	if (data === undefined || data === null) {
		console.log(chalk.dim("(no content)"));
		return;
	}

	const paginated = unwrapPagination(data);
	if (paginated) {
		printTable(paginated.items as Record<string, unknown>[]);
		if (paginated.page !== undefined && paginated.totalPages !== undefined) {
			console.log(chalk.dim(`\npage ${paginated.page + 1} of ${paginated.totalPages}`));
		}
		return;
	}

	if (Array.isArray(data)) {
		printTable(data as Record<string, unknown>[]);
		return;
	}

	if (isPlainObject(data)) {
		printSingleObject(data);
		return;
	}

	console.log(String(data));
}

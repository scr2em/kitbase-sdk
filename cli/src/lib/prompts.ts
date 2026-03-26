import {
	select,
	checkbox,
	input,
	confirm,
	password,
} from "@inquirer/prompts";

export interface Choice<T> {
	name: string;
	value: T;
	description?: string;
}

/**
 * Interactive single-choice select (arrow keys).
 */
export async function selectOne<T>(message: string, choices: Choice<T>[]): Promise<T> {
	return select({ message, choices });
}

/**
 * Interactive multi-choice select (space to toggle, enter to confirm).
 */
export async function selectMany<T>(message: string, choices: Choice<T>[]): Promise<T[]> {
	return checkbox({ message, choices });
}

/**
 * Text input with optional validation.
 */
export async function inputText(
	message: string,
	options?: {
		default?: string;
		required?: boolean;
		validate?: (value: string) => string | true;
	},
): Promise<string> {
	return input({
		message,
		default: options?.default,
		validate: options?.validate ?? (options?.required ? (v) => (v.length > 0 ? true : "This field is required") : undefined),
	});
}

/**
 * Yes/no confirmation.
 */
export async function confirmPrompt(message: string, defaultValue = true): Promise<boolean> {
	return confirm({ message, default: defaultValue });
}

/**
 * Masked password/secret input.
 */
export async function inputSecret(
	message: string,
	options?: {
		validate?: (value: string) => string | true;
	},
): Promise<string> {
	return password({ message, mask: "*", validate: options?.validate });
}

import { Command } from "@oclif/core";
import { config as loadEnv } from "dotenv";

// Load .env on import
loadEnv();

export abstract class BaseCommand extends Command {
	// Shared base for all kitbase commands.
	// Add shared flags, hooks, or helpers here as the CLI grows.
}
#!/usr/bin/env node
// `oclif manifest` discovers commands via filesystem traversal, whose order isn't stable across
// runs (especially since codegen deletes and recreates every generated command file each time) —
// same commands, different key order, which just churns git diffs for no reason. Sort them.
import fs from "node:fs";

const path = "oclif.manifest.json";
const manifest = JSON.parse(fs.readFileSync(path, "utf-8"));

if (manifest.commands && typeof manifest.commands === "object") {
	const sorted = {};
	for (const key of Object.keys(manifest.commands).sort()) {
		sorted[key] = manifest.commands[key];
	}
	manifest.commands = sorted;
}

fs.writeFileSync(path, JSON.stringify(manifest, null, 2) + "\n");

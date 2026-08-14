#!/usr/bin/env node
// @ts-check

import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const bumpTypes = new Set([
	"from-git",
	"major",
	"minor",
	"patch",
	"premajor",
	"preminor",
	"prepatch",
	"prerelease",
]);

const usage = `Usage:
  pnpm release -- <bump> [--preid <id>] [--push] [--dry-run]

Bumps every workspace package, commits, and tags v<version>.

<bump> is patch, minor, major, prepatch, preminor, premajor, prerelease,
from-git, or an explicit version such as 0.1.0.

Examples:
  pnpm release -- patch
  pnpm release -- prerelease --preid beta
  pnpm release -- 0.1.0 --push
`;

/**
 * @param {string[]} argv
 * @returns {{ bump: string, dryRun: boolean, preid: string | undefined, push: boolean }}
 */
function parseArgs(argv) {
	/** @type {{ bump: string | undefined, dryRun: boolean, preid: string | undefined, push: boolean }} */
	const parsed = {
		bump: undefined,
		dryRun: false,
		preid: undefined,
		push: false,
	};

	for (let index = 0; index < argv.length; index += 1) {
		const arg = argv[index];
		if (arg == null || arg === "--") {
			continue;
		}
		if (arg === "--help" || arg === "-h") {
			process.stdout.write(usage);
			process.exit(0);
		}
		if (arg === "--dry-run") {
			parsed.dryRun = true;
			continue;
		}
		if (arg === "--push") {
			parsed.push = true;
			continue;
		}
		if (arg === "--preid") {
			const value = argv[index + 1];
			if (value == null || value.startsWith("-")) {
				throw new Error("--preid requires a value");
			}
			parsed.preid = value;
			index += 1;
			continue;
		}
		if (arg.startsWith("--preid=")) {
			parsed.preid = arg.slice("--preid=".length);
			continue;
		}
		if (arg.startsWith("-")) {
			throw new Error(`unknown option: ${arg}`);
		}
		if (parsed.bump != null) {
			throw new Error(`unexpected argument: ${arg}`);
		}
		parsed.bump = arg;
	}

	if (parsed.bump == null) {
		throw new Error(`missing bump argument\n\n${usage}`);
	}

	if (
		!bumpTypes.has(parsed.bump) &&
		!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(parsed.bump)
	) {
		throw new Error(`invalid bump: ${parsed.bump}\n\n${usage}`);
	}

	return {
		bump: parsed.bump,
		dryRun: parsed.dryRun,
		preid: parsed.preid,
		push: parsed.push,
	};
}

/**
 * @param {string} command
 * @param {string[]} args
 * @param {{ dryRun?: boolean }} [options]
 */
function run(command, args, options = {}) {
	if (options.dryRun) {
		process.stdout.write(`$ ${command} ${args.join(" ")}\n`);
		return;
	}

	const result = spawnSync(command, args, { stdio: "inherit" });
	if (result.status !== 0) {
		process.exit(result.status ?? 1);
	}
}

/**
 * @param {string} command
 * @param {string[]} args
 */
function capture(command, args) {
	const result = spawnSync(command, args, {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "pipe"],
	});
	if (result.status !== 0) {
		process.stderr.write(result.stderr);
		process.exit(result.status ?? 1);
	}
	return result.stdout.trim();
}

function assertCleanWorktree() {
	const status = capture("git", ["status", "--porcelain"]);
	if (status !== "") {
		throw new Error("working tree is not clean; commit or stash changes first");
	}
}

/**
 * @param {unknown} value
 * @returns {value is { name: string, version: string }}
 */
function isPackageManifest(value) {
	return (
		typeof value === "object" &&
		value != null &&
		"name" in value &&
		"version" in value &&
		typeof value.name === "string" &&
		typeof value.version === "string"
	);
}

function publishedVersions() {
	return readdirSync("packages", { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => {
			const path = join("packages", entry.name, "package.json");
			const manifest = JSON.parse(readFileSync(path, "utf8"));
			if (!isPackageManifest(manifest)) {
				throw new Error(`invalid package.json: ${path}`);
			}
			return { name: manifest.name, version: manifest.version };
		});
}

function currentVersion() {
	const versions = publishedVersions();
	const version = versions[0]?.version;
	if (version == null) {
		throw new Error("no workspace packages found");
	}
	const mismatched = versions.filter((pkg) => pkg.version !== version);
	if (mismatched.length > 0) {
		const details = mismatched
			.map((pkg) => `${pkg.name}@${pkg.version}`)
			.join(", ");
		throw new Error(
			`workspace versions differ: expected ${version}, got ${details}`,
		);
	}
	return version;
}

function main() {
	const options = parseArgs(process.argv.slice(2));

	if (!options.dryRun) {
		assertCleanWorktree();
	}

	const versionArgs = ["version", options.bump, "-r"];
	if (options.preid != null) {
		versionArgs.push("--preid", options.preid);
	}

	run("pnpm", versionArgs, { dryRun: options.dryRun });

	if (options.dryRun) {
		process.stdout.write("$ git add -u\n");
		process.stdout.write('$ git commit -m "chore: release v<new-version>"\n');
		process.stdout.write("$ git tag v<new-version>\n");
		if (options.push) {
			process.stdout.write("$ git push\n");
			process.stdout.write("$ git push origin v<new-version>\n");
		}
		return;
	}

	const version = currentVersion();
	const tag = `v${version}`;
	const message = `chore: release ${tag}`;

	run("git", ["add", "-u"]);
	run("git", ["commit", "-m", message]);
	run("git", ["tag", tag]);

	if (options.push) {
		run("git", ["push"]);
		run("git", ["push", "origin", tag]);
		return;
	}

	process.stdout.write(
		`Created ${tag}. Push with:\n  git push && git push origin ${tag}\n`,
	);
}

try {
	main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`${message}\n`);
	process.exit(1);
}

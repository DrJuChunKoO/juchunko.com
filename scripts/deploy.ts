import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { MANIFEST_PATH, SITE_HOST, buildSubmission, changedUrls, manifestSchema, type IndexNowManifest } from "../src/lib/indexnow";

const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const MAX_URLS_PER_REQUEST = 10_000;

async function fetchLiveManifest(): Promise<IndexNowManifest | null> {
	const url = `https://${SITE_HOST}${MANIFEST_PATH}`;
	const res = await fetch(url);
	if (res.status === 404) return null;
	if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
	return manifestSchema.parse(await res.json());
}

async function submit(urls: string[]) {
	for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
		const batch = urls.slice(i, i + MAX_URLS_PER_REQUEST);
		const res = await fetch(INDEXNOW_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json; charset=utf-8" },
			body: JSON.stringify(buildSubmission(batch)),
		});
		if (!res.ok) throw new Error(`IndexNow rejected ${batch.length} URLs: ${res.status} ${await res.text()}`);
	}
}

const next = manifestSchema.parse(JSON.parse(readFileSync(`dist${MANIFEST_PATH}`, "utf8")));

let previous: IndexNowManifest | null | undefined;
try {
	previous = await fetchLiveManifest();
} catch (error) {
	console.error("IndexNow: could not read the live manifest, skipping submission after deploy.", error);
}

const deploy = spawnSync("npx", ["wrangler", "deploy", ...process.argv.slice(2)], { stdio: "inherit" });
if (deploy.status !== 0) process.exit(deploy.status ?? 1);

if (previous !== undefined) {
	const urls = changedUrls(previous, next);
	if (urls.length === 0) {
		console.log("IndexNow: no changed pages to submit.");
	} else {
		try {
			await submit(urls);
			console.log(`IndexNow: submitted ${urls.length} URLs.\n${urls.join("\n")}`);
		} catch (error) {
			console.error("IndexNow: deploy succeeded but submission failed.", error);
			process.exit(1);
		}
	}
}

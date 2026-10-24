import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { unzipSync } from "fflate";
import photos from "@/data/portrait-photos.json";
import { createPortraitArchive } from "./portrait-download";

test("photo pack preserves all eight originals and filenames", async () => {
	const progress: number[] = [];
	const archive = await createPortraitArchive(
		(completed) => progress.push(completed),
		async (url) => new Response(await readFile(`public${url}`)),
	);
	const extracted = unzipSync(archive);
	assert.equal(photos.length, 8);
	assert.deepEqual(
		Object.keys(extracted),
		photos.map((photo) => photo.filename),
	);
	assert.deepEqual(progress, [1, 2, 3, 4, 5, 6, 7, 8]);
	for (const photo of photos) {
		assert.deepEqual(Buffer.from(extracted[photo.filename]), await readFile(`public${photo.original}`));
	}
});

test("photo pack rejects failed or incomplete downloads instead of exporting a broken ZIP", async () => {
	for (const response of [new Response("Missing", { status: 404 }), new Response("<html>Fallback page</html>")]) {
		await assert.rejects(
			createPortraitArchive(
				() => assert.fail("Failed downloads must not advance progress"),
				async () => response,
			),
			/Photo download failed|Incomplete photo download/,
		);
	}
});

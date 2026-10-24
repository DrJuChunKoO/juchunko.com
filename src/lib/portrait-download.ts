import { zipSync } from "fflate";
import photos from "@/data/portrait-photos.json";

export async function createPortraitArchive(onProgress: (completed: number) => void, fetchFile: typeof fetch = fetch) {
	const files: Record<string, Uint8Array> = {};
	for (const [index, photo] of photos.entries()) {
		const response = await fetchFile(photo.original, { signal: AbortSignal.timeout(120_000) });
		if (!response.ok) throw new Error(`Photo download failed: ${photo.original} (${response.status})`);
		const bytes = new Uint8Array(await response.arrayBuffer());
		if (bytes.byteLength !== photo.bytes) throw new Error(`Incomplete photo download: ${photo.original}`);
		files[photo.filename] = bytes;
		onProgress(index + 1);
	}
	// JPEG originals are already compressed. Store them unchanged in the ZIP.
	return zipSync(files, { level: 0 });
}

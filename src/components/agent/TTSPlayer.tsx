import { useEffect, useState, useRef, useCallback } from "react";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { BookAudio, Play, Pause, Rewind, FastForward, Loader2, StepForward, StepBack } from "lucide-react";
import ElevenLabsAudioNative from "./ElevenLabsAudioNative";
import { ui } from "src/i18n/ui";

const ttsQueryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 1000 * 60 * 30, // 30 minutes
			gcTime: 1000 * 60 * 60, // 60 minutes
			retry: 2,
			refetchOnWindowFocus: false,
		},
	},
});

type SupportedLang = "en" | "zh-TW";

type AudioSegment = {
	text: string;
	hash: string;
	audio: string;
};

interface TTSPlayerProps {
	isOpen: boolean;
	lang?: SupportedLang;
}

type Mode = "loading" | "api" | "fallback" | "error";

async function fetchTTSAudioSegments(domain: string, path: string): Promise<AudioSegment[]> {
	try {
		const response = await fetch(`https://tts-api.juchunko.com/v1/audio/${domain}/${path}`);

		if (response.status === 404) {
			throw new Error("NOT_FOUND");
		}

		if (!response.ok) {
			throw new Error(`API error: ${response.status}`);
		}

		const data = await response.json();

		if (!Array.isArray(data) || data.length === 0) {
			throw new Error("NOT_FOUND");
		}

		return data;
	} catch (error) {
		console.error("fetchTTSAudioSegments error:", error);
		throw error;
	}
}

export default function TTSPlayer({ isOpen, lang = "zh-TW" }: TTSPlayerProps) {
	const [mode, setMode] = useState<Mode>("loading");
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [totalDuration, setTotalDuration] = useState(0);
	const [segmentDurations, setSegmentDurations] = useState<number[]>([]);
	const [highlightEnabled, setHighlightEnabled] = useState(true);
	const [playbackRate, setPlaybackRate] = useState(1);

	const currentAudioRef = useRef<HTMLAudioElement | null>(null);
	const progressUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const audioElementsRef = useRef<HTMLAudioElement[]>([]);
	const originalStylesRef = useRef<Map<HTMLElement, { color: string; transition: string }>>(new Map());

	const currentUrl = typeof window !== "undefined" ? window.location.href : "";

	const {
		data: segments = [],
		isLoading,
		isError,
	} = useQuery(
		{
			queryKey: ["ttsSegments", currentUrl],
			queryFn: async () => {
				const url = new URL(currentUrl);
				const domain = url.hostname;
				const path = url.pathname.slice(1).replace(/\/$/, "");
				return fetchTTSAudioSegments(domain, path);
			},
			enabled: isOpen && !!currentUrl,
		},
		ttsQueryClient,
	);

	const loadAudioElements = useCallback(async (segData: AudioSegment[]) => {
		try {
			const audios = segData.map((seg) => {
				const audio = new Audio(seg.audio);
				audio.preload = "metadata";
				return audio;
			});
			audioElementsRef.current = audios;

			setSegmentDurations(new Array(audios.length).fill(0));
			setMode("api");

			audios.forEach((audio, index) => {
				const updateDuration = () => {
					setSegmentDurations((prev) => {
						const next = [...prev];
						next[index] = audio.duration || 0;
						return next;
					});
					audio.removeEventListener("loadedmetadata", updateDuration);
					audio.removeEventListener("error", onMetaError);
				};
				const onMetaError = () => {
					audio.removeEventListener("loadedmetadata", updateDuration);
					audio.removeEventListener("error", onMetaError);
				};

				if (audio.readyState >= 1) {
					updateDuration();
				} else {
					audio.addEventListener("loadedmetadata", updateDuration);
					audio.addEventListener("error", onMetaError);
				}
			});
		} catch (error) {
			console.error("loadAudioElements error:", error);
			setMode("fallback");
		}
	}, []);

	useEffect(() => {
		if (isOpen) {
			if (isLoading) {
				setMode("loading");
			} else if (isError) {
				setMode("fallback");
			} else if (segments && segments.length > 0) {
				if (mode === "loading") {
					loadAudioElements(segments);
				}
			} else if (!isLoading) {
				setMode("fallback");
			}
		} else {
			if (currentAudioRef.current) {
				currentAudioRef.current.pause();
				currentAudioRef.current = null;
			}
			setIsPlaying(false);
			setCurrentTime(0);
			setCurrentIndex(0);
			setSegmentDurations([]);
			setTotalDuration(0);
			if (progressUpdateIntervalRef.current) {
				clearInterval(progressUpdateIntervalRef.current);
				progressUpdateIntervalRef.current = null;
			}
			// Reset styles
			resetAllStyles();
		}
	}, [isOpen, isLoading, isError, segments, mode, loadAudioElements]);

	useEffect(() => {
		setTotalDuration(segmentDurations.reduce((acc, d) => acc + d, 0));
	}, [segmentDurations]);

	const calculateSegmentStartTime = useCallback(
		(index: number): number => {
			if (index <= 0 || index >= segmentDurations.length) return 0;
			return segmentDurations.slice(0, index).reduce((acc, d) => acc + d, 0);
		},
		[segmentDurations],
	);

	const jumpToSegment = useCallback(
		(index: number) => {
			const newIndex = Math.max(0, Math.min(segments.length - 1, index));
			const startTime = calculateSegmentStartTime(newIndex);
			setCurrentIndex(newIndex);
			setCurrentTime(startTime);
		},
		[segments.length, calculateSegmentStartTime],
	);

	const handleEnded = useCallback(() => {
		if (isPlaying && currentIndex < segments.length - 1) {
			const nextIndex = currentIndex + 1;
			const startTime = calculateSegmentStartTime(nextIndex);
			setCurrentIndex(nextIndex);
			setCurrentTime(startTime);
		} else {
			setIsPlaying(false);
		}
	}, [isPlaying, currentIndex, segments.length, calculateSegmentStartTime]);

	useEffect(() => {
		if (mode !== "api" || audioElementsRef.current.length === 0 || currentIndex >= audioElementsRef.current.length) return;

		const audio = audioElementsRef.current[currentIndex];
		if (currentAudioRef.current && currentAudioRef.current !== audio) {
			currentAudioRef.current.pause();
		}

		currentAudioRef.current = audio;
		audio.playbackRate = playbackRate;

		const handleError = (e: Event) => {
			console.error("Audio segment error, skipping:", e);
			if (isPlaying) handleEnded();
		};

		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("error", handleError);

		if (isPlaying) {
			audio.play().catch((err) => {
				console.error("Playback failed:", err);
				handleEnded();
			});
		} else {
			audio.pause();
		}

		return () => {
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("error", handleError);
		};
	}, [currentIndex, isPlaying, mode, segments.length, handleEnded, playbackRate]);

	useEffect(() => {
		if (mode !== "api" || !isPlaying) return;

		progressUpdateIntervalRef.current = setInterval(() => {
			if (currentAudioRef.current) {
				const previousSegmentsDuration = segmentDurations.slice(0, currentIndex).reduce((acc, d) => acc + d, 0);
				const segmentCurrentTime = currentAudioRef.current.currentTime;
				setCurrentTime(previousSegmentsDuration + segmentCurrentTime);
			}
		}, 100);

		return () => {
			if (progressUpdateIntervalRef.current) {
				clearInterval(progressUpdateIntervalRef.current);
				progressUpdateIntervalRef.current = null;
			}
		};
	}, [mode, isPlaying, currentIndex, segmentDurations]);

	/**
	 * Normalize text for matching by removing extra whitespace
	 */
	const normalizeText = (text: string): string => {
		return text.replace(/\s+/g, " ").trim();
	};

	const isDescendantOf = (parent: HTMLElement, element: Element): boolean => {
		let current: Element | null = element;
		while (current) {
			if (current === parent) return true;
			current = current.parentElement;
		}
		return false;
	};

	const resetAllStyles = useCallback(() => {
		originalStylesRef.current.forEach((style, el) => {
			el.style.color = style.color;
			el.style.transition = style.transition;
		});
		originalStylesRef.current.clear();
		// Also clean up any lingering styles on all elements in main
		const main = document.querySelector("main") || document.querySelector("article");
		if (main) {
			main.querySelectorAll("*").forEach((el) => {
				const htmlEl = el as HTMLElement;
				htmlEl.style.color = "";
				htmlEl.style.transition = "";
			});
		}
	}, []);

	useEffect(() => {
		if (mode !== "api" || segments.length === 0 || !highlightEnabled) {
			resetAllStyles();
			return;
		}

		const mainContent = document.querySelector("main") || document.querySelector("article") || document.body;
		if (!mainContent) return;

		const targetText = normalizeText(segments[currentIndex]?.text || "");
		if (!targetText) return;

		let matchedElement: HTMLElement | null = null;

		// Get all text nodes and their parent elements
		const walker = document.createTreeWalker(mainContent, NodeFilter.SHOW_TEXT, null);
		const textNodes: { node: Text; parent: HTMLElement; text: string }[] = [];

		let node: Node | null;
		while ((node = walker.nextNode())) {
			const textNode = node as Text;
			const parent = textNode.parentElement;
			if (parent && textNode.textContent) {
				const text = normalizeText(textNode.textContent);
				if (text) {
					textNodes.push({ node: textNode, parent, text });
				}
			}
		}

		// Try to find the smallest element containing the target text
		const blockElements = Array.from(mainContent.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, blockquote, div, time"));

		// Strategy 1: Find exact match in block elements
		for (const el of blockElements) {
			const htmlEl = el as HTMLElement;
			const elText = normalizeText(htmlEl.textContent || "");
			if (elText === targetText) {
				matchedElement = htmlEl;
				break;
			}
		}

		// Strategy 2: Find partial match with minimum size
		if (!matchedElement) {
			let minLength = Infinity;
			for (const el of blockElements) {
				const htmlEl = el as HTMLElement;
				const elText = normalizeText(htmlEl.textContent || "");

				// Check if element contains target text
				if (elText.includes(targetText)) {
					const textLength = elText.length;
					// Prefer smaller containers that still contain the full text
					if (textLength < minLength) {
						matchedElement = htmlEl;
						minLength = textLength;
					}
				}
			}
		}

		// Strategy 3: If still no match, try finding by text nodes
		if (!matchedElement) {
			// Build text from consecutive text nodes
			for (let i = 0; i < textNodes.length; i++) {
				let combinedText = "";
				let endIndex = i;
				let commonAncestor: HTMLElement | null = null;

				for (let j = i; j < textNodes.length; j++) {
					combinedText += (combinedText ? " " : "") + textNodes[j].text;

					if (normalizeText(combinedText) === targetText || normalizeText(combinedText).includes(targetText)) {
						endIndex = j;
						// Find common ancestor of all nodes from i to j
						if (i === j) {
							commonAncestor = textNodes[i].parent;
						} else {
							// Find the smallest common ancestor
							let ancestor: HTMLElement | null = textNodes[i].parent;
							while (ancestor) {
								let isCommon = true;
								for (let k = i; k <= j; k++) {
									if (!ancestor.contains(textNodes[k].node)) {
										isCommon = false;
										break;
									}
								}
								if (isCommon) {
									commonAncestor = ancestor;
									break;
								}
								ancestor = ancestor.parentElement;
							}
						}

						if (commonAncestor) {
							matchedElement = commonAncestor;
							if (normalizeText(combinedText) === targetText) {
								break;
							}
						}
					}

					// Stop if text is getting too long
					if (combinedText.length > targetText.length * 2) {
						break;
					}
				}

				if (matchedElement && normalizeText(matchedElement.textContent || "") === targetText) {
					break;
				}
			}
		}

		if (matchedElement) {
			// Store original styles and apply highlighting
			mainContent.querySelectorAll("*").forEach((el) => {
				const htmlEl = el as HTMLElement;
				if (!originalStylesRef.current.has(htmlEl)) {
					originalStylesRef.current.set(htmlEl, {
						color: htmlEl.style.color,
						transition: htmlEl.style.transition,
					});
				}

				if (matchedElement!.contains(el) || el === matchedElement) {
					// Highlighted element: keep original color
					htmlEl.style.color = "";
					htmlEl.style.transition = "color 0.3s ease";
				} else if (!isDescendantOf(matchedElement!, el)) {
					// Dimmed elements: use CSS variable for dimmed color
					htmlEl.style.color = "var(--tts-dimmed)";
					htmlEl.style.transition = "color 0.3s ease";
				}
			});
			matchedElement.scrollIntoView({ behavior: "smooth", block: "center" });
		}

		return () => {
			// Styles will be reset on next effect call or cleanup
		};
	}, [mode, segments, currentIndex, highlightEnabled, resetAllStyles]);

	const togglePlay = useCallback(() => setIsPlaying(!isPlaying), [isPlaying]);

	const seek = useCallback(
		(time: number) => {
			let accumulated = 0;
			for (let i = 0; i < segmentDurations.length; i++) {
				if (accumulated + segmentDurations[i] >= time) {
					setCurrentIndex(i);
					const audio = audioElementsRef.current[i];
					if (audio) {
						audio.currentTime = Math.max(0, time - accumulated);
						setCurrentTime(time);
					}
					return;
				}
				accumulated += segmentDurations[i];
			}
		},
		[segmentDurations],
	);

	const seekForward = () => {
		const newTime = Math.min(totalDuration, currentTime + 15);
		seek(newTime);
	};

	const seekBackward = () => {
		const newTime = Math.max(0, currentTime - 15);
		seek(newTime);
	};

	const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="bg-card/50 flex flex-col p-4">
			{mode === "loading" && (
				<div className="flex min-h-[160px] flex-col items-center justify-center">
					<Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
					<p className="text-muted-foreground mt-2 text-center text-xs">{ui[lang]["agent.voiceReader.loading"]}</p>
				</div>
			)}

			{mode === "fallback" && (
				<div className="flex min-h-[160px] flex-col items-center justify-center space-y-2">
					<ElevenLabsAudioNative publicUserId="e826f7db9aa74a5b23ec481d0d24467f232dbc1622ceb065c98ff3c4adb99830" size="small" />
				</div>
			)}

			{mode === "api" && segments.length > 0 && (
				<motion.div
					className="flex flex-col space-y-5 py-2"
					initial={{ opacity: 0, y: 10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3 }}
				>
					{/* Currently Playing Text */}
					<div className="bg-muted/30 border-border/50 rounded-lg border px-3 py-2.5">
						<div className="text-muted-foreground mb-1 text-xs">正在播放</div>
						<div className="text-foreground line-clamp-2 text-sm leading-relaxed">{segments[currentIndex]?.text || ""}</div>
					</div>

					{/* Progress Bar */}
					<div className="space-y-2">
						<div className="relative w-full">
							<div className="bg-muted/50 h-2 w-full overflow-hidden rounded-full">
								<motion.div
									className="bg-primary h-full rounded-full"
									initial={{ width: 0 }}
									animate={{ width: `${progressPercentage}%` }}
									transition={{ duration: 0.1 }}
								/>
							</div>
							<input
								type="range"
								min="0"
								max={totalDuration || 0}
								step="0.1"
								value={currentTime}
								onChange={(e) => seek(Number(e.target.value))}
								className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
							/>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-muted-foreground font-mono text-xs tabular-nums">{formatTime(currentTime)}</span>
							<div className="flex items-center gap-2">
								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={() => setHighlightEnabled(!highlightEnabled)}
									className={`cursor-pointer rounded-md p-1.5 transition-colors ${
										highlightEnabled ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-muted-foreground/10"
									}`}
									title={highlightEnabled ? "關閉文字凸顯" : "開啟文字凸顯"}
								>
									<BookAudio className="size-3.5" />
								</motion.button>
								<motion.button
									whileTap={{ scale: 0.95 }}
									onClick={() => {
										const rates = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];
										const currentIdx = rates.indexOf(playbackRate);
										const nextIdx = (currentIdx + 1) % rates.length;
										setPlaybackRate(rates[nextIdx]);
									}}
									className="text-muted-foreground hover:bg-muted-foreground/10 cursor-pointer rounded-md px-2 py-1 font-mono text-xs tabular-nums transition-colors"
									title="調整播放速度"
								>
									{playbackRate}×
								</motion.button>
							</div>
							<span className="text-muted-foreground font-mono text-xs tabular-nums">{formatTime(totalDuration)}</span>
						</div>
					</div>

					{/* Controls */}
					<div className="flex items-center justify-center gap-1">
						<motion.button
							whileTap={{ scale: 0.9 }}
							onClick={() => jumpToSegment(currentIndex - 1)}
							disabled={currentIndex === 0}
							className="text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
							aria-label={ui[lang]["agent.voiceReader.previous"]}
						>
							<StepBack className="size-4" />
						</motion.button>

						<motion.button
							whileTap={{ scale: 0.9 }}
							onClick={seekBackward}
							disabled={currentTime < 1}
							className="text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
							aria-label={ui[lang]["agent.voiceReader.rewind15s"]}
						>
							<Rewind className="size-4" />
						</motion.button>

						<motion.button
							whileTap={{ scale: 0.9 }}
							whileHover={{ scale: 1.05 }}
							onClick={togglePlay}
							className="bg-primary text-primary-foreground hover:bg-primary/90 mx-1 cursor-pointer rounded-full p-3.5 shadow-md transition-all"
							aria-label={isPlaying ? ui[lang]["agent.voiceReader.pause"] : ui[lang]["agent.voiceReader.play"]}
						>
							{isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
						</motion.button>

						<motion.button
							whileTap={{ scale: 0.9 }}
							onClick={seekForward}
							disabled={currentTime >= totalDuration - 1}
							className="text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
							aria-label={ui[lang]["agent.voiceReader.forward15s"]}
						>
							<FastForward className="size-4" />
						</motion.button>

						<motion.button
							whileTap={{ scale: 0.9 }}
							onClick={() => jumpToSegment(currentIndex + 1)}
							disabled={currentIndex === segments.length - 1}
							className="text-muted-foreground hover:bg-muted/50 hover:text-foreground cursor-pointer rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
							aria-label={ui[lang]["agent.voiceReader.next"]}
						>
							<StepForward className="size-4" />
						</motion.button>
					</div>
				</motion.div>
			)}

			{(mode === "error" || (mode === "api" && segments.length === 0)) && (
				<div className="flex min-h-[160px] items-center justify-center">
					<p className="text-destructive text-center text-xs">{ui[lang]["agent.voiceReader.error"]}</p>
				</div>
			)}
		</div>
	);
}

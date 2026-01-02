import { useEffect, useState, useRef, useCallback } from "react";
import { QueryClient, useQuery } from "@tanstack/react-query";
import { motion, useMotionValue } from "motion/react";
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
	Text: string;
	Audio: string;
};

interface TTSPlayerProps {
	isOpen: boolean;
	onClose: () => void;
	lang?: SupportedLang;
}

type Mode = "loading" | "api" | "fallback" | "error";

async function fetchTTSAudioSegments(domain: string, path: string): Promise<AudioSegment[]> {
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
}

export default function TTSPlayer({ isOpen, onClose, lang = "zh-TW" }: TTSPlayerProps) {
	const y = useMotionValue(16);

	const [mode, setMode] = useState<Mode>("loading");
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentIndex, setCurrentIndex] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [totalDuration, setTotalDuration] = useState(0);
	const [segmentDurations, setSegmentDurations] = useState<number[]>([]);
	const [highlightEnabled, setHighlightEnabled] = useState(true);
	const currentAudioRef = useRef<HTMLAudioElement | null>(null);
	const progressUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);
	const audioElementsRef = useRef<HTMLAudioElement[]>([]);
	const originalStylesRef = useRef<Map<HTMLElement, { opacity: string; transition: string }>>(new Map());

	const currentUrl = useRef("");

	useEffect(() => {
		if (isOpen && typeof window !== "undefined") {
			currentUrl.current = window.location.href;
		}
	}, [isOpen]);

	const {
		data: segments = [],
		isLoading,
		isError,
	} = useQuery(
		{
			queryKey: ["ttsSegments", currentUrl.current],
			queryFn: async () => {
				const url = new URL(currentUrl.current);
				const domain = url.hostname;
				const path = url.pathname.slice(1).replace(/\/$/, "");
				return fetchTTSAudioSegments(domain, path);
			},
			enabled: isOpen && !!currentUrl.current,
		},
		ttsQueryClient,
	);

	useEffect(() => {
		if (isOpen) {
			setMode("loading");
			setCurrentIndex(0);
			setIsPlaying(false);
			setCurrentTime(0);
			setTotalDuration(0);
			setSegmentDurations([]);
			if (currentAudioRef.current) {
				currentAudioRef.current.pause();
				currentAudioRef.current = null;
			}
			if (progressUpdateIntervalRef.current) {
				clearInterval(progressUpdateIntervalRef.current);
				progressUpdateIntervalRef.current = null;
			}

			if (isLoading) {
				setMode("loading");
			} else if (isError) {
				setMode("fallback");
			} else if (segments.length > 0) {
				loadAudioElements(segments);
			} else {
				setMode("fallback");
			}
		}
	}, [isOpen, isLoading, isError, segments]);

	const loadAudioElements = async (segData: AudioSegment[]) => {
		const audios = segData.map((seg) => new Audio(seg.Audio));
		audioElementsRef.current = audios;

		const durations = audios.map((audio) => {
			return new Promise<number>((resolve) => {
				if (audio.duration) {
					resolve(audio.duration);
				} else {
					audio.addEventListener("loadedmetadata", () => {
						resolve(audio.duration || 0);
					});
				}
			});
		});

		const resolvedDurations = await Promise.all(durations);
		setSegmentDurations(resolvedDurations);
		setTotalDuration(resolvedDurations.reduce((acc, d) => acc + d, 0));
		setMode("api");
	};

	useEffect(() => {
		function handleScroll() {
			const footer = document.getElementById("footer");
			if (!footer) return;
			const rect = footer.getBoundingClientRect();
			const windowHeight = window.innerHeight;
			const top = rect.y - windowHeight;
			const isBottom = top < 0;

			y.set(isBottom ? 16 - top : 16);
		}
		window.addEventListener("scroll", handleScroll);
		handleScroll();
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useEffect(() => {
		if (mode !== "api" || audioElementsRef.current.length === 0 || currentIndex >= audioElementsRef.current.length) return;

		const audio = audioElementsRef.current[currentIndex];
		if (currentAudioRef.current && currentAudioRef.current !== audio) {
			currentAudioRef.current.pause();
		}

		currentAudioRef.current = audio;

		const handleEnded = () => {
			if (isPlaying && currentIndex < segments.length - 1) {
				const nextIndex = currentIndex + 1;
				const startTime = segmentDurations.slice(0, nextIndex).reduce((acc, d) => acc + d, 0);
				setCurrentIndex(nextIndex);
				setCurrentTime(startTime);
			} else {
				setIsPlaying(false);
			}
		};

		audio.addEventListener("ended", handleEnded);

		if (isPlaying) {
			audio.play().catch(console.error);
		} else {
			audio.pause();
		}

		return () => {
			audio.removeEventListener("ended", handleEnded);
		};
	}, [currentIndex, isPlaying, mode, segments.length]);

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

	useEffect(() => {
		if (mode !== "api" || segments.length === 0 || !highlightEnabled) return;

		const mainContent = document.querySelector("main") || document.querySelector("article") || document.body;
		if (!mainContent) return;

		const currentSegmentText = segments[currentIndex]?.Text?.trim() || "";
		if (!currentSegmentText) return;

		const cleanText = (text: string): string => {
			return text.replace(/\s+/g, " ").trim();
		};

		const targetText = cleanText(currentSegmentText);
		let matchedElement: HTMLElement | null = null;

		const blockElements = mainContent.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, div");

		for (const el of blockElements) {
			const htmlEl = el as HTMLElement;
			const elText = cleanText(htmlEl.textContent || "");

			if (elText === targetText) {
				matchedElement = htmlEl;
				break;
			}

			if (elText.includes(targetText) && targetText.length > 20) {
				if (!matchedElement || (htmlEl.textContent?.length || 0) > (matchedElement.textContent?.length || 0)) {
					matchedElement = htmlEl;
				}
			}
		}

		if (matchedElement) {
			mainContent.querySelectorAll("*").forEach((el) => {
				const htmlEl = el as HTMLElement;
				if (htmlEl.style.opacity) {
					originalStylesRef.current.set(htmlEl, {
						opacity: htmlEl.style.opacity,
						transition: htmlEl.style.transition || "",
					});
				}

				if (matchedElement!.contains(el) || el === matchedElement) {
					htmlEl.style.opacity = "1";
					htmlEl.style.transition = "opacity 0.3s ease";
					htmlEl.style.filter = "brightness(1.1)";
				} else if (!isDescendantOf(matchedElement!, el)) {
					htmlEl.style.opacity = "0.3";
					htmlEl.style.transition = "opacity 0.3s ease";
					htmlEl.style.filter = "brightness(0.9)";
				}
			});

			matchedElement.scrollIntoView({ behavior: "smooth", block: "center" });
		}

		return () => {
			originalStylesRef.current.forEach((style, el) => {
				el.style.opacity = style.opacity;
				el.style.transition = style.transition;
			});
			originalStylesRef.current.clear();
		};
	}, [mode, segments, currentIndex, highlightEnabled]);

	useEffect(() => {
		if (!isOpen) {
			if (currentAudioRef.current) {
				currentAudioRef.current.pause();
				currentAudioRef.current = null;
			}
			setIsPlaying(false);
			if (progressUpdateIntervalRef.current) {
				clearInterval(progressUpdateIntervalRef.current);
				progressUpdateIntervalRef.current = null;
			}

			document.querySelectorAll("*").forEach((el) => {
				const htmlEl = el as HTMLElement;
				htmlEl.style.opacity = "";
				htmlEl.style.transition = "";
				htmlEl.style.filter = "";
			});
		}
	}, [isOpen]);

	const isDescendantOf = (parent: HTMLElement, element: Element): boolean => {
		let current: Element | null = element;
		while (current) {
			if (current === parent) return true;
			current = current.parentElement;
		}
		return false;
	};

	const togglePlay = useCallback(() => setIsPlaying(!isPlaying), [isPlaying]);

	const calculateSegmentStartTime = (index: number): number => {
		if (index <= 0 || index >= segmentDurations.length) return 0;
		return segmentDurations.slice(0, index).reduce((acc, d) => acc + d, 0);
	};

	const jumpToSegment = (index: number) => {
		const newIndex = Math.max(0, Math.min(segments.length - 1, index));
		const startTime = calculateSegmentStartTime(newIndex);
		setCurrentIndex(newIndex);
		setCurrentTime(startTime);
	};

	const seek = (time: number) => {
		let accumulated = 0;
		for (let i = 0; i < segmentDurations.length; i++) {
			if (accumulated + segmentDurations[i] >= time) {
				setCurrentIndex(i);
				const audio = audioElementsRef.current[i];
				if (audio) {
					audio.currentTime = time - accumulated;
					setCurrentTime(time);
				}
				return;
			}
			accumulated += segmentDurations[i];
		}
	};

	const seekForward = () => {
		const newTime = currentTime + 15;
		if (newTime <= totalDuration) {
			seek(newTime);
		}
	};

	const seekBackward = () => {
		const newTime = currentTime - 15;
		if (newTime >= 0) {
			seek(newTime);
		}
	};

	const progressPercentage = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="flex h-[350px] flex-col p-4">
			{mode === "loading" && (
				<div className="flex flex-1 flex-col items-center justify-center">
					<Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
					<p className="text-muted-foreground mt-2 text-center text-xs">{ui[lang]["agent.voiceReader.loading"]}</p>
				</div>
			)}

			{mode === "fallback" && (
				<div className="flex flex-1 flex-col items-center justify-center space-y-2">
					<ElevenLabsAudioNative publicUserId="e826f7db9aa74a5b23ec481d0d24467f232dbc1622ceb065c98ff3c4adb99830" size="small" />
					<p className="text-muted-foreground text-center text-xs">{ui[lang]["agent.voiceReader.poweredBy"]}</p>
				</div>
			)}

			{mode === "api" && segments.length > 0 && (
				<div className="flex flex-1 flex-col space-y-4">
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-xs">
							{formatTime(currentTime)} / {formatTime(totalDuration)}
						</span>
						<div className="flex items-center gap-2">
							<motion.button
								whileTap={{ scale: 0.95 }}
								onClick={() => setHighlightEnabled(!highlightEnabled)}
								className={`text-muted-foreground cursor-pointer rounded-lg p-1.5 transition-colors ${highlightEnabled ? "bg-primary/20" : ""}`}
								title={highlightEnabled ? "關閉文字凸顯" : "開啟文字凸顯"}
							>
								<BookAudio className="size-4" />
							</motion.button>
							<span className="text-muted-foreground max-w-[150px] truncate text-xs">
								{segments[currentIndex]?.Text?.slice(0, 50)}
								{segments[currentIndex]?.Text?.length > 50 ? "..." : ""}
							</span>
						</div>
					</div>

					<div className="relative w-full">
						<div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
							<motion.div
								className="bg-primary h-full"
								initial={{ width: 0 }}
								animate={{ width: `${progressPercentage}%` }}
								transition={{ duration: 0.1 }}
							/>
						</div>
						<input
							type="range"
							min="0"
							max={totalDuration}
							value={currentTime}
							onChange={(e) => seek(Number(e.target.value))}
							className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
						/>
					</div>

					<div className="flex items-center justify-center gap-2">
						<motion.button
							whileTap={{ scale: 0.95 }}
							onClick={() => jumpToSegment(currentIndex - 1)}
							disabled={currentIndex === 0}
							className="hover:bg-muted-foreground/10 text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors disabled:opacity-50"
							aria-label={ui[lang]["agent.voiceReader.previous"]}
						>
							<StepBack className="size-5" />
						</motion.button>

						<motion.button
							whileTap={{ scale: 0.95 }}
							onClick={seekBackward}
							disabled={currentTime < 15 && currentIndex === 0}
							className="hover:bg-muted-foreground/10 text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors disabled:opacity-50"
							aria-label={ui[lang]["agent.voiceReader.rewind15s"]}
						>
							<Rewind className="size-5" />
						</motion.button>

						<motion.button
							whileTap={{ scale: 0.95 }}
							onClick={togglePlay}
							className="hover:bg-muted-foreground/10 text-foreground cursor-pointer rounded-lg p-3 transition-colors"
							aria-label={isPlaying ? ui[lang]["agent.voiceReader.pause"] : ui[lang]["agent.voiceReader.play"]}
						>
							{isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
						</motion.button>

						<motion.button
							whileTap={{ scale: 0.95 }}
							onClick={seekForward}
							disabled={totalDuration > 0 && currentTime >= totalDuration - 15}
							className="hover:bg-muted-foreground/10 text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors disabled:opacity-50"
							aria-label={ui[lang]["agent.voiceReader.forward15s"]}
						>
							<FastForward className="size-5" />
						</motion.button>

						<motion.button
							whileTap={{ scale: 0.95 }}
							onClick={() => jumpToSegment(currentIndex + 1)}
							disabled={currentIndex === segments.length - 1}
							className="hover:bg-muted-foreground/10 text-muted-foreground cursor-pointer rounded-lg p-2 transition-colors disabled:opacity-50"
							aria-label={ui[lang]["agent.voiceReader.next"]}
						>
							<StepForward className="size-5" />
						</motion.button>
					</div>
				</div>
			)}

			{mode === "error" && (
				<p className="text-destructive flex flex-1 items-center justify-center text-center text-xs">
					{ui[lang]["agent.voiceReader.error"]}
				</p>
			)}
		</div>
	);
}

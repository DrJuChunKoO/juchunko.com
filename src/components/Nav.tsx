import { cn } from "@/lib/utils";
import { defaultLang, languages, ui } from "@/i18n/ui";
import { Menu, Moon, Sun, X } from "lucide-react";
import React, { useEffect, useState, type ReactNode, type SVGProps } from "react";
import LanguageSelector from "./LanguageSelector";

type SupportedLang = keyof typeof languages;

interface NavProps {
	lang: SupportedLang;
}

interface SocialLinkProps {
	href: string;
	children: ReactNode;
	className?: string;
	onClick?: () => void;
}

const externalLinks = [
	{ href: "https://blog.juchunko.com/", copyKey: "nav.blog" },
	{ href: "https://transpal.juchunko.com/", copyKey: "nav.transript" },
] as const;

const socialLinks = [
	{ href: "https://github.com/DrJuChunKoO/juchunko.com", label: "GitHub repository for this site", Icon: GithubIcon },
	{ href: "https://fb.com/dr.juchunko/", label: "Facebook", Icon: FacebookIcon },
	{ href: "https://instagr.am/dr.juchunko/", label: "Instagram", Icon: InstagramIcon },
	{ href: "https://tiktok.com/@dr.juchunko", label: "TikTok", Icon: TiktokIcon },
	{ href: "https://threads.net/@dr.juchunko", label: "Threads", Icon: ThreadsIcon },
	{ href: "https://youtube.com/@dr.juchunko", label: "YouTube", Icon: YoutubeIcon },
	{ href: "https://x.com/@dAAAb", label: "X", Icon: XBrandIcon },
] as const;

export function resolveNavLang(pathname: string, browserLanguage?: string, fallbackLang: SupportedLang = defaultLang) {
	const [, pathLang] = pathname.split("/");
	if (pathLang && pathLang in ui) {
		return pathLang as SupportedLang;
	}

	if (!browserLanguage) {
		return fallbackLang;
	}

	return browserLanguage.startsWith("zh") ? "zh-TW" : "en";
}

function getNavCopy(lang: SupportedLang) {
	const copy = ui[lang] as Record<string, string>;
	return {
		siteTitle: copy["site.title"],
		blog: copy["nav.blog"],
		transcript: copy["nav.transript"],
	};
}

function applyStoredTheme() {
	try {
		const stored = localStorage.getItem("theme");
		const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
		const dark = stored === "dark" || (!stored && prefersDark);
		document.documentElement.classList.toggle("dark", dark);
	} catch {
		// Ignore storage and matchMedia failures.
	}
}

function SocialLink({ href, children, className, onClick }: SocialLinkProps) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			onClick={onClick}
			className={cn(
				"hover:outline-primary/50 hover:bg-primary/5 text-primary/75 hover:text-primary/90 active:text-primary rounded-full p-1 hover:outline-2 hover:outline-offset-2",
				className,
			)}
		>
			{children}
		</a>
	);
}

export default function Nav({ lang }: NavProps) {
	const [currentLang, setCurrentLang] = useState<SupportedLang>(lang);
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const copy = getNavCopy(currentLang);

	useEffect(() => {
		applyStoredTheme();
		setCurrentLang(resolveNavLang(window.location.pathname, window.navigator.language, lang));
	}, [lang]);

	useEffect(() => {
		document.body.classList.toggle("nav-open", isMenuOpen);
		return () => {
			document.body.classList.remove("nav-open");
		};
	}, [isMenuOpen]);

	useEffect(() => {
		if (!isMenuOpen) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				setIsMenuOpen(false);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [isMenuOpen]);

	const handleThemeToggle = () => {
		const html = document.documentElement;
		const isDark = html.classList.toggle("dark");

		try {
			localStorage.setItem("theme", isDark ? "dark" : "light");
		} catch {
			// Ignore storage failures.
		}
	};

	const closeMenu = () => setIsMenuOpen(false);

	return (
		<div className="in-[.scrolled]:border-border bg-card/75 sticky inset-x-0 top-0 z-40 flex w-full flex-col border-b border-transparent backdrop-blur-xl transition-colors print:hidden">
			<nav
				className={cn(
					"mx-auto flex min-h-16 w-full max-w-360 items-center justify-end gap-2 text-sm transition-all md:max-w-[90vw]",
					"pr-[max(env(safe-area-inset-right),1rem)] pl-[max(env(safe-area-inset-left),1rem)]",
					"md:pr-[max(env(safe-area-inset-right),2rem)] md:pl-[max(env(safe-area-inset-left),2rem)]",
				)}
			>
				<a
					className="hover:outline-primary/50 -m-1 flex items-center rounded-lg p-1 text-sm transition-opacity hover:opacity-80 hover:outline-2 hover:outline-offset-2 md:text-base ltr:mr-auto rtl:ml-auto"
					href={`/${currentLang}`}
				>
					<span className="text-foreground font-medium tracking-wide uppercase" id="site-title">
						{copy.siteTitle}
					</span>
				</a>
				{externalLinks.map((link) => (
					<a
						key={link.href}
						href={link.href}
						target="_blank"
						rel="noreferrer"
						className="hover:text-foreground hover:outline-primary/50 text-muted-foreground relative hidden rounded-lg p-1 text-sm whitespace-nowrap transition-colors duration-200 hover:outline-2 hover:outline-offset-2 md:inline-block"
					>
						{link.copyKey === "nav.blog" ? copy.blog : copy.transcript}
					</a>
				))}
				<a
					href={socialLinks[0].href}
					target="_blank"
					rel="noreferrer"
					className="hover:outline-primary/50 text-muted-foreground hover:text-foreground hidden rounded-full p-1 transition-opacity hover:opacity-80 hover:outline-2 hover:outline-offset-2 md:inline-flex"
					title={socialLinks[0].label}
					aria-label={socialLinks[0].label}
				>
					<GithubIcon className="size-6" />
				</a>
				<button
					type="button"
					onClick={handleThemeToggle}
					aria-label="Toggle dark mode"
					className="hover:outline-primary/50 cursor-pointer rounded-full p-1 text-current hover:opacity-75 hover:outline-2 hover:outline-offset-2"
				>
					<Sun className="h-6 w-6 dark:hidden" />
					<Moon className="hidden h-6 w-6 dark:block" />
				</button>
				<button
					className="hover:outline-primary/50 text-muted-foreground hover:text-foreground inline-flex items-center justify-center rounded-lg p-2 transition-colors hover:outline-2 hover:outline-offset-2 md:hidden"
					type="button"
					onClick={() => setIsMenuOpen((open) => !open)}
					aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
					aria-controls="mobile-nav"
					aria-expanded={isMenuOpen}
				>
					<span className="sr-only">{isMenuOpen ? "Close navigation menu" : "Open navigation menu"}</span>
					<Menu className={cn("h-5 w-5", isMenuOpen && "hidden")} />
					<X className={cn("h-5 w-5", !isMenuOpen && "hidden")} />
				</button>
			</nav>
			{isMenuOpen && (
				<div
					id="mobile-nav"
					className={cn(
						"nav-menu text-foreground inset-x-0 top-full z-50 overflow-y-auto px-8 pt-8 pb-12 backdrop-blur-xl transition-all duration-300 md:hidden",
						"flex flex-1 flex-col gap-6",
					)}
					aria-hidden={!isMenuOpen}
				>
					<div className="flex flex-1 flex-col justify-center gap-6 text-2xl font-medium">
						{externalLinks.map((link) => (
							<a
								key={`mobile-${link.href}`}
								href={link.href}
								target="_blank"
								rel="noreferrer"
								onClick={closeMenu}
								className="hover:text-foreground text-muted-foreground transition-colors"
							>
								{link.copyKey === "nav.blog" ? copy.blog : copy.transcript}
							</a>
						))}
					</div>
					<div className="grid grid-cols-4 place-items-center gap-4">
						{socialLinks.map(({ href, label, Icon }) => (
							<SocialLink key={href} href={href} onClick={closeMenu} className="flex aspect-square w-12 items-center justify-center">
								<Icon className="size-6" aria-hidden="true" />
								<span className="sr-only">{label}</span>
							</SocialLink>
						))}
					</div>
					<div className="flex flex-col items-center gap-4">
						<span className="bg-border h-px w-48" />
						<LanguageSelector initialLang={currentLang} />
					</div>
				</div>
			)}
		</div>
	);
}

function GithubIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2c2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2a4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6c-.6.6-.6 1.2-.5 2V21"
			/>
		</svg>
	);
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M7 10v4h3v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3V3h-3a5 5 0 0 0-5 5v2z"
			/>
		</svg>
	);
}

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
			<g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
				<path d="M4 8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
				<path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0-6 0m7.5-4.5v.01" />
			</g>
		</svg>
	);
}

function TiktokIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M21 7.917v4.034A9.95 9.95 0 0 1 16 10v4.5a6.5 6.5 0 1 1-8-6.326V12.5a2.5 2.5 0 1 0 4 2V3h4.083A6.005 6.005 0 0 0 21 7.917"
			/>
		</svg>
	);
}

function ThreadsIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="M19 7.5Q17 3 12 3c-5 0-8 2.5-8 9s3.5 9 8 9s7-3 7-5s-1-5-7-5c-2.5 0-3 1.25-3 2.5C9 15 10 16 11.5 16c2.5 0 3.5-1.5 3.5-5s-2-4-3-4s-1.833.333-2.5 1"
			/>
		</svg>
	);
}

function YoutubeIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
			<g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2">
				<path d="M2 8a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z" />
				<path d="m10 9l5 3l-5 3z" />
			</g>
		</svg>
	);
}

function XBrandIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" {...props}>
			<path
				stroke="currentColor"
				strokeLinecap="round"
				strokeLinejoin="round"
				strokeWidth="2"
				d="m4 4l11.733 16H20L8.267 4zm0 16l6.768-6.768m2.46-2.46L20 4"
			/>
		</svg>
	);
}

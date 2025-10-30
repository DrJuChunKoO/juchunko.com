import { Carousel } from "./ui/Carousel";
import { timeAgo } from "../lib/utils";
import { BookText, Signature, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface Activity {
	id: string;
	type: "propose" | "cosign" | "meet";
	title: string;
	date: Date | null;
	url?: string;
	details: Record<string, string | undefined | null>;
}

interface ActivityCarouselProps {
	activities: Activity[];
	lang: "en" | "zh-TW";
	labels: Record<string, string>;
}

const activityTypeMap: Record<Activity["type"], { icon: LucideIcon }> = {
	propose: { icon: BookText },
	cosign: { icon: Signature },
	meet: { icon: User },
};

export function ActivityCarousel({ activities, lang, labels }: ActivityCarouselProps) {
	const renderItem = (item: Activity) => {
		const activityInfo = {
			label: labels[item.type],
			icon: activityTypeMap[item.type].icon,
		};
		const Icon = activityInfo.icon;
		const Wrapper = item.url ? "a" : "div";
		const wrapperProps =
			Wrapper === "a"
				? {
						href: item.url,
						target: "_blank",
						rel: "noopener noreferrer",
				  }
				: {};

		return (
			<Wrapper {...wrapperProps} className="card-link no-underline h-full">
				<div className="bg-card text-card-foreground hover:bg-muted flex h-full w-full flex-col justify-between rounded-lg border p-4 transition-colors">
					<div>
						<div className="mb-2 flex w-full items-center justify-between">
							<span className="flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
								<Icon className="h-3.5 w-3.5" />
								{activityInfo.label}
							</span>
							<time className="text-xs font-normal leading-none text-slate-500 dark:text-slate-400">
								{item.date ? timeAgo(item.date.toISOString(), lang) : ""}
							</time>
						</div>
						<h3 className="line-clamp-2 text-base font-bold leading-tight">{item.title}</h3>
					</div>
					<div className="mt-1 flex flex-col gap-0.5 text-xs text-slate-600 dark:text-slate-400">
						{Object.entries(item.details)
							.filter(([, value]) => value)
							.map(([key, value]) => (
								<p className="line-clamp-1">
									<span className="font-medium">{key}</span>: {value}
								</p>
							))}
					</div>
				</div>
			</Wrapper>
		);
	};

	return <Carousel items={activities} renderItem={renderItem} lang={lang} ariaLabelPrefix={labels.activity} />;
}
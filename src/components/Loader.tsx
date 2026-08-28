import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
	className?: string;
	size?: number;
}

export function Loader({ className, size = 20 }: LoaderProps) {
	return <Loader2 aria-hidden="true" className={cn("animate-spin text-gray-400", className)} size={size} />;
}

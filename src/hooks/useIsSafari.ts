import { useEffect, useState } from "react";
export default function useIsSafari() {
	const [isSafari, setIsSafari] = useState(false);
	useEffect(() => {
		if (typeof navigator === "undefined") return;
		const ua = navigator.userAgent || "";
		const detected = /Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|OPR/.test(ua);
		setIsSafari(detected);
	}, []);
	return isSafari;
}

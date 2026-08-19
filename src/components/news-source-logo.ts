export const newsSourceLogos: Record<string, string> = {
	UDN: "/news-logos/udn.png",
	自由時報: "/news-logos/ltn.png",
	中央社: "/news-logos/cna.png",
	"Focus Taiwan - CNA English News": "/news-logos/cna.png",
	"ETtoday 新聞雲": "/news-logos/ettoday.png",
	今日新聞: "/news-logos/nownews.png",
	中時新聞網: "/news-logos/chinatimes.png",
	梅花新聞網: "/news-logos/i-meihua.png",
	三立新聞: "/news-logos/setn.png",
	壹蘋新聞網: "/news-logos/nextapple.png",
	風傳媒: "/news-logos/storm.png",
	動區動趨: "/news-logos/blocktempo.png",
	中央廣播電臺: "/news-logos/rti.png",
	信傳媒: "/news-logos/cmmedia.png",
	公視新聞網: "/news-logos/pts.ico",
	TVBS新聞網: "/news-logos/tvbs.png",
	匯流新聞網: "/news-logos/cnews.png",
	經濟日報: "/news-logos/economic-daily.png",
	CTWANT: "/news-logos/ctwant.png",
	太報: "/news-logos/taisounds.png",
	民視新聞網: "/news-logos/ftvnews.png",
};

export function getNewsSourceLogo(source?: string | null) {
	if (!source) return null;
	return newsSourceLogos[source.trim()] ?? null;
}

import type { RenderFunctionInput } from "astro-opengraph-images";
import React from "react";
import fs from "node:fs";
import path from "path";

const logoPath = path.join(process.cwd(), "public", "favicon.png");
const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

export async function customRenderer({ title, description, pathname }: RenderFunctionInput): Promise<React.ReactNode> {
	const isEnglish = pathname.startsWith("/en/");
	const siteName = isEnglish ? "Ju Chun Ko" : "科技立委葛如鈞．寶博士";
	return (
		<div
			style={{
				display: "flex",
				height: "100%",
				width: "100%",
				fontFamily: "'TikTok Sans', 'Noto Sans TC', sans-serif",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#F3F4F6",
				backgroundImage: "linear-gradient(135deg, #E0F2FE 0%, #F8FBFF 62%, #EFF6FF 100%)",
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width: "86%",
					height: "76%",
					backgroundColor: "white",
					borderRadius: "26px",
					boxShadow: "0 24px 48px -20px rgba(15, 23, 42, 0.22)",
					padding: "52px 66px 42px",
					position: "relative",
				}}
			>
				{/* Header: Logo & Site Name */}
				<div style={{ display: "flex", alignItems: "center", marginBottom: "30px" }}>
					<img src={logoBase64} width={32} height={32} style={{ borderRadius: "6px", marginRight: "16px" }} />
					<span
						style={{
							fontSize: "23px",
							fontWeight: 700,
							color: "#6B7280",
							letterSpacing: "0.05em",
						}}
					>
						{siteName}
					</span>
				</div>

				{/* Main Content */}
				<div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
					<h1
						style={{
							fontSize: "58px",
							fontWeight: 700,
							color: "#111827",
							marginBottom: "18px",
							lineHeight: 1.1,
							letterSpacing: "-0.025em",
						}}
					>
						{title}
					</h1>

					{description && (
						<p
							style={{
								fontSize: "32px",
								color: "#4B5563",
								lineHeight: 1.5,
								lineClamp: 3,
								display: "block",
							}}
						>
							{description}
						</p>
					)}
				</div>

				{/* Footer / Decorative Element */}
				<div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "24px" }}>
					<span
						style={{
							fontSize: "22px",
							fontWeight: 600,
							color: "#3B82F6",
							textTransform: "uppercase",
							letterSpacing: "0.1em",
						}}
					>
						The Plurality is here.
					</span>
				</div>
			</div>
		</div>
	);
}

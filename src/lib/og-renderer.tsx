import type { RenderFunctionInput } from "astro-opengraph-images";
import React from "react";
import fs from "node:fs";
import path from "path";

const logoPath = path.join(process.cwd(), "public", "favicon.png");
const logoBase64 = `data:image/png;base64,${fs.readFileSync(logoPath).toString("base64")}`;

export async function customRenderer({ title, description }: RenderFunctionInput): Promise<React.ReactNode> {
	return (
		<div
			style={{
				display: "flex",
				height: "100%",
				width: "100%",
				fontFamily: "'TikTok Sans', 'Noto Sans TC', sans-serif",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#F3F4F6", // gray-100
				backgroundImage: "linear-gradient(to bottom right, #E0F2FE,  #F0F9FF)", // sky-100 to sky-50
			}}
		>
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					width: "90%",
					height: "80%",
					backgroundColor: "white",
					borderRadius: "24px",
					boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)", // shadow-xl
					padding: "40px 60px",
					position: "relative",
				}}
			>
				{/* Header: Logo & Site Name */}
				<div style={{ display: "flex", alignItems: "center", marginBottom: "24px" }}>
					<img src={logoBase64} width="32" height="32" style={{ borderRadius: "4px", marginRight: "16px" }} />
					<span
						style={{
							fontSize: "24px",
							fontWeight: 700,
							color: "#6B7280", // gray-500
							letterSpacing: "0.05em",
						}}
					>
						科技立委葛如鈞．寶博士
					</span>
				</div>

				{/* Main Content */}
				<div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "center" }}>
					<h1
						style={{
							fontSize: "64px",
							fontWeight: 700,
							color: "#111827", // gray-900
							marginBottom: "16px",
							lineHeight: 1.1,
							letterSpacing: "-0.025em",
						}}
					>
						{title}
					</h1>

					{description && (
						<p
							style={{
								fontSize: "36px",
								color: "#4B5563", // gray-600
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
							fontSize: "24px",
							fontWeight: 600,
							color: "#3B82F6", // blue-500
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

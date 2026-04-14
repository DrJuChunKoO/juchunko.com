import { useEffect, useRef } from "react";

interface GaussianSplatViewerProps {
	url: string;
	className?: string;
	style?: React.CSSProperties;
}

// ── Camera settings ───────────────────────────────────────────────────────────
const BASE_POS = [0, 0.15, 2.2] as const;
const LOOK_AT = [0, 0, 0] as const;
const MAX_ORBIT = 0.2; // radians
const LERP = 0.05;

export default function GaussianSplatViewer({ url, className, style }: GaussianSplatViewerProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef({ x: 0, y: 0 });
	const smoothRef = useRef({ x: 0, y: 0 });

	// ── Mouse — track entire window ───────────────────────────────────────────
	useEffect(() => {
		const onMove = (e: MouseEvent) => {
			inputRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
			inputRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
		};
		window.addEventListener("mousemove", onMove);
		return () => window.removeEventListener("mousemove", onMove);
	}, []);

	// ── Gyroscope ─────────────────────────────────────────────────────────────
	useEffect(() => {
		if (typeof window === "undefined" || !window.DeviceOrientationEvent) return;
		const onOrientation = (e: DeviceOrientationEvent) => {
			inputRef.current.x = Math.max(-1, Math.min(1, (e.gamma ?? 0) / 30));
			inputRef.current.y = Math.max(-1, Math.min(1, ((e.beta ?? 45) - 45) / 30));
		};
		window.addEventListener("deviceorientation", onOrientation);
		return () => window.removeEventListener("deviceorientation", onOrientation);
	}, []);

	// ── Three.js + Spark ──────────────────────────────────────────────────────
	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let disposed = false;

		const init = async () => {
			const THREE = await import("three");
			const { SplatMesh, SparkRenderer } = await import("@sparkjsdev/spark");

			if (disposed) return;

			// Renderer
			const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
			renderer.setClearColor(0x000000, 0);
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(container.clientWidth, container.clientHeight);
			container.appendChild(renderer.domElement);

			// Scene + camera
			const scene = new THREE.Scene();
			const aspect = container.clientWidth / container.clientHeight;
			const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
			camera.position.set(...BASE_POS);
			camera.lookAt(...LOOK_AT);

			// SparkRenderer — must be added to scene
			const sparkRenderer = new SparkRenderer({ renderer });
			scene.add(sparkRenderer);

			// Splat mesh — rotate 180° around Z to correct upside-down orientation
			const splat = new SplatMesh({ url }) as any;
			splat.rotation.z = Math.PI;
			splat.rotation.y = -Math.PI / 2;
			scene.add(splat);

			// Resize handler
			const onResize = () => {
				if (!container) return;
				const w = container.clientWidth;
				const h = container.clientHeight;
				camera.aspect = w / h;
				camera.updateProjectionMatrix();
				renderer.setSize(w, h);
			};
			const resizeObserver = new ResizeObserver(onResize);
			resizeObserver.observe(container);

			// Orbit helpers
			const [bx, by, bz] = BASE_POS;
			const [tx, ty, tz] = LOOK_AT;
			const dx0 = bx - tx;
			const dy0 = by - ty;
			const dz0 = bz - tz;

			// Render loop
			renderer.setAnimationLoop(() => {
				if (disposed) return;

				// Smooth input
				const inp = inputRef.current;
				const s = smoothRef.current;
				s.x += (inp.x - s.x) * LERP;
				s.y += (inp.y - s.y) * LERP;

				// Orbit camera around target
				const yaw = s.x * MAX_ORBIT;
				const pitch = s.y * MAX_ORBIT;

				const cy = Math.cos(yaw),
					sy = Math.sin(yaw);
				const dx1 = dx0 * cy + dz0 * sy;
				const dz1 = -dx0 * sy + dz0 * cy;

				const cp = Math.cos(pitch),
					sp = Math.sin(pitch);
				const dy2 = dy0 * cp - dz1 * sp;
				const dz2 = dy0 * sp + dz1 * cp;

				camera.position.set(tx + dx1, ty + dy2, tz + dz2);
				camera.lookAt(tx, ty, tz);

				renderer.render(scene, camera);
			});

			// Cleanup
			return () => {
				disposed = true;
				resizeObserver.disconnect();
				renderer.setAnimationLoop(null);
				renderer.dispose();
				container.removeChild(renderer.domElement);
			};
		};

		let cleanup: (() => void) | undefined;
		init()
			.then((fn) => {
				cleanup = fn;
			})
			.catch((err) => console.error("GaussianSplatViewer:", err));

		return () => {
			disposed = true;
			cleanup?.();
		};
	}, [url]);

	return <div ref={containerRef} className={className} style={{ width: "100%", height: "100%", ...style }} />;
}

import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_position;
attribute float a_seed;
attribute float a_alpha;

uniform float u_aspect;
uniform float u_dpr;

varying float v_seed;
varying float v_alpha;

void main() {
  v_seed = a_seed;
  v_alpha = a_alpha;
  float dist = length(a_position);
  gl_Position = vec4(a_position.x / u_aspect, a_position.y, 0.0, 1.0);
  float sz = (2.5 + dist * 4.0) * u_dpr;
  gl_PointSize = clamp(sz, 2.0 * u_dpr, 8.0 * u_dpr);
}
`;

const FRAG = `
precision mediump float;
uniform float u_time;
varying float v_seed;
varying float v_alpha;

void main() {
  vec2 coord = gl_PointCoord - vec2(0.5);
  float r = length(coord);
  if (r > 0.5) discard;
  float edge = 1.0 - smoothstep(0.25, 0.5, r);

  float speed  = 2.0 + v_seed * 5.0;
  float phase  = v_seed * 6.2831853;
  float f1     = sin(u_time * speed + phase) * 0.5 + 0.5;
  float speed2 = 1.1 + v_seed * 3.0;
  float f2     = sin(u_time * speed2 + phase * 1.7) * 0.5 + 0.5;
  float combined = f1 * 0.6 + f2 * 0.4;
  float blink  = smoothstep(0.18, 0.38, combined);

  float alpha = v_alpha * blink * (0.05 + combined * 0.70) * edge;
  gl_FragColor = vec4(0.0, 0.0, 0.0, alpha);
}
`;

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
	const s = gl.createShader(type)!;
	gl.shaderSource(s, src);
	gl.compileShader(s);
	if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
		const msg = gl.getShaderInfoLog(s);
		gl.deleteShader(s);
		throw new Error("Shader: " + msg);
	}
	return s;
}

function createProgram(gl: WebGLRenderingContext, vs: string, fs: string): WebGLProgram {
	const p = gl.createProgram()!;
	const v = compileShader(gl, gl.VERTEX_SHADER, vs);
	const f = compileShader(gl, gl.FRAGMENT_SHADER, fs);
	gl.attachShader(p, v);
	gl.attachShader(p, f);
	gl.linkProgram(p);
	if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
		const msg = gl.getProgramInfoLog(p);
		gl.deleteProgram(p);
		throw new Error("Program: " + msg);
	}
	gl.deleteShader(v);
	gl.deleteShader(f);
	return p;
}

interface Particle {
	// original spawn position (used to reset)
	ox: number;
	oy: number;
	// current position
	x: number;
	y: number;
	seed: number;
	// 0 = invisible, 1 = fully visible
	alpha: number;
	state: "idle" | "attracted" | "dead";
	respawnTimer: number;
	// intro delay in seconds (0.2~1.0)
	introDelay: number;
}

function randomOrbPosition(): [number, number] {
	const angle = Math.random() * Math.PI * 2;
	const r = Math.random() < 0.3 ? Math.sqrt(Math.random()) * 0.88 : 0.35 + Math.random() * 0.6;
	return [Math.cos(angle) * r, Math.sin(angle) * r];
}

function makeParticle(): Particle {
	const [x, y] = randomOrbPosition();
	return { ox: x, oy: y, x, y, seed: Math.random(), alpha: 1, state: "idle", respawnTimer: 0, introDelay: 0.2 + Math.random() * 0.8 };
}

export default function ParticleOrb({ particleCount = 500 }: { particleCount?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

		const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
		if (!gl) return;

		let prog: WebGLProgram;
		try {
			prog = createProgram(gl, VERT, FRAG);
		} catch (e) {
			console.error("ParticleOrb:", e);
			return;
		}
		gl.useProgram(prog);

		// attribute / uniform locations
		const aPos = gl.getAttribLocation(prog, "a_position");
		const aSeed = gl.getAttribLocation(prog, "a_seed");
		const aAlpha = gl.getAttribLocation(prog, "a_alpha");
		const uTime = gl.getUniformLocation(prog, "u_time");
		const uAspect = gl.getUniformLocation(prog, "u_aspect");
		const uDpr = gl.getUniformLocation(prog, "u_dpr");

		// dynamic buffers — updated every frame
		const posBuf = gl.createBuffer()!;
		const seedBuf = gl.createBuffer()!;
		const alphaBuf = gl.createBuffer()!;
		const posData = new Float32Array(particleCount * 2);
		const seedData = new Float32Array(particleCount);
		const alphaData = new Float32Array(particleCount);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(0, 0, 0, 0);

		// sizing
		let aspect = 1,
			dpr = 1;
		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) return;
			dpr = window.devicePixelRatio || 1;
			canvas.width = Math.round(rect.width * dpr);
			canvas.height = Math.round(rect.height * dpr);
			aspect = rect.width / rect.height;
			gl.viewport(0, 0, canvas.width, canvas.height);
		};
		resize();
		const ro = new ResizeObserver(resize);
		ro.observe(canvas);

		// mouse
		let mx = 0,
			my = 0,
			mouseActive = 0;
		const updateMouse = (cx: number, cy: number) => {
			const rect = canvas.getBoundingClientRect();
			const nx = ((cx - rect.left) / rect.width) * 2 - 1;
			const ny = -(((cy - rect.top) / rect.height) * 2 - 1);
			mx = nx * aspect;
			my = ny;
		};
		const onMove = (e: MouseEvent) => {
			updateMouse(e.clientX, e.clientY);
			mouseActive = 1;
		};
		const onLeave = () => {
			mouseActive = 0;
		};
		const onTouch = (e: TouchEvent) => {
			updateMouse(e.touches[0].clientX, e.touches[0].clientY);
			mouseActive = 1;
		};
		const onTouchEnd = () => {
			mouseActive = 0;
		};
		canvas.addEventListener("mousemove", onMove);
		canvas.addEventListener("mouseleave", onLeave);
		canvas.addEventListener("touchmove", onTouch, { passive: true });
		canvas.addEventListener("touchend", onTouchEnd);

		// init particles — all start invisible
		const particles: Particle[] = Array.from({ length: particleCount }, () => {
			const p = makeParticle();
			p.alpha = 0;
			return p;
		});

		// intro fade-in: 0 → 1 over ~2s, multiplied onto all alphas
		let introProgress = 0;

		const resetIntro = () => {
			introProgress = 0;
			for (const p of particles) {
				p.alpha = 0;
				p.state = "idle";
				p.x = p.ox;
				p.y = p.oy;
				p.introDelay = 0.2 + Math.random() * 0.8;
			}
		};

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") resetIntro();
		};
		document.addEventListener("visibilitychange", onVisibilityChange);

		// render loop
		let rafId = 0;
		const t0 = performance.now();
		let lastNow = t0;

		const render = (now: number) => {
			const t = (now - t0) / 1000;
			const dt = Math.min((now - lastNow) / 1000, 0.05);
			lastNow = now;

			// intro timer advance
			introProgress = Math.min(2, introProgress + dt);

			// ── update particles ──
			for (let i = 0; i < particles.length; i++) {
				const p = particles[i];

				if (p.state === "dead") {
					// teleport back to origin invisibly, then fade in fast
					p.x = p.ox;
					p.y = p.oy;
					p.alpha = 0;
					p.state = "idle";
					// immediately check if should be attracted again
					if (mouseActive > 0.05) {
						const mdx = mx - p.x;
						const mdy = my - p.y;
						if (Math.sqrt(mdx * mdx + mdy * mdy) < 0.4) {
							p.state = "attracted";
							p.alpha = 0.6 + Math.random() * 0.4;
						}
					}
				} else if (p.state === "attracted") {
					// move toward mouse
					const dx = mx - p.x;
					const dy = my - p.y;
					const dist = Math.sqrt(dx * dx + dy * dy) + 0.001;
					const speed = 0.5 + (1 - Math.min(dist, 1)) * 0.6;
					p.x += (dx / dist) * speed * dt;
					p.y += (dy / dist) * speed * dt;

					// fade out as it nears the mouse
					const proximity = Math.max(0, 1 - dist / 0.2);
					p.alpha -= proximity * dt * 10 + dt * 0.5;

					if (p.alpha <= 0 || dist < 0.015) {
						p.alpha = 0;
						p.state = "dead";
					}
				} else {
					// idle: fade in quickly
					p.alpha = Math.min(1, p.alpha + dt * 3.0);

					// only attract particles within a radius of ~0.4 world units from mouse
					if (mouseActive > 0.05) {
						const dx = mx - p.x;
						const dy = my - p.y;
						const dist = Math.sqrt(dx * dx + dy * dy);
						if (dist < 0.4) {
							p.state = "attracted";
						}
					}
				}

				posData[i * 2] = p.x;
				posData[i * 2 + 1] = p.y;
				seedData[i] = p.seed;
				// per-particle intro: fade in over 0.4s after its own delay
				const introAlpha = Math.min(1, Math.max(0, (introProgress - p.introDelay) / 0.4));
				alphaData[i] = Math.max(0, p.alpha) * introAlpha;
			}

			// ── upload + draw ──
			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.useProgram(prog);

			gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
			gl.bufferData(gl.ARRAY_BUFFER, posData, gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(aPos);
			gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
			gl.bufferData(gl.ARRAY_BUFFER, seedData, gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(aSeed);
			gl.vertexAttribPointer(aSeed, 1, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuf);
			gl.bufferData(gl.ARRAY_BUFFER, alphaData, gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(aAlpha);
			gl.vertexAttribPointer(aAlpha, 1, gl.FLOAT, false, 0, 0);

			gl.uniform1f(uTime, t);
			gl.uniform1f(uAspect, aspect);
			gl.uniform1f(uDpr, dpr);

			gl.drawArrays(gl.POINTS, 0, particleCount);

			if (!reducedMotion) {
				rafId = requestAnimationFrame(render);
			}
		};

		rafId = requestAnimationFrame(render);

		return () => {
			cancelAnimationFrame(rafId);
			ro.disconnect();
			document.removeEventListener("visibilitychange", onVisibilityChange);
			canvas.removeEventListener("mousemove", onMove);
			canvas.removeEventListener("mouseleave", onLeave);
			canvas.removeEventListener("touchmove", onTouch);
			canvas.removeEventListener("touchend", onTouchEnd);
			gl.deleteBuffer(posBuf);
			gl.deleteBuffer(seedBuf);
			gl.deleteBuffer(alphaBuf);
			gl.deleteProgram(prog);
		};
	}, [particleCount]);

	return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" style={{ display: "block" }} aria-hidden="true" />;
}

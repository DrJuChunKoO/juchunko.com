import { useEffect, useRef } from "react";

const VERT = `
attribute vec2 a_position;
attribute float a_seed;
attribute float a_alpha;
attribute float a_angle;
attribute float a_capture;

uniform float u_aspect;
uniform float u_dpr;

varying float v_seed;
varying float v_alpha;
varying float v_angle;
varying float v_capture;

void main() {
  v_seed = a_seed;
  v_alpha = a_alpha;
  v_angle = a_angle;
  v_capture = a_capture;
  gl_Position = vec4(a_position.x / u_aspect, a_position.y, 0.0, 1.0);
  float size = 2.2 + v_seed * 2.0 + a_capture * 10.5;
  gl_PointSize = clamp(size * u_dpr, 1.8 * u_dpr, 14.5 * u_dpr);
}
`;

const FRAG = `
precision mediump float;

uniform float u_time;
uniform float u_dark;

varying float v_seed;
varying float v_alpha;
varying float v_angle;
varying float v_capture;

void main() {
  vec2 coord = vec2(gl_PointCoord.x - 0.5, 0.5 - gl_PointCoord.y);
  float radius = length(coord);
  float circle = 1.0 - smoothstep(0.22, 0.5, radius);

  float cosine = cos(v_angle);
  float sine = sin(v_angle);
  vec2 local = vec2(coord.x * cosine + coord.y * sine, -coord.x * sine + coord.y * cosine);
  float body = 1.0 - smoothstep(0.17, 0.25, length(local - vec2(-0.2, 0.0)));
  float coneProgress = smoothstep(-0.18, 0.48, local.x);
  float coneWidth = mix(0.18, 0.012, coneProgress);
  float coneAxis = smoothstep(-0.34, -0.18, local.x) * (1.0 - smoothstep(0.46, 0.5, local.x));
  float cone = coneAxis * (1.0 - smoothstep(coneWidth * 0.62, coneWidth, abs(local.y)));
  float droplet = max(body, cone);
  float edge = mix(circle, droplet, smoothstep(0.08, 0.42, v_capture));
  if (edge <= 0.0) discard;
  float pulse = 0.92 + sin(u_time * (0.5 + v_seed * 0.8) + v_seed * 12.0) * 0.08;
  float lightGray = 0.10 + v_seed * 0.40;
  float darkGray = 0.62 + v_seed * 0.38;
  float gray = mix(lightGray, darkGray, u_dark);

  gl_FragColor = vec4(vec3(gray), v_alpha * pulse * edge);
}
`;

interface Particle {
	ox: number;
	oy: number;
	x: number;
	y: number;
	vx: number;
	vy: number;
	targetX: number;
	targetY: number;
	wanderTimer: number;
	wanderRadius: number;
	seed: number;
	baseAlpha: number;
	opacity: number;
	captureOpacity: number;
	captureProgress: number;
	introDelay: number;
	state: "idle" | "captured" | "recovering" | "respawning";
}

const FIELD_RADIUS = 0.97;
const INFLUENCE_RADIUS = 0.36;
const RELEASE_RADIUS = 0.43;

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
	const shader = gl.createShader(type)!;
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const message = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error("Shader: " + message);
	}
	return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram {
	const program = gl.createProgram()!;
	const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
	const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const message = gl.getProgramInfoLog(program);
		gl.deleteProgram(program);
		throw new Error("Program: " + message);
	}
	gl.deleteShader(vertexShader);
	gl.deleteShader(fragmentShader);
	return program;
}

function makeParticle(): Particle {
	const seed = Math.random();
	const radius = Math.sqrt(Math.random()) * FIELD_RADIUS;
	const angle = Math.random() * Math.PI * 2;
	const x = Math.cos(angle) * radius;
	const y = Math.sin(angle) * radius;

	return {
		ox: x,
		oy: y,
		x,
		y,
		vx: 0,
		vy: 0,
		targetX: x,
		targetY: y,
		wanderTimer: Math.random() * 1.5,
		wanderRadius: Math.min(0.055, Math.max(0.01, FIELD_RADIUS - radius)),
		seed,
		baseAlpha: 0.34 + Math.random() * 0.46,
		opacity: 1,
		captureOpacity: 1,
		captureProgress: 0,
		introDelay: Math.random() * 0.9,
		state: "idle",
	};
}

function setWanderTarget(particle: Particle) {
	const radius = Math.sqrt(Math.random()) * particle.wanderRadius;
	const angle = Math.random() * Math.PI * 2;
	let targetX = particle.ox + Math.cos(angle) * radius;
	let targetY = particle.oy + Math.sin(angle) * radius;
	const distanceFromCenter = Math.hypot(targetX, targetY);

	if (distanceFromCenter > FIELD_RADIUS) {
		targetX = (targetX / distanceFromCenter) * FIELD_RADIUS;
		targetY = (targetY / distanceFromCenter) * FIELD_RADIUS;
	}

	particle.targetX = targetX;
	particle.targetY = targetY;
	particle.wanderTimer = 1.4 + Math.random() * 2.2;
}

function regenerateParticle(particle: Particle) {
	particle.x = particle.ox;
	particle.y = particle.oy;
	particle.vx = 0;
	particle.vy = 0;
	particle.opacity = 0;
	particle.captureProgress = 0;
	particle.state = "respawning";
	setWanderTarget(particle);
}

function captureParticle(particle: Particle) {
	particle.captureOpacity = particle.opacity;
	particle.captureProgress = 0;
	particle.vx = 0;
	particle.vy = 0;
	particle.state = "captured";
}

function smoothstep(min: number, max: number, value: number) {
	const progress = Math.min(1, Math.max(0, (value - min) / (max - min)));
	return progress * progress * (3 - 2 * progress);
}

export default function ParticleOrb({ particleCount = 620 }: { particleCount?: number }) {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
		if (!gl) return;

		let program: WebGLProgram;
		try {
			program = createProgram(gl, VERT, FRAG);
		} catch (error) {
			console.error("ParticleOrb:", error);
			return;
		}
		gl.useProgram(program);

		const positionAttribute = gl.getAttribLocation(program, "a_position");
		const seedAttribute = gl.getAttribLocation(program, "a_seed");
		const alphaAttribute = gl.getAttribLocation(program, "a_alpha");
		const angleAttribute = gl.getAttribLocation(program, "a_angle");
		const captureAttribute = gl.getAttribLocation(program, "a_capture");
		const timeUniform = gl.getUniformLocation(program, "u_time");
		const aspectUniform = gl.getUniformLocation(program, "u_aspect");
		const dprUniform = gl.getUniformLocation(program, "u_dpr");
		const darkUniform = gl.getUniformLocation(program, "u_dark");

		const positionBuffer = gl.createBuffer()!;
		const seedBuffer = gl.createBuffer()!;
		const alphaBuffer = gl.createBuffer()!;
		const angleBuffer = gl.createBuffer()!;
		const captureBuffer = gl.createBuffer()!;
		const positionData = new Float32Array(particleCount * 2);
		const seedData = new Float32Array(particleCount);
		const alphaData = new Float32Array(particleCount);
		const angleData = new Float32Array(particleCount);
		const captureData = new Float32Array(particleCount);
		const particles = Array.from({ length: particleCount }, makeParticle);
		for (const particle of particles) setWanderTarget(particle);

		gl.enable(gl.BLEND);
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
		gl.clearColor(0, 0, 0, 0);

		let aspect = 1;
		let dpr = 1;
		let renderStatic = () => {};
		const resize = () => {
			const rect = canvas.getBoundingClientRect();
			if (rect.width === 0 || rect.height === 0) return;
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.round(rect.width * dpr);
			canvas.height = Math.round(rect.height * dpr);
			aspect = rect.width / rect.height;
			gl.viewport(0, 0, canvas.width, canvas.height);
			renderStatic();
		};
		resize();
		const resizeObserver = new ResizeObserver(resize);
		resizeObserver.observe(canvas);

		let pointerX = 0;
		let pointerY = 0;
		let pointerActive = false;
		const updatePointer = (clientX: number, clientY: number) => {
			const rect = canvas.getBoundingClientRect();
			pointerX = (((clientX - rect.left) / rect.width) * 2 - 1) * aspect;
			pointerY = -(((clientY - rect.top) / rect.height) * 2 - 1);
		};
		const onPointerMove = (event: PointerEvent) => {
			updatePointer(event.clientX, event.clientY);
			pointerActive = true;
		};
		const onPointerLeave = () => {
			pointerActive = false;
		};
		canvas.addEventListener("pointermove", onPointerMove);
		canvas.addEventListener("pointerleave", onPointerLeave);

		let dark = document.documentElement.classList.contains("dark") ? 1 : 0;
		const themeObserver = new MutationObserver(() => {
			dark = document.documentElement.classList.contains("dark") ? 1 : 0;
			if (reducedMotion) renderStatic();
		});
		themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

		let rafId = 0;
		const startedAt = performance.now();
		let lastNow = startedAt;
		const render = (now: number, animate: boolean) => {
			const elapsed = (now - startedAt) / 1000;
			const dt = animate ? Math.min((now - lastNow) / 1000, 0.05) : 0;
			lastNow = now;

			for (let i = 0; i < particles.length; i++) {
				const particle = particles[i];
				if (particle.state === "idle") {
					if (animate) {
						particle.wanderTimer -= dt;
						if (particle.wanderTimer <= 0) setWanderTarget(particle);

						particle.vx += (particle.targetX - particle.x) * 12 * dt;
						particle.vy += (particle.targetY - particle.y) * 12 * dt;
						const damping = Math.exp(-dt * 3.8);
						particle.vx *= damping;
						particle.vy *= damping;
						particle.x += particle.vx * dt;
						particle.y += particle.vy * dt;
					}

					if (pointerActive && Math.hypot(pointerX - particle.ox, pointerY - particle.oy) < INFLUENCE_RADIUS) {
						captureParticle(particle);
					}
				} else if (particle.state === "captured" && animate) {
					const originDistance = Math.hypot(pointerX - particle.ox, pointerY - particle.oy);
					if (!pointerActive || originDistance > RELEASE_RADIUS) {
						const pointerDistance = Math.hypot(pointerX - particle.x, pointerY - particle.y);
						particle.opacity *= smoothstep(0.018, INFLUENCE_RADIUS * 0.82, pointerDistance);
						particle.state = "recovering";
					} else {
						const proximity = Math.max(0, 1 - originDistance / INFLUENCE_RADIUS);
						const captureRate = 0.65 + proximity * 1.5 + particle.seed * 0.2;
						particle.captureProgress = Math.min(1, particle.captureProgress + dt * (captureRate + particle.captureProgress ** 2 * 5));
						const gravityCurve = particle.captureProgress ** 3;
						const pull = 1 - Math.exp(-dt * (2.5 + gravityCurve * 24));
						particle.x += (pointerX - particle.x) * pull;
						particle.y += (pointerY - particle.y) * pull;
						particle.opacity = particle.captureOpacity * (1 - smoothstep(0.08, 1, particle.captureProgress));

						if (particle.captureProgress >= 1) regenerateParticle(particle);
					}
				} else if (particle.state === "recovering" && animate) {
					particle.opacity = Math.max(0, particle.opacity - dt * 7);
					if (particle.opacity <= 0) regenerateParticle(particle);
				} else if (particle.state === "respawning" && animate) {
					const originDistance = Math.hypot(pointerX - particle.ox, pointerY - particle.oy);
					const proximity = pointerActive ? Math.max(0, 1 - originDistance / INFLUENCE_RADIUS) : 0;
					const respawnRate = 5.5 + proximity * 7.5 + particle.seed * 1.4;
					particle.opacity = Math.min(1, particle.opacity + dt * respawnRate);
					if (particle.opacity >= 1) {
						if (pointerActive && originDistance < INFLUENCE_RADIUS) {
							captureParticle(particle);
						} else {
							particle.state = "idle";
						}
					}
				}

				positionData[i * 2] = particle.x;
				positionData[i * 2 + 1] = particle.y;
				seedData[i] = particle.seed;
				const introAlpha = reducedMotion ? 1 : Math.min(1, Math.max(0, (elapsed - particle.introDelay) / 0.55));
				const distorted = particle.state === "captured";
				const pointerDistance = Math.hypot(pointerX - particle.x, pointerY - particle.y);
				const maskedByPointer = distorted || (pointerActive && particle.state === "respawning");
				const distanceAlpha = maskedByPointer ? smoothstep(0.018, INFLUENCE_RADIUS * 0.82, pointerDistance) : 1;
				alphaData[i] = particle.baseAlpha * particle.opacity * introAlpha * distanceAlpha;
				angleData[i] = distorted ? Math.atan2(pointerY - particle.y, pointerX - particle.x) : 0;
				captureData[i] = distorted ? 0.32 + particle.captureProgress * 0.68 : 0;
			}

			gl.clear(gl.COLOR_BUFFER_BIT);
			gl.useProgram(program);

			gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, positionData, gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(positionAttribute);
			gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, seedBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, seedData, gl.STATIC_DRAW);
			gl.enableVertexAttribArray(seedAttribute);
			gl.vertexAttribPointer(seedAttribute, 1, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, alphaData, gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(alphaAttribute);
			gl.vertexAttribPointer(alphaAttribute, 1, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, angleBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, angleData, gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(angleAttribute);
			gl.vertexAttribPointer(angleAttribute, 1, gl.FLOAT, false, 0, 0);

			gl.bindBuffer(gl.ARRAY_BUFFER, captureBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, captureData, gl.DYNAMIC_DRAW);
			gl.enableVertexAttribArray(captureAttribute);
			gl.vertexAttribPointer(captureAttribute, 1, gl.FLOAT, false, 0, 0);

			gl.uniform1f(timeUniform, reducedMotion ? 0 : elapsed);
			gl.uniform1f(aspectUniform, aspect);
			gl.uniform1f(dprUniform, dpr);
			gl.uniform1f(darkUniform, dark);
			gl.drawArrays(gl.POINTS, 0, particleCount);

			if (animate) rafId = requestAnimationFrame((nextNow) => render(nextNow, true));
		};

		renderStatic = () => render(performance.now(), false);
		if (reducedMotion) {
			renderStatic();
		} else {
			rafId = requestAnimationFrame((now) => render(now, true));
		}

		return () => {
			cancelAnimationFrame(rafId);
			resizeObserver.disconnect();
			themeObserver.disconnect();
			canvas.removeEventListener("pointermove", onPointerMove);
			canvas.removeEventListener("pointerleave", onPointerLeave);
			gl.deleteBuffer(positionBuffer);
			gl.deleteBuffer(seedBuffer);
			gl.deleteBuffer(alphaBuffer);
			gl.deleteBuffer(angleBuffer);
			gl.deleteBuffer(captureBuffer);
			gl.deleteProgram(program);
		};
	}, [particleCount]);

	return <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full touch-pan-y" aria-hidden="true" />;
}

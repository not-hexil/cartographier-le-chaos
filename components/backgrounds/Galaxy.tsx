'use client';

import { useEffect, useRef, type HTMLAttributes } from 'react';

export type GalaxyDirection = 'forward' | 'backward';

export interface GalaxyProps extends HTMLAttributes<HTMLDivElement> {
  focal?: [number, number];
  rotation?: [number, number];
  starSpeed?: number;
  density?: number;
  hueShift?: number;
  disableAnimation?: boolean;
  speed?: number;
  mouseInteraction?: boolean;
  glowIntensity?: number;
  saturation?: number;
  mouseRepulsion?: boolean;
  repulsionStrength?: number;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  autoCenterRepulsion?: number;
  transparent?: boolean;
  lightMode?: boolean;
  starColors?: string[];
  starSize?: number;
  flareIntensity?: number;
  layers?: number;
  direction?: GalaxyDirection;
  clickWarp?: boolean;
  intro?: boolean;
  backgroundColor?: string;
  opacity?: number;
  dpr?: number;
}

const MAX_LAYERS = 8;
const MAX_COLORS = 4;
const INTRO_SECONDS = 2.2;
const DEFAULT_STAR_COLORS = ['#F3EFF9', '#C4B2E0', '#A855F7', '#896ABD'];

const VERTEX = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp int;
uniform float uTime;
uniform vec2 uResolution;
uniform vec2 uFocal;
uniform vec2 uRotation;
uniform float uGloss;
uniform float uDepth;
uniform float uDensity;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uStarGlow;
uniform float uFlareGain;
uniform float uSquash;
uniform float uSaturation;
uniform float uMouseRepulsion;
uniform float uTwinkleIntensity;
uniform float uRotationAngle;
uniform float uRepulsionStrength;
uniform float uMouseActiveFactor;
uniform float uAutoCenterRepulsion;
uniform int uLayers;
uniform vec3 uColors[${MAX_COLORS}];
uniform int uColorCount;
uniform float uWarp;
uniform float uReveal;
uniform float uMode;
uniform vec3 uBackground;
uniform float uOpacity;
out vec4 outColor;

#define STAR_COLOR_CUTOFF 0.2
#define MAT45 mat2(0.7071, -0.7071, 0.7071, 0.7071)
#define PERIOD 3.0

float Hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float tri(float x) {
  return abs(fract(x) * 2.0 - 1.0);
}

float tris(float x) {
  float t = fract(x);
  return 1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0));
}

float trisn(float x) {
  float t = fract(x);
  return 2.0 * (1.0 - smoothstep(0.0, 1.0, abs(2.0 * t - 1.0))) - 1.0;
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float Star(vec2 uv, float flare, vec2 radial, float invReach) {
  float d;
  if (uWarp > 0.001) {
    float along = dot(uv, radial);
    d = sqrt(max(dot(uv, uv) - uSquash * along * along, 0.0));
  } else {
    d = length(uv);
  }
  float m = uStarGlow / max(d, 0.0001);
  float rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * flare * uFlareGain;
  uv *= MAT45;
  rays = smoothstep(0.0, 1.0, 1.0 - abs(uv.x * uv.y * 1000.0));
  m += rays * 0.3 * flare * uFlareGain;
  m *= smoothstep(1.0, 0.2, d * invReach);
  if (uWarp > 0.001) {
    m *= mix(1.0, smoothstep(1.0, 0.55, length(uv) * invReach), min(uWarp * 4.0, 1.0));
  }
  return m;
}

vec3 StarLayer(vec2 uv, vec2 radial, vec2 repelAt, float pushCells, float spread) {
  vec3 col = vec3(0.0);
  vec2 gv = fract(uv) - 0.5;
  vec2 id = floor(uv);
  for (int y = -1; y <= 1; y++) {
    for (int x = -1; x <= 1; x++) {
      vec2 offset = vec2(float(x), float(y));
      vec2 si = id + offset;
      float seed = Hash21(si);
      float size = fract(seed * 345.32);
      float glossLocal = tri(uGloss / (PERIOD * seed + 1.0));
      float flareSize = smoothstep(0.9, 1.0, size) * glossLocal;

      vec3 base;
      if (uColorCount > 0) {
        int idx = int(min(floor(Hash21(si + 7.0) * float(uColorCount)), float(uColorCount - 1)));
        base = uColors[idx];
      } else {
        float red = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 1.0)) + STAR_COLOR_CUTOFF;
        float blu = smoothstep(STAR_COLOR_CUTOFF, 1.0, Hash21(si + 3.0)) + STAR_COLOR_CUTOFF;
        float grn = min(red, blu) * seed;
        base = vec3(red, grn, blu);
      }

      vec2 pad = vec2(tris(seed * 34.0 + uTime * uSpeed / 10.0), tris(seed * 38.0 + uTime * uSpeed / 30.0)) - 0.5;
      vec2 shift = vec2(0.0);
      float invReach = 1.0;
      if (pushCells > 0.0) {
        vec2 away = si + 0.5 + pad - repelAt;
        float dist = length(away);
        float q = dist * spread;
        float cells = pushCells * exp(-q * q);
        float moved = cells * inversesqrt(1.0 + cells * cells * 2.78);
        shift = away * (moved / max(dist, 0.0001));
        invReach = 1.0 / max(1.0 - moved, 0.1);
      }

      float star = Star(gv - offset - pad - shift, flareSize, radial, invReach);
      float twinkle = trisn(uTime * uSpeed + seed * 6.2831) * 0.5 + 1.0;
      twinkle = mix(1.0, twinkle, uTwinkleIntensity);
      col += star * twinkle * size * base;
    }
  }
  return col;
}

void main() {
  vec2 focalPx = uFocal * uResolution;
  vec2 uv = (gl_FragCoord.xy - focalPx) / max(uResolution.y, 1.0);
  vec2 mouseNorm = uMouse - vec2(0.5);

  vec2 repelAt = vec2(0.0);
  float strength = 0.0;
  float push = 0.0;
  if (uAutoCenterRepulsion > 0.0) {
    strength = uAutoCenterRepulsion;
    push = strength * 0.05;
  } else if (uMouseRepulsion > 0.5) {
    repelAt = (uMouse * uResolution - focalPx) / max(uResolution.y, 1.0);
    strength = max(uRepulsionStrength, 0.0);
    push = strength * 0.05 * uMouseActiveFactor;
  } else {
    uv += mouseNorm * 0.1 * uMouseActiveFactor;
  }
  float radius = 0.16 + 0.04 * strength;

  vec2 radial = length(uv) > 0.0001 ? normalize(uv) : vec2(1.0, 0.0);
  float angle = uRotationAngle;
  mat2 rotA = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  mat2 rotB = mat2(uRotation.x, -uRotation.y, uRotation.y, uRotation.x);
  uv = rotB * (rotA * uv);
  radial = rotB * (rotA * radial);
  repelAt = rotB * (rotA * repelAt);

  vec3 col = vec3(0.0);
  float layers = float(uLayers);
  for (int k = 0; k < ${MAX_LAYERS}; k++) {
    if (k >= uLayers) break;
    float i = float(k) / layers;
    float depth = fract(i + uDepth);
    float scale = mix(20.0 * uDensity, 0.5 * uDensity, depth);
    float fade = depth * smoothstep(1.0, 0.9, depth);
    vec2 offset = vec2(i * 453.32);
    col += StarLayer(uv * scale + offset, radial, repelAt * scale + offset, push * scale, 1.0 / (scale * radius)) * fade;
  }

  col *= uReveal;
  outColor = vec4(uBackground + col * uOpacity, 1.0);
}`;

const hexToRgb = (hex: string): [number, number, number] => {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map(c => c + c).join('') : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [1, 1, 1];
  return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
};

export default function Galaxy({
  focal = [0.5, 0.5],
  rotation = [1.0, 0.0],
  starSpeed = 0.5,
  density = 1,
  hueShift = 140,
  disableAnimation = false,
  speed = 1.0,
  mouseInteraction = true,
  glowIntensity = 0.35,
  saturation = 0.0,
  mouseRepulsion = true,
  repulsionStrength = 2,
  twinkleIntensity = 0.35,
  rotationSpeed = 0.1,
  autoCenterRepulsion = 0,
  transparent = false,
  lightMode = false,
  intro = true,
  starColors = DEFAULT_STAR_COLORS,
  starSize = 1,
  flareIntensity = 1,
  layers = 4,
  direction = 'forward',
  clickWarp = true,
  backgroundColor = '#07060B',
  opacity = 1,
  dpr,
  className = '',
  style,
  ...rest
}: GalaxyProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const currentProps = {
    focal,
    rotation,
    starSpeed,
    density,
    hueShift,
    disableAnimation,
    speed,
    mouseInteraction,
    glowIntensity,
    saturation,
    mouseRepulsion,
    repulsionStrength,
    twinkleIntensity,
    rotationSpeed,
    autoCenterRepulsion,
    transparent,
    lightMode,
    intro,
    starColors,
    starSize,
    flareIntensity,
    layers,
    direction,
    clickWarp,
    backgroundColor,
    opacity,
    dpr
  };

  const propsRef = useRef(currentProps);

  useEffect(() => {
    propsRef.current = currentProps;
  });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
    if (!gl) {
      console.error('[Galaxy] WebGL2 context unavailable');
      return;
    }

    const compileShader = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error('[Galaxy] Shader compile error:', gl.getShaderInfoLog(sh));
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return;

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[Galaxy] Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < count; i++) {
      const info = gl.getActiveUniform(program, i);
      if (info) uniforms[info.name.replace('[0]', '')] = gl.getUniformLocation(program, info.name);
    }

    const buffer = gl.createBuffer();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const pointer = { x: 0.5, y: 0.5, inside: false };
    const state = {
      time: 0,
      gloss: 0,
      depth: 0,
      angle: 0,
      mx: 0.5,
      my: 0.5,
      active: 0,
      boost: 0,
      reveal: propsRef.current.intro ? 0 : 1
    };
    let raf = 0;
    let last = 0;

    const resize = () => {
      const ratio = Math.min(propsRef.current.dpr || window.devicePixelRatio || 1, 2);
      const w = Math.max(1, container.clientWidth || window.innerWidth);
      const h = Math.max(1, container.clientHeight || window.innerHeight);
      canvas.width = Math.round(w * ratio);
      canvas.height = Math.round(h * ratio);
    };

    const render = (now: number) => {
      const p = propsRef.current;
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;

      if (p.intro && state.reveal < 1) {
        state.reveal = Math.min(1, state.reveal + dt / INTRO_SECONDS);
        state.boost = Math.max(state.boost, Math.pow(1 - state.reveal, 2) * 1.4);
      } else if (!p.intro) {
        state.reveal = 1;
      }

      if (!p.disableAnimation) {
        const flight = (p.starSpeed / 10) * (p.direction === 'backward' ? -1 : 1);
        state.time += dt;
        state.gloss += dt * flight;
        state.depth += dt * flight * p.speed * (1 + state.boost * 14);
        state.angle += dt * p.rotationSpeed;
      }
      state.boost *= Math.exp(-dt * 1.3);
      if (state.boost < 0.001) state.boost = 0;

      const follow = 1 - Math.exp(-dt / 0.325);
      const engaged = p.mouseInteraction && pointer.inside;
      if (engaged) {
        state.mx += (pointer.x - state.mx) * follow;
        state.my += (pointer.y - state.my) * follow;
      }
      state.active += ((engaged ? 1 : 0) - state.active) * follow;

      const palette = (p.starColors || []).slice(0, MAX_COLORS);
      const colorBuf = new Float32Array(MAX_COLORS * 3);
      palette.forEach((hex, idx) => colorBuf.set(hexToRgb(hex), idx * 3));

      const fade = Math.min(1, state.reveal / 0.35);
      const smoothReveal = fade * fade * (3 - 2 * fade);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.bindVertexArray(vao);
      gl.uniform1f(uniforms.uTime, state.time);
      gl.uniform2f(uniforms.uResolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.uFocal, p.focal[0], p.focal[1]);
      gl.uniform2f(uniforms.uRotation, p.rotation[0], p.rotation[1]);
      gl.uniform1f(uniforms.uGloss, state.gloss);
      gl.uniform1f(uniforms.uDepth, state.depth);
      gl.uniform1f(uniforms.uDensity, p.density);
      gl.uniform1f(uniforms.uHueShift, p.hueShift);
      gl.uniform1f(uniforms.uSpeed, p.speed);
      gl.uniform2f(uniforms.uMouse, state.mx, state.my);
      const stretch = 1 + state.boost * 5;
      gl.uniform1f(uniforms.uStarGlow, (0.05 * p.glowIntensity * p.starSize) / Math.pow(stretch, 0.6));
      gl.uniform1f(uniforms.uFlareGain, p.glowIntensity * p.flareIntensity);
      gl.uniform1f(uniforms.uSquash, 1 - 1 / (stretch * stretch));
      gl.uniform1f(uniforms.uSaturation, p.saturation);
      gl.uniform1f(uniforms.uMouseRepulsion, p.mouseRepulsion ? 1 : 0);
      gl.uniform1f(uniforms.uTwinkleIntensity, p.twinkleIntensity);
      gl.uniform1f(uniforms.uRotationAngle, state.angle);
      gl.uniform1f(uniforms.uRepulsionStrength, p.repulsionStrength);
      gl.uniform1f(uniforms.uMouseActiveFactor, state.active);
      gl.uniform1f(uniforms.uAutoCenterRepulsion, p.autoCenterRepulsion);
      gl.uniform1i(uniforms.uLayers, Math.min(MAX_LAYERS, Math.max(2, Math.round(p.layers))));
      gl.uniform3fv(uniforms.uColors, colorBuf);
      gl.uniform1i(uniforms.uColorCount, palette.length);
      gl.uniform1f(uniforms.uWarp, state.boost);
      gl.uniform1f(uniforms.uReveal, smoothReveal);
      gl.uniform1f(uniforms.uMode, 0);
      gl.uniform3fv(uniforms.uBackground, hexToRgb(p.backgroundColor || '#07060B'));
      gl.uniform1f(uniforms.uOpacity, p.opacity);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      raf = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      const rect = container.getBoundingClientRect();
      pointer.inside = e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom;
      pointer.x = (e.clientX - rect.left) / Math.max(1, rect.width);
      pointer.y = 1 - (e.clientY - rect.top) / Math.max(1, rect.height);
    };
    const onDown = () => {
      if (pointer.inside && propsRef.current.clickWarp) state.boost = Math.min(1.6, state.boost + 1);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onDown, { passive: true });
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
      gl.deleteVertexArray(vao);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={['relative h-full w-full overflow-hidden', className].filter(Boolean).join(' ')}
      style={{ backgroundColor, ...style }}
      {...rest}
    >
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" aria-hidden="true" />
    </div>
  );
}

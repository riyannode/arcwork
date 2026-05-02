'use client';

import { useEffect, useRef } from 'react';

export default function WebGLBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animId: number;
    let mouseX = 0, mouseY = 0;
    let time = 0;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: false });
    if (!gl) return;

    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Enhanced fragment shader — grid lines + aurora + particle dots
    const fsSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform vec2 u_mouse;

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float v = 0.0;
        float a = 0.5;
        for (int i = 0; i < 4; i++) {
          v += a * noise(p);
          p *= 2.0;
          a *= 0.5;
        }
        return v;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 mouse = u_mouse / u_resolution;
        float aspect = u_resolution.x / u_resolution.y;

        // ─── Grid lines ───
        float gridSize = 50.0;
        vec2 gridUv = fract(uv * gridSize);
        float gridLine = smoothstep(0.02, 0.0, gridUv.x) + smoothstep(0.02, 0.0, gridUv.y);
        gridLine *= 0.03;

        // ─── Dot matrix ───
        float dotGrid = 25.0;
        vec2 dotUv = fract(uv * dotGrid) - 0.5;
        float dotDist = length(dotUv);
        float pulse = 0.5 + 0.5 * sin(u_time * 0.4 + noise(floor(uv * dotGrid) * 0.1) * 6.28);
        float mouseInfluence = 1.0 - smoothstep(0.0, 0.35, length(floor(uv * dotGrid) / dotGrid - mouse));
        pulse += mouseInfluence * 0.4;
        float dotRadius = 0.06 + pulse * 0.03;
        float dot = 1.0 - smoothstep(dotRadius - 0.02, dotRadius + 0.02, dotDist);

        // ─── Aurora / gradient waves ───
        float aurora1 = fbm(vec2(uv.x * 2.0 + u_time * 0.05, uv.y * 1.5));
        float aurora2 = fbm(vec2(uv.x * 1.8 - u_time * 0.03, uv.y * 2.0 + 0.5));
        float auroraMask = smoothstep(0.3, 0.7, uv.y) * smoothstep(1.0, 0.6, uv.y);
        vec3 auroraColor = mix(
          vec3(0.0, 0.6, 1.0),
          vec3(0.0, 0.94, 0.53),
          aurora1
        ) * auroraMask * 0.04;

        // ─── Combine colors ───
        // Base dot color — dark green tint
        vec3 dotColor = vec3(0.0, 0.12, 0.06) * dot * (0.3 + pulse * 0.7);
        // Cyan accent near mouse
        dotColor += vec3(0.0, 0.6, 0.64) * dot * mouseInfluence * 0.2;
        // Grid lines — very subtle
        vec3 gridColor = vec3(0.0, 0.3, 0.35) * gridLine;

        vec3 color = dotColor + gridColor + auroraColor;

        // ─── Vignette ───
        float vignette = 1.0 - smoothstep(0.3, 1.3, length(uv - 0.5));
        color *= vignette;

        // ─── Subtle gradient from top ───
        color += vec3(0.0, 0.02, 0.04) * (1.0 - uv.y) * 0.5;

        float alpha = length(color) * 1.8;
        gl_FragColor = vec4(color, alpha);
      }
    `;

    function createShader(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      return shader;
    }

    const vs = createShader(gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl.FRAGMENT_SHADER, fsSource);

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(program, 'u_time');
    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uMouse = gl.getUniformLocation(program, 'u_mouse');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      canvas!.style.width = window.innerWidth + 'px';
      canvas!.style.height = window.innerHeight + 'px';
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    function onMouseMove(e: MouseEvent) {
      const dpr = Math.min(window.devicePixelRatio, 2);
      mouseX = e.clientX * dpr;
      mouseY = (window.innerHeight - e.clientY) * dpr;
    }
    window.addEventListener('mousemove', onMouseMove);

    function render() {
      time += 0.016;
      gl!.enable(gl!.BLEND);
      gl!.blendFunc(gl!.SRC_ALPHA, gl!.ONE_MINUS_SRC_ALPHA);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uTime, time);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.uniform2f(uMouse, mouseX, mouseY);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    }
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#000510' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
      {/* CSS gradient orbs on top of WebGL */}
      <div 
        className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-30"
        style={{ 
          background: 'radial-gradient(circle, rgba(0,240,255,0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 8s ease-in-out infinite'
        }}
      />
      <div 
        className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-20"
        style={{ 
          background: 'radial-gradient(circle, rgba(10,69,255,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'float 10s ease-in-out infinite reverse'
        }}
      />
    </div>
  );
}

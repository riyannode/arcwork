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

    // Vertex shader
    const vsSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Fragment shader — dot-matrix particle field with breathing pulse
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

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        vec2 mouse = u_mouse / u_resolution;

        // Grid spacing for dot matrix
        float gridSize = 40.0;
        vec2 grid = floor(uv * gridSize);
        vec2 gridUv = fract(uv * gridSize) - 0.5;

        // Distance from center of each grid cell
        float dist = length(gridUv);

        // Breathing pulse
        float pulse = 0.5 + 0.5 * sin(u_time * 0.3 + noise(grid * 0.1) * 6.28);

        // Mouse influence — subtle drift
        float mouseInfluence = 1.0 - smoothstep(0.0, 0.4, length(grid / gridSize - mouse));
        pulse += mouseInfluence * 0.3;

        // Dot visibility
        float dotRadius = 0.08 + pulse * 0.04;
        float dot = 1.0 - smoothstep(dotRadius - 0.02, dotRadius + 0.02, dist);

        // Color: greenish-cyan tint
        vec3 color = vec3(0.0, 0.08, 0.04) * dot * (0.3 + pulse * 0.7);
        // Add subtle cyan accent near mouse
        color += vec3(0.0, 0.6, 0.64) * dot * mouseInfluence * 0.15;

        // Depth fade from edges
        float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
        color *= vignette;

        // Alpha for compositing
        float alpha = length(color) * 1.5;

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

    // Full-screen quad
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
      mouseY = (window.innerHeight - e.clientY) * dpr; // Flip Y for GL
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
    <div className="fixed inset-0 z-0 pointer-events-none" style={{ background: '#010A04' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      />
    </div>
  );
}

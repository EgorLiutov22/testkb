import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { ArrowRight, Layers3, RadioTower, Sparkles, UserRound } from "lucide-react";
import "./styles.css";

const vertexShaderSource = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;

float ray(vec2 uv, float angle, float width) {
  vec2 dir = vec2(cos(angle), sin(angle));
  vec2 fromTop = uv - vec2(0.5, 1.07);
  float d = abs(dot(normalize(fromTop), vec2(-dir.y, dir.x)));
  float along = max(dot(normalize(fromTop), dir), 0.0);
  return smoothstep(width, 0.0, d) * pow(along, 1.7);
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution.xy;
  uv.x *= u_resolution.x / u_resolution.y;
  vec2 centered = uv - vec2(0.5 * u_resolution.x / u_resolution.y, 0.5);

  float vignette = 1.0 - smoothstep(0.15, 1.04, length(centered));
  float glow = exp(-3.2 * length(centered - vec2(0.0, 0.18)));

  float r1 = ray(vec2(gl_FragCoord.xy / u_resolution.xy), -1.35 + sin(u_time * 0.22) * 0.04, 0.075);
  float r2 = ray(vec2(gl_FragCoord.xy / u_resolution.xy), -1.75 + cos(u_time * 0.18) * 0.05, 0.095);
  float r3 = ray(vec2(gl_FragCoord.xy / u_resolution.xy), -1.15 + sin(u_time * 0.16) * 0.06, 0.12);

  vec3 lavender = vec3(0.83, 0.73, 1.0);
  vec3 orchid = vec3(0.68, 0.51, 0.94);
  vec3 rose = vec3(1.0, 0.72, 0.89);
  vec3 porcelain = vec3(0.965, 0.94, 1.0);

  vec3 color = mix(porcelain, lavender, uv.y * 0.86);
  color = mix(color, orchid, glow * 0.62);
  color += lavender * r1 * 0.42 + rose * r2 * 0.36 + orchid * r3 * 0.24;
  color += vec3(1.0, 0.95, 1.0) * vignette * 0.1;

  gl_FragColor = vec4(color, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function HeroShader() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", { antialias: true, alpha: false });
    if (!gl) return undefined;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    let frame;
    const start = performance.now();

    const render = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.floor(canvas.clientWidth * dpr);
      const height = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
      }
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, (performance.now() - start) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      frame = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(frame);
  }, []);

  return <canvas className="hero-shader" ref={canvasRef} aria-hidden="true" />;
}

function App() {
  const [username, setUsername] = useState("demo");
  const [profile, setProfile] = useState("");
  const [loading, setLoading] = useState(false);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/user/${encodeURIComponent(username || "demo")}`);
      setProfile(await response.text());
    } catch {
      setProfile("Flask API недоступен. Запустите backend на 127.0.0.1:5000.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  return (
    <main>
      <section className="hero">
        <HeroShader />
        <nav className="nav">
          <div className="brand">
            <Sparkles size={20} />
            <span>Violet API</span>
          </div>
          <a href="#api">API</a>
        </nav>

        <div className="hero-content">
          <p className="eyebrow">React + Vite interface</p>
          <h1>Одностраничный фронтенд для Flask-бэкенда</h1>
          <p className="lead">
            Чистый лендинг с живым WebGL-шейдером, адаптивной версткой и проверкой маршрута
            профиля через существующий endpoint.
          </p>
          <a className="hero-action" href="#api">
            Подключиться к API <ArrowRight size={18} />
          </a>
        </div>
      </section>

      <section className="panel" id="api">
        <div className="section-heading">
          <p className="eyebrow">Backend contract</p>
          <h2>Проверка маршрута /user/&lt;username&gt;</h2>
        </div>

        <div className="workspace">
          <div className="feature-grid">
            <article>
              <Layers3 size={24} />
              <h3>Vite setup</h3>
              <p>Готовая структура React-приложения с dev-сервером и сборкой.</p>
            </article>
            <article>
              <RadioTower size={24} />
              <h3>Proxy</h3>
              <p>Запросы `/user/*` во время разработки идут на Flask по порту 5000.</p>
            </article>
          </div>

          <form
            className="api-card"
            onSubmit={(event) => {
              event.preventDefault();
              loadProfile();
            }}
          >
            <label htmlFor="username">Username</label>
            <div className="input-row">
              <UserRound size={20} />
              <input
                id="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Введите username"
              />
              <button type="submit" disabled={loading}>
                {loading ? "..." : "GET"}
              </button>
            </div>
            <output>{profile || "Ответ API появится здесь"}</output>
          </form>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);

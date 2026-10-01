import { useEffect, useRef } from 'react';

// 모든 화면 뒤에 깔리는 밤하늘: 반짝이는 별(캔버스) + 가끔 떨어지는 별똥별 + 초승달
// window 에 'starlight:meteor' 이벤트를 보내면 별똥별이 쏟아진다.

const STAR_COLORS = ['255,246,224', '255,236,200', '214,226,255', '255,226,168'];

function makeStars(width, height) {
  const count = Math.min(240, Math.round((width * height) / 2600));
  return Array.from({ length: count }, () => {
    const big = Math.random() < 0.07;
    return {
      x: Math.random() * width,
      y: height * Math.pow(Math.random(), 1.5) * 0.9,
      r: big ? 1.2 + Math.random() * 0.8 : 0.35 + Math.random() * 0.75,
      base: big ? 0.9 : 0.3 + Math.random() * 0.55,
      speed: 0.5 + Math.random() * 1.8,
      phase: Math.random() * Math.PI * 2,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      big,
    };
  });
}

function makeGlowSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const g = canvas.getContext('2d');
  const gradient = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,248,230,1)');
  gradient.addColorStop(0.18, 'rgba(255,240,210,0.5)');
  gradient.addColorStop(1, 'rgba(255,240,210,0)');
  g.fillStyle = gradient;
  g.fillRect(0, 0, 64, 64);
  return canvas;
}

export function launchMeteors(count = 3) {
  window.dispatchEvent(new CustomEvent('starlight:meteor', { detail: { count } }));
}

export default function NightSky() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const glow = makeGlowSprite();
    let width = 0;
    let height = 0;
    let stars = [];
    let meteors = [];
    let raf = 0;
    let last = 0;
    let nextMeteor = 4 + Math.random() * 5;
    const timers = new Set();

    function draw(time) {
      ctx.clearRect(0, 0, width, height);
      for (const s of stars) {
        const twinkle = reduceMotion ? 1 : 0.55 + 0.45 * Math.sin(time * s.speed + s.phase);
        const alpha = s.base * twinkle;
        if (s.big) {
          const size = s.r * 10;
          ctx.globalAlpha = alpha * 0.85;
          ctx.drawImage(glow, s.x - size / 2, s.y - size / 2, size, size);
        }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = `rgb(${s.color})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      for (const m of meteors) {
        const p = m.life / m.ttl;
        const alpha = p < 0.2 ? p / 0.2 : 1 - (p - 0.2) / 0.8;
        const tailX = m.x - m.vx * 0.14;
        const tailY = m.y - m.vy * 0.14;
        const gradient = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(255,248,225,${alpha})`);
        gradient.addColorStop(1, 'rgba(255,248,225,0)');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(m.x, m.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();
      }
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = makeStars(width, height);
      draw(performance.now() / 1000);
    }

    function spawnMeteor() {
      const angle = ((22 + Math.random() * 18) * Math.PI) / 180;
      const speed = 480 + Math.random() * 220;
      meteors.push({
        x: width * (0.35 + Math.random() * 0.75),
        y: height * Math.random() * 0.3,
        vx: -Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        ttl: 0.9 + Math.random() * 0.5,
      });
    }

    function frame(now) {
      const t = now / 1000;
      const dt = last ? Math.min(t - last, 0.05) : 0;
      last = t;
      nextMeteor -= dt;
      if (nextMeteor <= 0) {
        spawnMeteor();
        nextMeteor = 7 + Math.random() * 10;
      }
      meteors = meteors.filter((m) => {
        m.life += dt;
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        return m.life < m.ttl;
      });
      draw(t);
      raf = requestAnimationFrame(frame);
    }

    const start = () => {
      if (reduceMotion || raf) return;
      last = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onMeteor = (event) => {
      const count = event.detail?.count ?? 3;
      for (let i = 0; i < count; i++) {
        const id = setTimeout(() => {
          timers.delete(id);
          spawnMeteor();
        }, i * 280);
        timers.add(id);
      }
    };

    resize();
    start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('starlight:meteor', onMeteor);
    return () => {
      stop();
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('starlight:meteor', onMeteor);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#050919_0%,#0c1234_36%,#1b1d50_68%,#35295f_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(80%_60%_at_50%_100%,rgba(130,86,160,0.32),transparent)]" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <svg
        viewBox="0 0 64 64"
        className="absolute right-[9%] h-12 w-12 drop-shadow-[0_0_18px_rgba(255,226,160,0.55)]"
        style={{ top: 'calc(var(--inset-top) + 150px)' }}
      >
        <path d="M44 50A22 22 0 1 1 30 10a17 17 0 1 0 14 40Z" fill="#ffe8b0" />
      </svg>
    </div>
  );
}

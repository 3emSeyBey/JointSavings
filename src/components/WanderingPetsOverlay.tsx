import { useEffect, useRef, useState } from 'react';
import whimsyPetUrl from '@/assets/whimsy-pet.gif';

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  return reduced;
}

function padBounds() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const mobile = w < 768;
  const top = mobile ? 72 : 68;
  const bottom = mobile ? 104 : 28;
  const side = 10;
  return { w, h, top, bottom, side };
}

type SpriteProps = {
  size: number;
  maxSpeed: number;
  jitter: number;
  phase: number;
};

function WanderingSprite({ size, maxSpeed, jitter, phase }: SpriteProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const facingRef = useRef(1);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const s = {
      x: 0,
      y: 0,
      vx: (Math.random() - 0.5) * 2.2,
      vy: (Math.random() - 0.5) * 2.2,
    };

    const placeRandom = () => {
      const { w, h, top, bottom, side } = padBounds();
      const maxX = Math.max(side, w - side - size);
      const maxY = Math.max(top, h - bottom - size);
      s.x = side + Math.random() * (maxX - side);
      s.y = top + Math.random() * (maxY - top);
    };

    placeRandom();

    let raf = 0;
    let last = performance.now();
    let dirTimer = 0;

    const step = (now: number) => {
      const dt = Math.min(32, now - last) / 16;
      last = now;
      const { w, h, top, bottom, side } = padBounds();
      const minX = side;
      const minY = top;
      const maxX = w - side - size;
      const maxY = h - bottom - size;

      s.vx += (Math.random() - 0.5) * jitter * dt;
      s.vy += (Math.random() - 0.5) * jitter * dt;

      dirTimer += dt;
      if (dirTimer > 180 + phase * 40) {
        dirTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        const burst = 0.35 + Math.random() * 0.65;
        s.vx += Math.cos(angle) * burst;
        s.vy += Math.sin(angle) * burst;
      }

      let sp = Math.hypot(s.vx, s.vy);
      if (sp > maxSpeed) {
        s.vx = (s.vx / sp) * maxSpeed;
        s.vy = (s.vy / sp) * maxSpeed;
      }
      if (sp < 0.25) {
        const angle = Math.random() * Math.PI * 2;
        s.vx += Math.cos(angle) * 0.5;
        s.vy += Math.sin(angle) * 0.5;
      }

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (s.x <= minX) {
        s.x = minX;
        s.vx = Math.abs(s.vx) * (0.6 + Math.random() * 0.5) + 0.2;
        s.vy += (Math.random() - 0.5) * 0.8;
      } else if (s.x >= maxX) {
        s.x = maxX;
        s.vx = -Math.abs(s.vx) * (0.6 + Math.random() * 0.5) - 0.2;
        s.vy += (Math.random() - 0.5) * 0.8;
      }
      if (s.y <= minY) {
        s.y = minY;
        s.vy = Math.abs(s.vy) * (0.6 + Math.random() * 0.5) + 0.2;
        s.vx += (Math.random() - 0.5) * 0.8;
      } else if (s.y >= maxY) {
        s.y = maxY;
        s.vy = -Math.abs(s.vy) * (0.6 + Math.random() * 0.5) - 0.2;
        s.vx += (Math.random() - 0.5) * 0.8;
      }

      if (Math.abs(s.vx) > 0.08) {
        facingRef.current = s.vx < 0 ? -1 : 1;
      }

      const face = facingRef.current;
      img.style.transform = `translate3d(${s.x}px, ${s.y}px, 0) scaleX(${face})`;

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);

    const onResize = () => {
      const { w, h, top, bottom, side } = padBounds();
      const maxX = w - side - size;
      const maxY = h - bottom - size;
      s.x = Math.min(Math.max(side, s.x), maxX);
      s.y = Math.min(Math.max(top, s.y), maxY);
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
    };
  }, [size, maxSpeed, jitter, phase]);

  return (
    <img
      ref={imgRef}
      src={whimsyPetUrl}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className="fixed left-0 top-0 opacity-55 will-change-transform"
      style={{ width: size, height: 'auto' }}
    />
  );
}

/**
 * Decorative pets above dashboard cards (z-25: below header z-30, FAB z-40, tab bar z-50).
 * Random 2D walk with bounce; respects prefers-reduced-motion.
 */
export function WanderingPetsOverlay() {
  const reduced = usePrefersReducedMotion();
  if (reduced) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[25] overflow-hidden"
      aria-hidden
    >
      <WanderingSprite size={46} maxSpeed={1.2} jitter={0.1} phase={0} />
      <WanderingSprite size={38} maxSpeed={0.95} jitter={0.085} phase={2} />
    </div>
  );
}

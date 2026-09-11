'use client';

import React, { useEffect, useRef } from 'react';
import { DirectorStyle, Beat } from '../../engine/types';

interface VisualCanvasProps {
  style: DirectorStyle;
  activeBeat: Beat | null;
  hasRain: boolean;
  hasParticles: boolean;
  ambientLight: string;
  hasImage?: boolean;
}

interface RainDrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  maxAlpha: number;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  style,
  activeBeat,
  hasRain,
  hasParticles,
  ambientLight,
  hasImage = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sweep animation state for bus/car pass
  const sweepRef = useRef<{ active: boolean; progress: number }>({ active: false, progress: 0 });
  const flashRef = useRef<{ active: boolean; opacity: number }>({ active: false, opacity: 0 });

  // Trigger sensory effects when active beat changes
  useEffect(() => {
    if (!activeBeat) return;

    if (activeBeat.sfxCue === 'bus_pass') {
      sweepRef.current = { active: true, progress: 0 };
    }

    if (activeBeat.lightingShift === 'lightning') {
      flashRef.current = { active: true, opacity: 0.95 };
    } else if (activeBeat.lightingShift === 'flicker') {
      flashRef.current = { active: true, opacity: 0.4 };
    }
  }, [activeBeat]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Initialize rain drops
    const rainCount = hasRain ? (style.id === 'cyberpunk_neon' ? 140 : 100) : 0;
    const rainDrops: RainDrop[] = [];
    for (let i = 0; i < rainCount; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 12 + Math.random() * 22,
        speed: 14 + Math.random() * 18,
        opacity: 0.15 + Math.random() * 0.35,
      });
    }

    // Initialize floating dust / neon motes
    const particleCount = hasParticles ? (style.id === 'dreamlike_ethereal' ? 60 : 35) : 0;
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const maxAlpha = 0.2 + Math.random() * 0.5;
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 1 + Math.random() * 2.5,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.2 - Math.random() * 0.5,
        alpha: Math.random() * maxAlpha,
        maxAlpha,
      });
    }

    // Render loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Ambient lighting glow (only if no storyboard image is showing)
      if (!hasImage) {
        const grad = ctx.createRadialGradient(
          width / 2,
          height * 0.45,
          width * 0.1,
          width / 2,
          height * 0.5,
          width * 0.8
        );
        grad.addColorStop(0, ambientLight);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Headlight / vehicle sweep across screen
      if (sweepRef.current.active) {
        sweepRef.current.progress += 0.014;
        const p = sweepRef.current.progress;
        if (p > 1.2) {
          sweepRef.current.active = false;
        } else {
          const sweepX = width * p;
          const sweepGrad = ctx.createRadialGradient(
            sweepX,
            height * 0.65,
            10,
            sweepX,
            height * 0.65,
            width * 0.35
          );
          sweepGrad.addColorStop(0, 'rgba(255, 235, 180, 0.35)');
          sweepGrad.addColorStop(0.5, 'rgba(255, 200, 100, 0.12)');
          sweepGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = sweepGrad;
          ctx.fillRect(0, 0, width, height);
        }
      }

      // 3. Lightning / Flicker Flash
      if (flashRef.current.active && flashRef.current.opacity > 0.01) {
        ctx.fillStyle = `rgba(240, 248, 255, ${flashRef.current.opacity})`;
        ctx.fillRect(0, 0, width, height);
        flashRef.current.opacity *= 0.88;
        if (flashRef.current.opacity <= 0.01) {
          flashRef.current.active = false;
        }
      }

      // 4. Render Rain
      if (hasRain && rainDrops.length > 0) {
        ctx.strokeStyle = style.id === 'cyberpunk_neon' ? 'rgba(6, 182, 212, 0.45)' : 'rgba(200, 220, 245, 0.3)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        for (let i = 0; i < rainDrops.length; i++) {
          const drop = rainDrops[i];
          ctx.moveTo(drop.x, drop.y);
          // Angle rain slightly to the left (wind effect)
          ctx.lineTo(drop.x - drop.length * 0.25, drop.y + drop.length);

          drop.y += drop.speed;
          drop.x -= drop.speed * 0.25;

          if (drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * (width + 100);
          }
          if (drop.x < -20) {
            drop.x = width + 20;
          }
        }
        ctx.stroke();
      }

      // 5. Render Atmospheric / Ethereal Particles
      if (hasParticles && particles.length > 0) {
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

          const color =
            style.id === 'dreamlike_ethereal'
              ? `rgba(252, 211, 77, ${p.alpha})`
              : style.id === 'cyberpunk_neon'
              ? `rgba(56, 189, 248, ${p.alpha})`
              : `rgba(220, 225, 235, ${p.alpha})`;

          ctx.fillStyle = color;
          ctx.fill();

          p.x += p.vx;
          p.y += p.vy;

          if (p.y < -10) {
            p.y = height + 10;
            p.x = Math.random() * width;
          }
          if (p.x < -10) p.x = width + 10;
          if (p.x > width + 10) p.x = -10;
        }
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [style, hasRain, hasParticles, ambientLight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
};

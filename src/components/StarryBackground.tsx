import React, { useEffect, useRef } from 'react';

const StarryBackground: React.FC<{ show: boolean }> = ({ show }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let hue = 0;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const generateStars = () => {
      const stars = [];
      for (let i = 0; i < 1000; i++) {
        stars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 1.5,
          opacity: Math.random(),
        });
      }
      return stars;
    };

    const generateDust = () => {
      const dust = [];
      for (let i = 0; i < 1000; i++) {
        dust.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: Math.random() * 2,
          hue: Math.random() * 60 + 20,
        });
      }
      return dust;
    };

    const stars = generateStars();
    const dust = generateDust();

    const drawBackground = (time: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Create a subtle radial gradient for the Milky Way effect
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      gradient.addColorStop(0, `hsla(${hue}, 100%, 5%, 0.3)`);
      gradient.addColorStop(0.4, `hsla(${hue}, 100%, 2%, 0.1)`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });

      // Draw dust/galaxy pattern
      ctx.globalAlpha = 0.1;
      dust.forEach(particle => {
        const y = particle.y + Math.cos(particle.x / canvas.width * Math.PI * 2 + time / 10000) * canvas.height / 10;
        ctx.beginPath();
        ctx.arc(particle.x, y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${particle.hue}, 50%, 50%)`;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Slowly shift hue
      hue = (hue + 0.03) % 360;

      animationFrameId = requestAnimationFrame(drawBackground);
    };

    resizeCanvas();
    drawBackground(0);

    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className={`fixed inset-0 z-[-1] transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'}`} 
    />
  );
};

export default StarryBackground;
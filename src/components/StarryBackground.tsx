import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';

const StarryBackground: React.FC<{ show: boolean, lightDisabled?: boolean }> = ({ show, lightDisabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationFrameIdRef = useRef<number>();

  const updateDimensions = useCallback(() => {
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight
    });
  }, []);

  useEffect(() => {
    updateDimensions();
    let timeoutId: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(updateDimensions, 200);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, [updateDimensions]);

  const generateStars = useCallback((width: number, height: number) => {
    const stars = [];
    for (let i = 0; i < 1000; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 1.5,
        opacity: Math.random(),
      });
    }
    return stars;
  }, []);

  const generateDust = useCallback((width: number, height: number) => {
    const dust = [];
    for (let i = 0; i < 1000; i++) {
      dust.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2,
        hue: Math.random() * 60 + 20,
      });
    }
    return dust;
  }, []);

  const stars = useMemo(() => generateStars(dimensions.width, dimensions.height), [dimensions, generateStars]);
  const dust = useMemo(() => generateDust(dimensions.width, dimensions.height), [dimensions, generateDust]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;

    let hue = 0;

    const drawBackground = (time: number) => {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, canvas.width / 2
      );
      gradient.addColorStop(0, `hsla(${hue}, 100%, 5%, 0.3)`);
      gradient.addColorStop(0.4, `hsla(${hue}, 100%, 2%, 0.1)`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.fill();
      });

      ctx.globalAlpha = 0.1;
      dust.forEach(particle => {
        const y = particle.y + Math.cos(particle.x / canvas.width * Math.PI * 2 + time / 10000) * canvas.height / 10;
        ctx.beginPath();
        ctx.arc(particle.x, y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${particle.hue}, 50%, 50%)`;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      hue = (hue + 0.03) % 360;

      animationFrameIdRef.current = requestAnimationFrame(drawBackground);
    };

    drawBackground(0);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [dimensions, stars, dust]);

  return (
    <>
        <img src='/images/background.jpg' className='w-full h-full z-[-1] fixed dark:hidden'/>

        <canvas 
        ref={canvasRef} 
        className={`fixed inset-0 z-[-1] transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'} ${lightDisabled ? '' : 'hidden dark:block'}`} 
        />
    </>
  );
};

export default StarryBackground;
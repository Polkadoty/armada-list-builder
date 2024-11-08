import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import Image from 'next/image';

interface FractalStreak {
  x: number;
  y: number;
  size: number;
  rotation: number;
  depth: number;
  opacity: number;
}

interface BrightCore {
  x: number;
  y: number;
  radius: number;
  opacity: number;
}

const StarryBackground: React.FC<{ show: boolean, lightDisabled?: boolean }> = ({ show, lightDisabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationFrameIdRef = useRef<number>();
  const lastFrameTime = useRef(0);
  const globalHueOffset = useRef(0);

  const updateDimensions = useCallback(() => {
    if (canvasRef.current) {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      canvasRef.current.width = width;
      canvasRef.current.height = height;
      
      setDimensions({ width, height });
    }
  }, []);

  useEffect(() => {
    updateDimensions();
    
    const handleResize = () => {
      updateDimensions();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateDimensions]);

  const getElementCounts = useCallback((width: number, height: number) => {
    const pixelCount = width * height;
    const basePixels = 1920 * 1080;
    const scaleFactor = Math.pow(pixelCount / basePixels, 0.85);

    return {
      stars: Math.floor(800 * scaleFactor),
      centralStars: Math.floor(1500 * scaleFactor),
      nebulaClouds: Math.floor(20 * scaleFactor),
      darkStreaks: Math.floor(15 * scaleFactor),
      brightCores: Math.floor(3 * scaleFactor)
    };
  }, []);

  const generateStars = useCallback((width: number, height: number) => {
    const stars = [];
    const counts = getElementCounts(width, height);
    
    const normalRandom = () => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return z;
    };

    for (let i = 0; i < counts.stars; i++) {
      // Create block-based position for synchronized twinkling
      const blockX = Math.floor(Math.random() * 20) / 20;
      const blockY = Math.floor(Math.random() * 20) / 20;
      
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.max(0.2, 1.0 + normalRandom() * 0.4),
        opacity: Math.random() * 0.8 + 0.1,
        color: `rgba(255, ${255 - Math.random() * 10}, ${255 - Math.random() * 15}, 0.9)`,
        twinkleOffset: blockX * 153.2 / (blockY + 1.73), // Unique twinkle timing per block
        twinkleSpeed: Math.random() * 2 + 1
      });
    }
    return stars;
  }, [getElementCounts]);

  const generateNebulaClouds = useCallback((width: number, height: number) => {
    const clouds = [];
    const bandHeight = height * 0.6;
    const bandY = height / 2 - bandHeight / 2;
    const counts = getElementCounts(width, height);
    
    for (let i = 0; i < counts.nebulaClouds; i++) {
      const inBand = i < Math.floor(counts.nebulaClouds * 0.6);
      clouds.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 150 + 50,
        baseHue: Math.random() * 60 + 200,
        hueOffset: Math.random() * 360,
        opacity: Math.random() * 0.12 + (inBand ? 0.08 : 0.04),
      });
    }
    return clouds;
  }, [getElementCounts]);
  
  const generateCosmicDust = useCallback((width: number, height: number) => {
    const dust = [];
    const bandHeight = height * 0.3;
    const bandY = height / 2 - bandHeight / 2;
    const counts = getElementCounts(width, height);
    
    for (let i = 0; i < counts.stars * 0.3; i++) {
      const inBand = Math.random() < 0.7;
      dust.push({
        x: Math.random() * width,
        y: inBand ? bandY + Math.random() * bandHeight : Math.random() * height,
        radius: Math.random() * 2 + (inBand ? 1.5 : 1),
        baseHue: Math.random() * 60 + 180,
        opacity: Math.random() * 0.5 + (inBand ? 0.3 : 0.2),
      });
    }
    return dust;
  }, [getElementCounts]);

  const generateFractalStreaks = useCallback((width: number, height: number) => {
    const streaks: FractalStreak[] = [];
    const centerY = height / 2;
    const bandHeight = height * 0.4;
    const counts = getElementCounts(width, height);
    
    for (let i = 0; i < counts.darkStreaks; i++) {
      const baseY = centerY + (Math.random() - 0.5) * bandHeight * 0.7;
      
      streaks.push({
        x: Math.random() * width,
        y: baseY,
        size: Math.random() * width * 0.3 + width * 0.1,
        rotation: Math.random() * 360,
        depth: Math.floor(Math.random() * 2) + 2, // 2-3 levels of recursion
        opacity: Math.random() * 0.2 + 0.1
      });
    }
    return streaks;
  }, [getElementCounts]);

  const drawFractalStreak = useCallback((
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    size: number, 
    rotation: number, 
    depth: number,
    opacity: number
  ) => {
    if (depth <= 0) return;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((rotation * Math.PI) / 180);
    
    // Draw main branch
    ctx.beginPath();
    ctx.moveTo(-size/2, 0);
    ctx.lineTo(size/2, 0);
    ctx.strokeStyle = `rgba(5, 2, 0, ${opacity})`;
    ctx.lineWidth = Math.max(1, size / 20);
    ctx.stroke();
    
    // Draw sub-branches
    if (depth > 1) {
      const newSize = size * 0.7;
      const angle = 25; // Branching angle
      
      // Right branch
      drawFractalStreak(
        ctx,
        size * 0.3,
        0,
        newSize,
        angle,
        depth - 1,
        opacity * 0.8
      );
      
      // Left branch
      drawFractalStreak(
        ctx,
        size * 0.3,
        0,
        newSize,
        -angle,
        depth - 1,
        opacity * 0.8
      );
    }
    
    ctx.restore();
  }, []);

  const generateBrightCores = useCallback((width: number, height: number) => {
    const cores = [];
    const centerY = height / 2;
    
    // Center bright core on the background image
    const clusterCenterX = width / 2;
    const clusterCenterY = centerY;
    
    // Generate 3-5 bright core regions
    const numCores = Math.floor(Math.random() * 3) + 3;
    for (let i = 0; i < numCores; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * width * 0.2; // Keep cores clustered
      
      cores.push({
        x: clusterCenterX + Math.cos(angle) * distance,
        y: clusterCenterY + Math.sin(angle) * distance * 0.3,
        radius: Math.random() * 150 + 100,
        opacity: Math.random() * 0.03 + 0.01
      });
    }
    return cores;
  }, []);

  const generateCentralStars = useCallback((width: number, height: number) => {
    const stars = [];
    const centerY = height / 2;
    const counts = getElementCounts(width, height);
    
    const normalRandom = () => {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      return z;
    };

    for (let i = 0; i < counts.centralStars; i++) {
      const yOffset = normalRandom() * height * 0.3;
      const y = centerY + yOffset;
      
      const distanceFromCenter = Math.abs(yOffset) / (height * 0.3);
      const distanceFactor = Math.pow(1 - distanceFromCenter, 1.5);
      
      if (Math.random() > distanceFromCenter * 0.7 + Math.random() * 0.2) {
        stars.push({
          x: Math.random() * width,
          y,
          radius: Math.random() * 1.5 + 0.5,
          opacity: Math.random() * 0.9 * distanceFactor * (0.8 + Math.random() * 0.4),
          color: `rgba(255, ${255 - Math.random() * 10}, ${255 - Math.random() * 15}, 1)`
        });
      }
    }
    return stars;
  }, [getElementCounts]);

  const stars = useMemo(() => generateStars(dimensions.width, dimensions.height), [dimensions, generateStars]);
  const nebulaClouds = useMemo(() => generateNebulaClouds(dimensions.width, dimensions.height), [dimensions, generateNebulaClouds]);
  const cosmicDust = useMemo(() => generateCosmicDust(dimensions.width, dimensions.height), [dimensions, generateCosmicDust]);
  const centralStars = useMemo(() => generateCentralStars(dimensions.width, dimensions.height), [dimensions, generateCentralStars]);
  const brightCores = useMemo(() => generateBrightCores(dimensions.width, dimensions.height), [dimensions, generateBrightCores]);
  const fractalStreaks = useMemo(
    () => generateFractalStreaks(dimensions.width, dimensions.height),
    [dimensions, generateFractalStreaks]
  );

  // Update drawBackground to use new dimming effect
  const drawBackground = useCallback((time: number) => {
    if (!show) return;
    
    const ctx = canvasRef.current?.getContext('2d', { alpha: false });
    if (!ctx) return;

    const frameInterval = 1000 / 30;
    const elapsed = time - lastFrameTime.current;
    
    if (elapsed < frameInterval) {
      animationFrameIdRef.current = requestAnimationFrame(drawBackground);
      return;
    }
    
    lastFrameTime.current = time - (elapsed % frameInterval);

    // Clear with black instead of transparent
    ctx.fillStyle = 'rgb(0, 0, 0)';
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    // Draw batched stars first
    ctx.save();
    
    // Draw all stars in one batch
    ctx.beginPath();
    stars.forEach(star => {
      ctx.moveTo(star.x, star.y);
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();

    // Draw central stars in one batch
    ctx.beginPath();
    centralStars.forEach(star => {
      ctx.moveTo(star.x, star.y);
      ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    });
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fill();

    ctx.restore();

    // Draw fractal streaks
    fractalStreaks.forEach(streak => {
      drawFractalStreak(
        ctx,
        streak.x,
        streak.y,
        streak.size,
        streak.rotation,
        streak.depth,
        streak.opacity
      );
    });

    nebulaClouds.forEach(cloud => {
      ctx.save();
      ctx.globalAlpha = cloud.opacity;
      const currentHue = (cloud.baseHue + cloud.hueOffset + globalHueOffset.current) % 360;
      
      const gradient = ctx.createRadialGradient(
        cloud.x, cloud.y, 0,
        cloud.x, cloud.y, cloud.radius
      );
      gradient.addColorStop(0, `hsla(${currentHue}, 80%, 50%, 0.3)`);
      gradient.addColorStop(0.5, `hsla(${currentHue}, 80%, 30%, 0.1)`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    cosmicDust.forEach(particle => {
      ctx.save();
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    brightCores.forEach(core => {
      ctx.save();
      const gradient = ctx.createRadialGradient(
        core.x, core.y, 0,
        core.x, core.y, core.radius
      );
      gradient.addColorStop(0, `rgba(255, 255, 255, ${core.opacity * 0.3})`);
      gradient.addColorStop(0.5, `rgba(255, 255, 240, ${core.opacity * 0.15})`);
      gradient.addColorStop(1, 'transparent');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(core.x, core.y, core.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    animationFrameIdRef.current = requestAnimationFrame(drawBackground);
  }, [show, dimensions, stars, nebulaClouds, cosmicDust, centralStars, fractalStreaks, brightCores, drawFractalStreak]);

  useEffect(() => {
    if (!show) return;
    
    animationFrameIdRef.current = requestAnimationFrame(drawBackground);
    
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [show, drawBackground]);

  useEffect(() => {
    return () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      }
    };
  }, [dimensions]);

  return (
    <>
      {/* Light mode background */}
      <Image 
        src='/images/background.jpg' 
        alt="Background" 
        className='fixed inset-0 w-full h-full z-[-2] dark:hidden' 
        width={1920} 
        height={1080} 
        priority
      />

      {/* Dark mode backgrounds */}
      <div className={`fixed inset-0 z-[-2] transition-opacity duration-300 ${show ? 'opacity-100' : 'opacity-0'} hidden dark:block`}>
        <Image 
          src='/images/MilkyWay.webp' 
          alt="Milky Way Background" 
          className='object-cover w-full h-full opacity-100'
          width={1920} 
          height={1080} 
          priority
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(circle at center, rgba(0,0,0,0) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,1) 100%)',
          }}
        />
      </div>

      <canvas 
        ref={canvasRef}
        className={`fixed inset-0 z-[-1] transition-opacity duration-300 
          ${show ? 'opacity-100' : 'opacity-0'} 
          ${lightDisabled ? '' : 'hidden dark:block'}`}
        style={{ width: '100%', height: '100%' }}
      />
    </>
  );
};

export default StarryBackground;

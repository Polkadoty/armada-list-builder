// components/OptimizedImage.tsx
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { placeholderMap } from '@/generated/placeholderMap';
import { sanitizeImageUrl } from '@/utils/dataFetcher';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
  onLoad?: () => void;
}

export function OptimizedImage({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false, 
  className = "", 
  onClick,
  onError,
  onLoad 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const containerRef = useRef<HTMLDivElement>(null);

  const sanitizedSrc = sanitizeImageUrl(src);
  const imageKey = sanitizedSrc.split('/').pop()?.replace(/\.[^/.]+$/, '');
  const placeholderUrl = imageKey ? placeholderMap[imageKey] : undefined;

  useEffect(() => {
    if (priority) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsVisible(entry.isIntersecting);
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, shouldLoad]);

  const handleLoad = () => {
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
    
    onLoad?.();
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {placeholderUrl && (
        <div 
          className="absolute inset-0 w-full h-full"
          style={{
            backgroundImage: `url(${placeholderUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            transform: 'scale(1.1)',
          }}
        />
      )}
      {isLoading && !placeholderUrl && (
        <div className="absolute inset-0 flex items-center justify-center border-2 border-primary/20 rounded-lg backdrop-blur-sm">
          <div className="w-4 h-4 rounded-full animate-spin" />
        </div>
      )}
      {!hasError && shouldLoad && (
        <img
          src={sanitizedSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} relative w-full h-full transition-opacity duration-666 ease-in-out rounded-lg ${
            isLoading || !isVisible ? 'opacity-0' : 'opacity-100'
          }`}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            onError?.();
          }}
          onClick={onClick}
        />
      )}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-red-500/20 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <span className="text-sm text-gray-500">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
// components/OptimizedImage.tsx
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect, useRef, memo, useMemo, useCallback } from 'react';
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
  debug?: boolean;
}

// Cache management
async function cacheImage(src: string): Promise<string> {
  try {
    const cache = await caches.open('optimized-images');
    const cachedResponse = await cache.match(src);
    
    if (cachedResponse) {
      return src; // Use original URL if already cached
    }

    const response = await fetch(src);
    if (!response.ok) throw new Error('Network response was not ok');
    await cache.put(src, response.clone());
    return src;
  } catch (error) {
    console.error('Error caching image:', error);
    return src; // Fallback to original URL on error
  }
}

// Extract just the filename from the path
const getImageKey = (src: string) => {
  // Remove file extension and get just the base filename
  return src.split('/').pop()?.split('.')[0] || src;
};

export const OptimizedImage = memo(({ 
  src, 
  alt, 
  width, 
  height, 
  priority = false, 
  className = "", 
  onClick,
  onError,
  onLoad,
  debug = false
}: OptimizedImageProps) => {
  // Memoize the processed source URL
  const processedImageSrc = useMemo(() => sanitizeImageUrl(src), [src]);
  
  // Memoize the placeholder URL lookup
  const placeholderUrl = useMemo(() => {
    const imageKey = getImageKey(src);
    return placeholderMap[imageKey];
  }, [src]);
  
  // Use a ref for tracking loading state to prevent unnecessary rerenders
  const loadingRef = useRef(true);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add a new state for placeholder visibility
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Batch visibility updates
  const handleVisibilityChange = useCallback((isVisible: boolean) => {
    requestAnimationFrame(() => {
      setIsVisible(isVisible);
    });
  }, []);

  // Optimize intersection observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          handleVisibilityChange(entry.isIntersecting);
        });
      },
      { rootMargin: '50px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [handleVisibilityChange]);

  // Modify the handleLoad callback
  const handleLoad = useCallback(() => {
    requestAnimationFrame(() => {
      loadingRef.current = false;
      setIsLoading(false);
      // Add a small delay before hiding placeholder for smooth transition
      setTimeout(() => {
        setShowPlaceholder(false);
      }, 300);
      onLoad?.();
    });
  }, [onLoad]);

  // Calculate dynamic rootMargin based on viewport height
  const getRootMargin = () => {
    if (typeof window === 'undefined') return '200px 0px';
    const viewportHeight = window.innerHeight;
    const margin = Math.max(200, viewportHeight * 0.5); // At least 200px or 50% of viewport
    return `${margin}px 0px`;
  };

  useEffect(() => {
    if (priority) {
      cacheImage(processedImageSrc).then(setImageSrc);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          handleVisibilityChange(entry.isIntersecting);
          if (entry.isIntersecting && !shouldLoad) {
            setShouldLoad(true);
            // Only cache and set image source when the image comes into view
            cacheImage(processedImageSrc).then(setImageSrc);
          }
        });
      },
      {
        rootMargin: getRootMargin(),
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority, shouldLoad, processedImageSrc, handleVisibilityChange]);

  // Update rootMargin on window resize
  useEffect(() => {
    if (priority) return;

    const handleResize = () => {
      if (containerRef.current) {
        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              handleVisibilityChange(entry.isIntersecting);
              if (entry.isIntersecting && !shouldLoad) {
                setShouldLoad(true);
                cacheImage(processedImageSrc).then(setImageSrc);
              }
            });
          },
          {
            rootMargin: getRootMargin(),
            threshold: 0.1
          }
        );
        observer.observe(containerRef.current);
        return () => observer.disconnect();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [priority, shouldLoad, processedImageSrc, handleVisibilityChange]);

  // Add loading priority for visible images
  const shouldPrioritize = useMemo(() => {
    return isVisible || priority;
  }, [isVisible, priority]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {debug && (
        <div className="absolute top-0 left-0 z-50 bg-black/80 text-white text-xs p-1">
          {isLoading ? 'Loading' : 'Loaded'} | {isVisible ? 'Visible' : 'Hidden'}
        </div>
      )}
      
      {placeholderUrl && (
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-100 ${
            showPlaceholder ? 'opacity-100' : 'opacity-0'
          }`}
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
      
      {!hasError && shouldLoad && imageSrc && (
        <img
          src={processedImageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} relative w-full h-full transition-opacity duration-100 ease-in rounded-lg ${
            isLoading || !isVisible ? 'opacity-0' : 'opacity-100'
          }`}
          loading={shouldPrioritize ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
            setShowPlaceholder(false);
            onError?.();
          }}
          onClick={onClick}
        />
      )}
      
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-red-500/20 rounded-lg">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <span className="text-sm text-zinc-500">Failed to load image</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom memo comparison to prevent unnecessary rerenders
  return prevProps.src === nextProps.src && 
         prevProps.className === nextProps.className &&
         prevProps.priority === nextProps.priority;
});

OptimizedImage.displayName = 'OptimizedImage';
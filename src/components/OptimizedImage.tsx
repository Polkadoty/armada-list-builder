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

// Request queue to limit concurrent image loading
class ImageRequestQueue {
  private queue: Array<() => void> = [];
  private activeRequests = 0;
  private readonly maxConcurrent = 6; // Limit concurrent requests

  add(request: () => void) {
    this.queue.push(request);
    this.processQueue();
  }

  private processQueue() {
    if (this.activeRequests >= this.maxConcurrent || this.queue.length === 0) {
      return;
    }

    const request = this.queue.shift();
    if (request) {
      this.activeRequests++;
      request();
    }
  }

  complete() {
    this.activeRequests--;
    this.processQueue();
  }
}

// Global request queue instance
const imageQueue = new ImageRequestQueue();

// Simple in-memory cache for loaded images
const imageCache = new Map<string, boolean>();

// Extract just the filename from the path
const getImageKey = (src: string) => {
  // Remove file extension and get just the base filename
  return src.split('/').pop()?.split('.')[0] || src;
};

// Preload image with queue management
const queueImageLoad = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already cached
    if (imageCache.has(src)) {
      resolve();
      return;
    }

    imageQueue.add(() => {
      const img = new Image();
      
      const cleanup = () => {
        imageQueue.complete();
      };

      img.onload = () => {
        imageCache.set(src, true);
        cleanup();
        resolve();
      };

      img.onerror = () => {
        cleanup();
        reject(new Error('Failed to load image'));
      };

      // Add timeout to prevent hanging requests
      setTimeout(() => {
        cleanup();
        reject(new Error('Image load timeout'));
      }, 10000); // 10 second timeout

      img.src = src;
    });
  });
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
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority); // Start visible if priority
  const [shouldLoad, setShouldLoad] = useState(priority);
  const [imageReady, setImageReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Add a new state for placeholder visibility
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  // Simplified visibility change handler
  const handleVisibilityChange = useCallback((visible: boolean) => {
    if (visible && !shouldLoad) {
      setIsVisible(true);
      setShouldLoad(true);
    } else if (visible) {
      setIsVisible(true);
    }
  }, [shouldLoad, src]);

  // Single intersection observer for lazy loading
  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          handleVisibilityChange(entry.isIntersecting);
        });
      },
      {
        rootMargin: '100px', // Simplified static margin
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, handleVisibilityChange]);

  // Queue-based image loading
  useEffect(() => {
    if (!shouldLoad) return;

    // Check if already cached
    if (imageCache.has(processedImageSrc)) {
      setImageReady(true);
      setIsLoading(false);
      return;
    }

    queueImageLoad(processedImageSrc)
      .then(() => {
        setImageReady(true);
        setIsLoading(false);
      })
      .catch(() => {
        setHasError(true);
        setIsLoading(false);
      });
  }, [shouldLoad, processedImageSrc]);

  // Simplified load handler
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => {
      setShowPlaceholder(false);
    }, 100); // Reduced delay
    onLoad?.();
  }, [onLoad, src]);

  // Simplified error handler
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    setShowPlaceholder(false);
    onError?.();
  }, [onError, src]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {debug && (
        <div className="absolute top-0 left-0 z-50 bg-black/80 text-white text-xs p-1">
          {isLoading ? 'Loading' : 'Loaded'} | {isVisible ? 'Visible' : 'Hidden'} | {shouldLoad ? 'Should Load' : 'No Load'}
        </div>
      )}
      
      {placeholderUrl && (
        <div 
          className={`absolute inset-0 w-full h-full transition-opacity duration-150 ${
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
      
      {!hasError && shouldLoad && imageReady && (
        <img
          src={processedImageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} relative w-full h-full transition-opacity duration-150 ease-in rounded-lg ${
            isLoading || !isVisible ? 'opacity-0' : 'opacity-100'
          }`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
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
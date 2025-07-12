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
  loading?: 'eager' | 'lazy';
  debug?: boolean;
  // New props for animation control
  fadeInDuration?: number;
  blurAmount?: number;
}

// Request queue to limit concurrent image loading
class ImageRequestQueue {
  private queue: Array<() => void> = [];
  private activeRequests = 0;
  private readonly maxConcurrent = 12; // Allow more concurrent requests for better performance

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

// Improved global intersection observer for better reliability
let globalObserver: IntersectionObserver | null = null;
const observedElements = new Map<Element, (visible: boolean) => void>();



// Enhanced global observer with better error handling
const initGlobalObserver = () => {
  if (globalObserver) return globalObserver;
  
  globalObserver = new IntersectionObserver(
    (entries: IntersectionObserverEntry[]) => {
      // Process immediately without debouncing to prevent missing loads
      entries.forEach((entry) => {
        const callback = observedElements.get(entry.target);
        if (callback) {
          try {
            callback(entry.isIntersecting);
          } catch (error) {
            console.warn('OptimizedImage observer callback error:', error);
          }
        }
      });
    },
    {
      rootMargin: '100px', // Increased back to ensure images load reliably
      threshold: [0, 0.1] // Multiple thresholds for smoother transitions
    }
  );
  
  return globalObserver;
};

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
  loading = 'lazy',
  debug = false,
  fadeInDuration = 200,
  blurAmount = 8
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
  const [showFullImage, setShowFullImage] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Enhanced state management for smooth transitions
  const [transitionState, setTransitionState] = useState<'placeholder' | 'loading' | 'ready' | 'error'>('placeholder');

  // Simplified visibility change handler - removed debouncing for reliability
  const handleVisibilityChange = useCallback((visible: boolean) => {
    if (visible && !shouldLoad) {
      setIsVisible(true);
      setShouldLoad(true);
    } else if (visible) {
      setIsVisible(true);
    }
  }, [shouldLoad]);

  // Enhanced intersection observer with fallback and better cleanup
  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = initGlobalObserver();
    const element = containerRef.current;
    
    if (element && observer) {
      // Add to map first, then observe
      observedElements.set(element, handleVisibilityChange);
      observer.observe(element);
      
      // Fallback: If not visible after a short delay, force load anyway
      const fallbackTimer = setTimeout(() => {
        if (!isVisible && !shouldLoad) {
          console.warn('OptimizedImage fallback load triggered for:', src);
          handleVisibilityChange(true);
        }
      }, 2000); // 2 second fallback

      return () => {
        clearTimeout(fallbackTimer);
        if (element && observer) {
          observer.unobserve(element);
          observedElements.delete(element);
        }
      };
    }

    // Fallback if observer creation failed
    if (!observer) {
      console.warn('OptimizedImage: Global observer failed, using fallback');
      handleVisibilityChange(true);
    }
  }, [priority, handleVisibilityChange, isVisible, shouldLoad, src]);

  // Queue-based image loading with enhanced error handling
  useEffect(() => {
    if (!shouldLoad) return;

    setTransitionState('loading');

    // Check if already cached
    if (imageCache.has(processedImageSrc)) {
      setImageReady(true);
      setIsLoading(false);
      setTransitionState('ready');
      return;
    }

    queueImageLoad(processedImageSrc)
      .then(() => {
        setImageReady(true);
        setIsLoading(false);
        setTransitionState('ready');
      })
      .catch((error) => {
        console.warn('OptimizedImage load failed:', error, 'for src:', processedImageSrc);
        setHasError(true);
        setIsLoading(false);
        setTransitionState('error');
      });
  }, [shouldLoad, processedImageSrc]);

  // Enhanced load handler with smooth transition timing
  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setTransitionState('ready');
    
    // Trigger the fade-in with a small delay for better visual effect
    requestAnimationFrame(() => {
      setTimeout(() => {
        setShowFullImage(true);
      }, 50); // Small delay to ensure image is fully rendered
    });
    
    onLoad?.();
  }, [onLoad]);

  // Enhanced error handler
  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoading(false);
    setTransitionState('error');
    setShowFullImage(false);
    onError?.();
  }, [onError]);

  // Optimized transition styles for Firefox and better performance
  const transitionStyles = useMemo(() => ({
    transition: `opacity ${fadeInDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
    // Remove transform transitions during scroll to prevent repaints
    willChange: showFullImage ? 'auto' : 'opacity', 
    // Force GPU layer for better performance
    backfaceVisibility: 'hidden' as const,
    // Optimize for Firefox specifically
    WebkitBackfaceVisibility: 'hidden' as const,
    WebkitPerspective: 1000,
  }), [fadeInDuration, showFullImage]);

  // Simplified placeholder styles without transform during scroll
  const placeholderStyles = useMemo(() => ({
    backgroundImage: `url(${placeholderUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: `blur(${blurAmount}px)`,
    // Remove scale transform to prevent repaints during scroll
    opacity: showFullImage ? 0 : 1,
    ...transitionStyles
  }), [placeholderUrl, blurAmount, showFullImage, transitionStyles]);

  // Main image styles optimized for scroll performance
  const imageStyles = useMemo(() => ({
    opacity: showFullImage ? 1 : 0,
    // Only apply scale transform when not scrolling
    transform: showFullImage ? 'scale(1)' : 'scale(1.02)',
    ...transitionStyles
  }), [showFullImage, transitionStyles]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full overflow-hidden"
      style={{
        // Contain layout and paint to prevent reflows
        contain: 'layout style paint',
        // Optimize for smooth scrolling
        scrollBehavior: 'smooth'
      }}
    >
      {debug && (
        <div className="absolute top-0 left-0 z-50 bg-black/80 text-white text-xs p-1">
          State: {transitionState} | {isVisible ? 'Visible' : 'Hidden'} | {shouldLoad ? 'Should Load' : 'No Load'}
        </div>
      )}
      
      {/* Optimized placeholder */}
      {placeholderUrl && (
        <div 
          className="absolute inset-0 w-full h-full"
          style={placeholderStyles}
        />
      )}
      
      {/* Optimized loading state */}
      {isLoading && !placeholderUrl && (
        <div 
          className="absolute inset-0 flex items-center justify-center border-2 border-primary/20 rounded-lg backdrop-blur-sm bg-transparent"
          style={{
            opacity: showFullImage ? 0 : 1,
            ...transitionStyles
          }}
        >
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      )}
      
      {/* Optimized main image */}
      {!hasError && shouldLoad && imageReady && (
        <img
          src={processedImageSrc}
          alt={alt}
          width={width}
          height={height}
          className={`${className} relative w-full h-full rounded-lg bg-transparent`}
          style={imageStyles}
          loading={priority ? "eager" : loading}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
        />
      )}
      
      {/* Enhanced error state */}
      {hasError && (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center border-2 border-red-500/20 rounded-lg bg-transparent"
          style={{
            opacity: 1,
            ...transitionStyles
          }}
        >
          <AlertCircle className="w-8 h-8 text-red-500 mb-2" />
          <span className="text-xs text-zinc-500 text-center px-2">Failed to load image</span>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Enhanced memo comparison
  return prevProps.src === nextProps.src && 
         prevProps.className === nextProps.className &&
         prevProps.priority === nextProps.priority &&
         prevProps.fadeInDuration === nextProps.fadeInDuration &&
         prevProps.blurAmount === nextProps.blurAmount;
});

OptimizedImage.displayName = 'OptimizedImage';
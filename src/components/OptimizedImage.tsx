// components/OptimizedImage.tsx
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

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

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  return (
    <div className="relative w-full h-full bg-transparent">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center border-2 border-primary/20 rounded-lg backdrop-blur-sm bg-transparent">
          <div className="w-4 h-4 rounded-full animate-spin" />
        </div>
      )}
      {!hasError && (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`${className} w-full h-full transition-all duration-150 ease-out rounded-lg bg-transparent ${
            isLoading ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
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
        <div className="absolute inset-0 flex flex-col items-center justify-center border-2 border-red-500/20 rounded-lg bg-transparent">
          <AlertCircle className="w-12 h-12 text-red-500 mb-2" />
          <span className="text-sm text-gray-500">Failed to load image</span>
        </div>
      )}
    </div>
  );
}
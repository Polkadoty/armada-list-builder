// components/ImageModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { imageDb } from '@/lib/imageDb';

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ src, alt, onClose }: ImageModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const loadImage = async () => {
      if (!src) return;
      
      if (src.startsWith('ship_') || src.startsWith('squadron_') || src.startsWith('upgrade_')) {
        try {
          const image = await imageDb.getImage(src);
          if (image) {
            setImageUrl(image);
          }
        } catch (error) {
          console.error('Error loading image from IndexedDB:', error);
        }
      } else {
        setImageUrl(src);
      }
    };

    loadImage();

    return () => {
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [src]);

  // Create thumbnail version of the URL only if we have an imageUrl
  const thumbnailSrc = imageUrl ? imageUrl.replace(/\.(png|jpg|jpeg|webp)/, '-thumb.$1') : '';

  if (!imageUrl) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
      onClick={onClose}
    >
      <div className="relative p-4" onClick={(e) => e.stopPropagation()}>
        {isLoading && (
          <OptimizedImage
            src={thumbnailSrc}
            alt={alt}
            width={300}
            height={420}
            className="rounded-lg filter blur-sm"
            priority={true}
          />
        )}
        <OptimizedImage
          src={imageUrl}
          alt={alt}
          width={300}
          height={420}
          className="rounded-lg sm:w-[450px] sm:h-[630px] lg:w-[600px] lg:h-[840px] py-4"
          priority={true}
          onLoad={() => setIsLoading(false)}
        />
        <button
          className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
          onClick={onClose}
        >
          <X size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
}
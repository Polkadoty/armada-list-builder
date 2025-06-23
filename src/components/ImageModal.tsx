// components/ImageModal.tsx
import { X } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';

interface ImageModalProps {
  src: string;
  alt: string;
  onClose: () => void;
}

export function ImageModal({ src, alt, onClose }: ImageModalProps) {
  return (
    <div 
      className="fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center w-screen h-screen" 
      onClick={onClose}
    >
      <div className="relative p-4" onClick={(e) => e.stopPropagation()}>
        <OptimizedImage
          src={src}
          alt={alt}
          width={300}
          height={420}
          className="rounded-lg sm:w-[450px] sm:h-[630px] lg:w-[600px] lg:h-[840px] py-4"
          priority={true}
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
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, RotateCw, FlipHorizontal, ZoomIn, ZoomOut, Move, Trash2, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import Image from "next/image";

interface ImageUploaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onImageChange: (image: string, transform?: ImageTransform) => void;
  aspectRatio?: string;
  initialImage?: string;
  initialTransform?: ImageTransform;
  previewSize?: 'sm' | 'md' | 'lg';
  allowTransform?: boolean;
  label?: string | React.ReactNode;
}

export interface ImageTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipped: boolean;
  brightness?: number;
  contrast?: number;
  opacity?: number;
}

const defaultTransform: ImageTransform = {
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  flipped: false,
  brightness: 100,
  contrast: 100,
  opacity: 100,
};

export function ImageUploader({ 
  onImageChange,
  aspectRatio = "auto",
  initialImage = '',
  initialTransform = defaultTransform,
  previewSize = 'md',
  allowTransform = true,
  label = "Click or drag image to upload",
  className,
  ...props
}: ImageUploaderProps) {
  const [image, setImage] = useState<string>(initialImage);
  const [transform, setTransform] = useState<ImageTransform>(initialTransform);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImage(result);
      setTransform(defaultTransform);
      onImageChange(result, defaultTransform);
    };
    reader.readAsDataURL(file);
  };

  const handleTransformChange = (updates: Partial<ImageTransform>) => {
    const newTransform = { ...transform, ...updates };
    setTransform(newTransform);
    onImageChange(image, newTransform);
  };

  const previewSizeClasses = {
    sm: "w-[180px] h-[180px]",
    md: "w-[320px] h-[320px]",
    lg: "w-full max-w-[400px] aspect-[2.5/3.5]"
  };

  const transformStyle = {
    transform: `
      translate(${transform.x}px, ${transform.y}px)
      rotate(${transform.rotation}deg)
      scale(${transform.flipped ? -1 : 1}, 1)
      scale(${transform.scale})
    `,
    filter: `
      brightness(${transform.brightness}%)
      contrast(${transform.contrast}%)
    `,
    opacity: `${transform.opacity}%`,
  };

  return (
    <div className={cn("space-y-4", className)} {...props}>
      {!image ? (
        <div
          className={cn(
            "border-2 border-dashed rounded-lg transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/10" : "border-gray-600/40",
            previewSizeClasses[previewSize],
            "flex flex-col items-center justify-center gap-3",
            "hover:border-gray-500 hover:bg-gray-800/30"
          )}
          style={{ padding: previewSize === 'sm' ? '1.5rem' : '2rem' }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) handleFileUpload(file);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
          />
          <Upload className={cn(
            "text-gray-400",
            previewSize === 'sm' ? "h-8 w-8" : "h-12 w-12"
          )} />
          {typeof label === 'string' ? (
            <p className={cn(
              "text-gray-400",
              previewSize === 'sm' ? "text-sm" : "text-base"
            )}>{label}</p>
          ) : (
            label
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <div 
              className={cn(
                "relative overflow-hidden rounded-lg bg-black/20",
                previewSizeClasses[previewSize]
              )}
              style={{ aspectRatio }}
            >
              <Image
                src={image}
                alt="Image preview"
                fill
                className="object-contain"
                style={transformStyle}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-black/40 hover:bg-black/60"
                onClick={() => {
                  setImage('');
                  setTransform(defaultTransform);
                  onImageChange('', defaultTransform);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {allowTransform && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTransformChange({ rotation: transform.rotation + 90 })}
                >
                  <RotateCw className="h-4 w-4 mr-2" />
                  Rotate
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTransformChange({ flipped: !transform.flipped })}
                >
                  <FlipHorizontal className="h-4 w-4 mr-2" />
                  Flip
                </Button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm flex items-center">
                    <ZoomIn className="h-4 w-4 mr-2" />
                    Scale
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={transform.scale}
                    onChange={(e) => handleTransformChange({ scale: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm flex items-center">
                    <Move className="h-4 w-4 mr-2" />
                    Position
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="range"
                      min="-500"
                      max="500"
                      value={transform.x}
                      onChange={(e) => handleTransformChange({ x: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="-500"
                      max="500"
                      value={transform.y}
                      onChange={(e) => handleTransformChange({ y: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm">Adjustments</label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={transform.brightness}
                      onChange={(e) => handleTransformChange({ brightness: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="200"
                      value={transform.contrast}
                      onChange={(e) => handleTransformChange({ contrast: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={transform.opacity}
                      onChange={(e) => handleTransformChange({ opacity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 
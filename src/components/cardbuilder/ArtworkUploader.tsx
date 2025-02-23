import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, RotateCw, FlipHorizontal } from 'lucide-react';

interface ArtworkUploaderProps {
  onArtworkChange: (artwork: string, transform: ArtworkTransform) => void;
}

export interface ArtworkTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipped: boolean;
  brightness?: number;
  contrast?: number;
  opacity?: number;
}

export function ArtworkUploader({ onArtworkChange }: ArtworkUploaderProps) {
  const [artwork, setArtwork] = useState<string>('');
  const [transform, setTransform] = useState<ArtworkTransform>({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    flipped: false,
    brightness: 1,
    contrast: 1,
    opacity: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setArtwork(result);
      onArtworkChange(result, transform);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTransformChange = (updates: Partial<ArtworkTransform>) => {
    const newTransform = { ...transform, ...updates };
    setTransform(newTransform);
    onArtworkChange(artwork, newTransform);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDragging ? 'border-primary bg-primary/10' : 'border-gray-600'}
          ${artwork ? 'border-success' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
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
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2">Click or drag image to upload artwork</p>
      </div>

      {artwork && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTransformChange({ rotation: transform.rotation + 90 })}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Rotate 90°
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
          
          <div className="space-y-1">
            <label className="text-sm">Rotation (degrees)</label>
            <input
              type="range"
              min="0"
              max="360"
              value={transform.rotation}
              onChange={(e) => handleTransformChange({ rotation: parseInt(e.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="0"
              max="360"
              value={transform.rotation}
              onChange={(e) => handleTransformChange({ rotation: parseInt(e.target.value) })}
              className="w-20 text-sm p-1 border rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Scale</label>
            <input
              type="range"
              min="0.1"
              max="2"
              step="0.05"
              value={transform.scale}
              onChange={(e) => handleTransformChange({ scale: parseFloat(e.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="0.1"
              max="2"
              step="0.05"
              value={transform.scale}
              onChange={(e) => handleTransformChange({ scale: parseFloat(e.target.value) })}
              className="w-20 text-sm p-1 border rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">X Position</label>
            <input
              type="range"
              min="-500"
              max="500"
              step="1"
              value={transform.x}
              onChange={(e) => handleTransformChange({ x: parseInt(e.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="-500"
              max="500"
              value={transform.x}
              onChange={(e) => handleTransformChange({ x: parseInt(e.target.value) })}
              className="w-20 text-sm p-1 border rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Y Position</label>
            <input
              type="range"
              min="-500"
              max="500"
              step="1"
              value={transform.y}
              onChange={(e) => handleTransformChange({ y: parseInt(e.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="-500"
              max="500"
              value={transform.y}
              onChange={(e) => handleTransformChange({ y: parseInt(e.target.value) })}
              className="w-20 text-sm p-1 border rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Brightness</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={transform.brightness}
              onChange={(e) => handleTransformChange({ brightness: parseFloat(e.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={transform.brightness}
              onChange={(e) => handleTransformChange({ brightness: parseFloat(e.target.value) })}
              className="w-20 text-sm p-1 border rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Contrast</label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.05"
              value={transform.contrast}
              onChange={(e) => handleTransformChange({ contrast: parseFloat(e.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="0"
              max="2"
              step="0.05"
              value={transform.contrast}
              onChange={(e) => handleTransformChange({ contrast: parseFloat(e.target.value) })}
              className="w-20 text-sm p-1 border rounded"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm">Opacity</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={transform.opacity}
              onChange={(e) => handleTransformChange({ opacity: parseFloat(e.target.value) })}
              className="w-full"
            />
            <input
              type="number"
              min="0"
              max="1"
              step="0.05"
              value={transform.opacity}
              onChange={(e) => handleTransformChange({ opacity: parseFloat(e.target.value) })}
              className="w-20 text-sm p-1 border rounded"
            />
          </div>
        </div>
      )}
    </div>
  );
} 
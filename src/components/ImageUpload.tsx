import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card } from "./ui/card";

interface ImageUploadProps {
  onUpload: (file: File) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1
  });

  return (
    <Card
      {...getRootProps()}
      className={`p-6 border-2 border-dashed cursor-pointer ${
        isDragActive ? "border-primary" : "border-gray-300"
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p className="text-center">Drop the image here...</p>
      ) : (
        <p className="text-center">
          Drag and drop an image here, or click to select one
        </p>
      )}
    </Card>
  );
} 
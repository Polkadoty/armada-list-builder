// TextImportWindow.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface TextImportWindowProps {
  onImport: (text: string) => void;
  onClose: () => void;
}

export function TextImportWindow({ onImport, onClose }: TextImportWindowProps) {
  const [importText, setImportText] = useState('');

  const handleImport = () => {
    onImport(importText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Import Fleet</h2>
        <Textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Paste your fleet text here..."
          className="w-full h-64 mb-4"
        />
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleImport}>Import</Button>
        </div>
      </div>
    </div>
  );
}
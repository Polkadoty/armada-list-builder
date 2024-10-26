// TextImportWindow.tsx
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X, Import } from 'lucide-react'; // Import icons

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
      <Card className="w-full max-w-lg md:max-w-2xl bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30 rounded-lg shadow-lg flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Import Fleet</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="p-4 flex-grow overflow-auto">
          <Textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste your fleet text here..."
            className="w-full h-full min-h-[200px] bg-transparent text-gray-900 dark:text-white"
          />
        </CardContent>
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={handleImport}>
            <Import className="mr-2 h-4 w-4" /> Import
          </Button>
        </div>
      </Card>
    </div>
  );
}

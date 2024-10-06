import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ImportTextPopupProps {
  onImport: (content: string) => void;
  onClose: () => void;
}

export function ImportTextPopup({ onImport, onClose }: ImportTextPopupProps) {
  const [importText, setImportText] = useState('');

  const handleImport = () => {
    onImport(importText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-3/4 h-3/4 overflow-auto bg-white dark:bg-gray-800">
        <CardContent>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Import Fleet</h2>
          <Textarea
            className="w-full h-64 mb-4"
            placeholder="Paste your fleet text here..."
            value={importText}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setImportText(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={onClose}>Cancel</Button>
            <Button onClick={handleImport}>Import</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
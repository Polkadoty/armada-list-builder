import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ExportTextPopupProps {
  text: string;
  onClose: () => void;
}

export function ExportTextPopup({ text, onClose }: ExportTextPopupProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-3/4 h-3/4 overflow-auto bg-white dark:bg-gray-800">
        <CardContent>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Export Text</h2>
          <pre className="whitespace-pre-wrap bg-gray-100 dark:bg-gray-700 p-4 rounded-md text-gray-900 dark:text-white">
            {text}
          </pre>
          <Button onClick={onClose} className="mt-4">Close</Button>
        </CardContent>
      </Card>
    </div>
  );
}
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share, X } from 'lucide-react'; // Import icons

interface ExportTextPopupProps {
  text: string;
  onClose: () => void;
}

export function ExportTextPopup({ text, onClose }: ExportTextPopupProps) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Text copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const shareText = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Exported Text',
        text: text,
      }).catch(err => {
        console.error('Failed to share text: ', err);
      });
    } else {
      alert('Share not supported on this browser.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg md:max-w-2xl bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30 rounded-lg shadow-lg flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Text</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="p-4 flex-grow overflow-auto">
          <pre className="whitespace-pre-wrap bg-transparent text-gray-900 dark:text-white">
            {text}
          </pre>
        </CardContent>
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={copyToClipboard} className="mr-2">
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          <Button onClick={shareText}>
            <Share className="mr-2 h-4 w-4" /> Share
          </Button>
        </div>
      </Card>
    </div>
  );
}

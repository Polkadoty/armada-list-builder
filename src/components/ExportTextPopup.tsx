import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share } from 'lucide-react'; // Import icons

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
    <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
      <Card className="w-full max-w-lg md:max-w-2xl h-3/4 overflow-auto bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30 rounded-lg shadow-lg p-4">
        <CardContent>
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Export Text</h2>
          <pre className="whitespace-pre-wrap bg-transparent p-4 rounded-md text-gray-900 dark:text-white">
            {text}
          </pre>
        </CardContent>
        <div className="flex justify-between p-4 border-t border-gray-300 dark:border-gray-700 bg-transparent backdrop-blur-md rounded-b-lg">
          <Button onClick={copyToClipboard} className="flex items-center  hover:bg-opacity-20">
            <Copy className="mr-2" /> Copy
          </Button>
          <Button onClick={shareText} className="flex items-center  hover:bg-opacity-20">
            <Share className="mr-2" /> Share
          </Button>
          <Button onClick={onClose} className="flex items-center  hover:bg-opacity-20">
            Close
          </Button>
        </div>
      </Card>
    </div>
  );
}

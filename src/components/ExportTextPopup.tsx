import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share, X } from 'lucide-react'; // Import icons
import { NotificationWindow } from './NotificationWindow';

interface ExportTextPopupProps {
  text: string;
  onClose: () => void;
}

export function ExportTextPopup({ text, onClose }: ExportTextPopupProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text).then(() => {
      setNotificationMessage('Text copied to clipboard!');
      setShowNotification(true);
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const shareText = () => {
    const shareData = {
      title: 'Exported Fleet',
      text: text,
    };

    if (navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData).catch(err => {
        console.error('Failed to share text: ', err);
        setNotificationMessage('Failed to share text. Please try again.');
        setShowNotification(true);
      });
    } else {
      setNotificationMessage('Share not supported on this browser. Try copying the text instead.');
      setShowNotification(true);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-lg md:max-w-2xl bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 rounded-lg shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Text</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="p-4 overflow-y-auto flex-grow">
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
      {showNotification && (
        <NotificationWindow
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}
    </div>
  );
}

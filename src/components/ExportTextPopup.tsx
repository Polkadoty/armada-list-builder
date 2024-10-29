import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share, X, Camera } from 'lucide-react'; // Add Camera icon
import { NotificationWindow } from './NotificationWindow';
import domtoimage from 'dom-to-image';

interface ExportTextPopupProps {
  text: string;
  onClose: () => void;
  contentRef?: React.RefObject<HTMLDivElement>; // Add this prop
}

export function ExportTextPopup({ text, onClose, contentRef }: ExportTextPopupProps) {
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

  const exportAsImage = async () => {
    if (!contentRef?.current) {
      setNotificationMessage('Failed to capture content');
      setShowNotification(true);
      return;
    }

    try {
      
      // Hide the export popup temporarily
      const exportPopup = document.querySelector('[data-export-popup="true"]');
      if (exportPopup) {
        exportPopup.classList.add('hidden');
      }

      // Wait for fonts to load
      await document.fonts.ready;

      // Update image sources to use the proxy
      const images = contentRef.current.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(async img => {
        if (img.src.startsWith('https://api.swarmada.wiki')) {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(img.src)}`;
          img.src = proxyUrl;
        }
      }));

      // Use dom-to-image to capture the content
      const dataUrl = await domtoimage.toPng(contentRef.current);

      // Convert the data URL to a Blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Copy the image to the clipboard
      const data = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([data]);

      setNotificationMessage('Fleet image copied to clipboard!');
      setShowNotification(true);
    } catch (err) {
      console.error('Failed to export as image:', err);
      setNotificationMessage('Failed to export as image');
      setShowNotification(true);
    } finally {
      const exportPopup = document.querySelector('[data-export-popup="true"]');
      if (exportPopup) {
        exportPopup.classList.remove('hidden');
      }
    }
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-export-popup="true">
      <Card className="w-full max-w-lg md:max-w-2xl bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 rounded-lg shadow-lg flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Fleet</h2>
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
            <Copy className="mr-2 h-4 w-4" /> Copy Text
          </Button>
          <Button onClick={exportAsImage} className="mr-2">
            <Camera className="mr-2 h-4 w-4" /> Copy as Image
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

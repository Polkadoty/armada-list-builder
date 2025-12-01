import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2, X, Camera } from 'lucide-react';
import { NotificationWindow } from './NotificationWindow';
import { Checkbox } from "./ui/checkbox";
import domtoimage from 'dom-to-image';
import { useUser } from '@auth0/nextjs-auth0/client';

interface ExportTextPopupProps {
  text: string;
  onClose: () => void;
  contentRef?: React.RefObject<HTMLDivElement>;
  fleetId?: string;
  isShared?: boolean;
  onShareToggle?: () => void;
}

export function ExportTextPopup({ 
  text, 
  onClose, 
  contentRef,
  fleetId,
  isShared = false,
  onShareToggle
}: ExportTextPopupProps) {
  const { user } = useUser();
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

      // Force load all images within the content
      const images = contentRef.current.getElementsByTagName('img');
      await Promise.all(Array.from(images).map(async img => {
        // Remove loading="lazy" attribute
        img.removeAttribute('loading');
        
        // If it's an API image, use the proxy
        if (img.src.startsWith('https://api.swarmada.wiki')) {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(img.src)}`;
          img.src = proxyUrl;
        }

        // Wait for image to load
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
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

  const handleShare = async () => {
    if (!isShared) {
      setNotificationMessage('Please enable sharing for this fleet first');
      setShowNotification(true);
      return;
    }

    const domain = process.env.NEXT_PUBLIC_DOMAIN || window.location.origin;
    const shareUrl = `${domain}/share/${fleetId}`;

    // Check if running on mobile/tablet
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'Star Forge Fleet',
          url: shareUrl
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          setNotificationMessage('Failed to share fleet');
          setShowNotification(true);
        }
      }
    } else {
      // Desktop behavior - copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        setNotificationMessage('Share link copied to clipboard!');
        setShowNotification(true);
      } catch (err) {
        console.error('Failed to copy link:', err);
        setNotificationMessage('Failed to copy link to clipboard');
        setShowNotification(true);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/30"
      data-export-popup="true"
    >
      <Card className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-700">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700 flex justify-between items-center">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold logo-font text-zinc-900 dark:text-white">Export Fleet</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="p-4 overflow-y-auto flex-grow">
          {user && onShareToggle && (
            <div className="flex items-center gap-2 mb-4">
              <Checkbox
                id="share-fleet"
                checked={isShared}
                onCheckedChange={onShareToggle}
              />
              <label 
                htmlFor="share-fleet" 
                className="text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Share Fleet
              </label>
            </div>
          )}
          <pre className="whitespace-pre-wrap font-mono text-sm text-zinc-900 dark:text-white">
            {text}
          </pre>
        </CardContent>
        <div className="flex justify-end gap-2 p-4 border-t border-zinc-200 dark:border-zinc-700">
          <Button 
            onClick={copyToClipboard} 
            variant="outline" 
            className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md"
          >
            <Copy className="mr-2 h-4 w-4" /> Copy Text
          </Button>
          <Button 
            onClick={exportAsImage} 
            variant="outline" 
            className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md"
          >
            <Camera className="mr-2 h-4 w-4" /> Copy as Image
          </Button>
          {user && fleetId && (
            <Button 
              onClick={handleShare} 
              variant="outline"
              disabled={!isShared}
              className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md"
            >
              <Share2 className="mr-2 h-4 w-4" /> Share
            </Button>
          )}
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

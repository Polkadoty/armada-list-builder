import { Share2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';
import { NotificationWindow } from './NotificationWindow';

interface ShareButtonProps {
  fleetId: string | undefined;
  isShared: boolean;
  onShare: () => void;
}

export function ShareButton({ fleetId, isShared, onShare }: ShareButtonProps) {
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const handleShare = async () => {
    if (!isShared) {
      onShare();
      return;
    }

    const domain = process.env.NEXT_PUBLIC_DOMAIN || window.location.origin;
    const shareUrl = `${domain}/share/${fleetId}`;

    // Check if running on mobile/tablet
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: 'Share Fleet',
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
    <>
      <Button 
        onClick={handleShare}
        variant="outline" 
        className="flex items-center gap-2"
      >
        <Share2 className="h-4 w-4" />
        {isShared ? 'Share' : 'Enable Sharing'}
      </Button>

      {showNotification && (
        <NotificationWindow
          message={notificationMessage}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
} 
import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from 'lucide-react';
import { FleetList } from './FleetList';
import { Separator } from "@/components/ui/separator";
import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Switch } from "@/components/ui/switch";
import { flushCacheAndReload } from '@/utils/dataFetcher';
import { NotificationWindow } from "@/components/NotificationWindow";

export function UserMenu() {
  const { user, error } = useUser();
  const [useLowRes, setUseLowRes] = useState(false);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);

  useEffect(() => {
    const lowResCookie = Cookies.get('useLowResImages');
    setUseLowRes(lowResCookie === 'true');
  }, []);

  const handleLowResToggle = (checked: boolean) => {
    setUseLowRes(checked);
    Cookies.set('useLowResImages', checked.toString(), { expires: 365 });
    // Flush cache to reload images
    flushCacheAndReload(() => {}, () => {}, () => {});
  };

  const handleSignOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignOutConfirmation(true);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={user?.picture || undefined} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-accent">
            <User className="h-5 w-5 text-muted-foreground" />
          </AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0">
        <div>
          {user && (
            <>
              <div className="px-3 py-3">
                <p className="text-sm font-medium leading-none">{user.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
              </div>
              <Separator />
            </>
          )}
          <div className="px-2 py-2">
            <FleetList />
          </div>
          <Separator />
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <label htmlFor="low-res-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Low Resolution Mode
              </label>
              <Switch
                id="low-res-toggle"
                checked={useLowRes}
                onCheckedChange={handleLowResToggle}
                className="custom-switch"
              />
            </div>
          </div>
          <Separator />
          <div className="px-2 py-2">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="w-full justify-start text-sm font-normal h-9"
            >
              {user ? (
                <Link href="/api/auth/logout" onClick={handleSignOutClick}>
                  Log out
                </Link>
              ) : (
                <Link href="/api/auth/login">
                  Sign in
                </Link>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>

      {showSignOutConfirmation && (
        <NotificationWindow
          title="Sign Out"
          message="Are you sure you want to sign out?"
          onClose={() => setShowSignOutConfirmation(false)}
          showConfirmButton={true}
          onConfirm={() => {
            window.location.href = "/api/auth/logout";
          }}
        />
      )}
    </Popover>
  );
}

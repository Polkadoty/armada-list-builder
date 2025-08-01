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
import { forceReloadContent } from '@/utils/contentManager';
import { NotificationWindow } from "@/components/NotificationWindow";

export function UserMenu() {
  const { user, error } = useUser();
  const [useLowRes, setUseLowRes] = useState(false);
  const [useTextOnly, setUseTextOnly] = useState(false);
  const [showSignOutConfirmation, setShowSignOutConfirmation] = useState(false);

  useEffect(() => {
    const lowResCookie = Cookies.get('useLowResImages');
    const textOnlyCookie = Cookies.get('useTextOnlyMode');
    setUseLowRes(lowResCookie === 'true');
    setUseTextOnly(textOnlyCookie === 'true');
  }, []);

  const handleLowResToggle = (checked: boolean) => {
    setUseLowRes(checked);
    Cookies.set('useLowResImages', checked.toString(), { expires: 365 });
    // Flush cache to reload images
    forceReloadContent(() => {}, () => {}, () => {});
  };

  const handleTextOnlyToggle = (checked: boolean) => {
    setUseTextOnly(checked);
    Cookies.set('useTextOnlyMode', checked.toString(), { expires: 365 });
  };

  const handleSignOutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowSignOutConfirmation(true);
  };

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="relative">
      <Popover>
        <PopoverTrigger asChild>
          <Avatar className={`cursor-pointer hover:opacity-80 transition-all duration-300 ${
            !user ? 'ring-2 ring-blue-400 ring-opacity-75 shadow-lg shadow-blue-400/50 animate-pulse' : ''
          }`}>
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
          <div className="px-3 py-2">
            <div className="flex items-center justify-between">
              <label htmlFor="text-only-toggle" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Text Only Mode
              </label>
              <Switch
                id="text-only-toggle"
                checked={useTextOnly}
                onCheckedChange={handleTextOnlyToggle}
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

      {!user && (
        <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-blue-400 whitespace-nowrap animate-bounce">
          <span className="inline-block animate-pulse font-medium">
            Don't forget to sign in!
          </span>
        </div>
      )}

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
    </div>
  );
}

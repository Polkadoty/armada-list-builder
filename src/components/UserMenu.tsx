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

export function UserMenu() {
  const { user, error, isLoading } = useUser();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={user?.picture || undefined} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-background/10 backdrop-blur-sm">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-background/60 dark:bg-gray-800/60 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg">
        {user ? (
          <div className="space-y-4 p-4">
            <div className="space-y-2">
              <h4 className="font-medium text-foreground/90">User Information</h4>
              <p className="text-foreground/60">{user.name}</p>
            </div>
            <div className="py-2 border-t border-gray-200/10 dark:border-gray-700/10">
              <FleetList />
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="w-full bg-background/40 hover:bg-background/60 transition-colors"
            >
              <Link href="/api/auth/logout">Sign Out</Link>
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="sm" 
            asChild
            className="w-full bg-background/40 hover:bg-background/60 transition-colors"
          >
            <Link href="/api/auth/login">Sign In</Link>
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}

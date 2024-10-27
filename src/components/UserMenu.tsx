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
        <Avatar className="cursor-pointer">
          <AvatarImage src={user?.picture || undefined} alt={user?.name || 'User'} />
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      </PopoverTrigger>
      <PopoverContent className="w-80 bg-white dark:bg-gray-800 backdrop-blur-md bg-opacity-90 dark:bg-opacity-90 border border-gray-200 dark:border-gray-700 shadow-lg">
        {user ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white">User Information</h4>
              <p className="text-gray-600 dark:text-gray-300">Name: {user.name}</p>
            </div>
            <FleetList />
            <Button 
              variant="outline" 
              size="sm" 
              asChild
              className="w-full"
            >
              <Link href="/api/auth/logout">Sign Out</Link>
            </Button>
          </div>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="w-full"
          >
            <Link href="/api/auth/login">Sign In</Link>
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
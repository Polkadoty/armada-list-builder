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

export function UserMenu() {
  const { user, error } = useUser();

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
          <AvatarImage src={user?.picture || undefined} alt={user?.name || 'User'} />
          <AvatarFallback className="bg-background/10 backdrop-blur-sm">
            <User className="h-5 w-5 text-foreground" />
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
          <div className="px-2 py-2">
            <Button 
              variant="ghost" 
              size="sm" 
              asChild
              className="w-full justify-start text-sm font-normal h-9"
            >
              <Link href={user ? "/api/auth/logout" : "/api/auth/login"}>
                {user ? "Log out" : "Sign in"}
              </Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

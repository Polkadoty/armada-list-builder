import { useUser } from '@auth0/nextjs-auth0/client';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from 'lucide-react';

export function UserAvatar() {
  const { user } = useUser();

  if (!user) {
    return null;
  }

  return (
    <Avatar>
      <AvatarImage src={user.picture || undefined} alt={user.name || 'User'} />
      <AvatarFallback>
        <User className="h-5 w-5" />
      </AvatarFallback>
    </Avatar>
  );
}


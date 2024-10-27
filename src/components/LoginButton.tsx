import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import Link from 'next/link';

export function LoginButton() {
  const { user, error, isLoading } = useUser();

  console.log('Auth State:', { user, error, isLoading }); // Add this for debugging

  if (isLoading) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled
        className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
      >
        Loading...
      </Button>
    );
  }

  if (error) {
    console.error('Auth Error:', error);
    return (
      <Button 
        variant="outline" 
        size="sm" 
        disabled
        className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
      >
        Error
      </Button>
    );
  }

  if (user) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        asChild
        className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
      >
        <Link href="/api/auth/logout">SIGN OUT</Link>
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      asChild
      className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
    >
      <Link href="/api/auth/login">SIGN IN</Link>
    </Button>
  );
}

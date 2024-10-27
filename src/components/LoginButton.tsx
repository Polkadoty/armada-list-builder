import { useUser } from '@auth0/nextjs-auth0/client';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function LoginButton() {
  const { user, error, isLoading } = useUser();

  console.log('Auth State:', { user, error, isLoading }); // Add this for debugging

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled>
        Loading...
      </Button>
    );
  }

  if (error) {
    console.error('Auth Error:', error);
    return (
      <Button variant="outline" size="sm" disabled>
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
      >
        <a href="/api/auth/logout">Sign Out</a>
      </Button>
    );
  }

  return (
    <Button 
      variant="outline" 
      size="sm" 
      asChild
    >
      <a href="/api/auth/login">Sign In</a>
    </Button>
  );
}

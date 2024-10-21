import { useAuth0 } from '@auth0/auth0-react';
import { Button } from "@/components/ui/button";

export const LoginButton = () => {
  const { loginWithRedirect, isAuthenticated, logout } = useAuth0();

  if (isAuthenticated) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
        onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      >
        SIGN OUT
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
      onClick={() => loginWithRedirect()}
    >
      SIGN IN
    </Button>
  );
};


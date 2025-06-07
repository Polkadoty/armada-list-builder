import { Button } from "@/components/ui/button";
import { Hammer } from "lucide-react";

export function WorkshopButton() {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      disabled
      className="bg-zinc-100/50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 backdrop-blur-md logo-font w-full justify-start cursor-not-allowed opacity-60"
    >
      <Hammer className="mr-2 h-4 w-4" />
      Workshop - Coming Soon
    </Button>
  );
} 
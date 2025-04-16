import { Button } from "@/components/ui/button";
import { Hammer } from "lucide-react";
import Link from "next/link";

export function WorkshopButton() {
  return (
    <Link href="/cardbuilder" passHref>
      <Button variant="outline" size="sm" className="bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white hover:bg-opacity-20 backdrop-blur-md logo-font w-full justify-start">
        <Hammer className="mr-2 h-4 w-4" />
        Workshop
      </Button>
    </Link>
  );
} 
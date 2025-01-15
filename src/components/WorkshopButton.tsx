import { Button } from "@/components/ui/button";
import { Hammer } from "lucide-react";
import Link from "next/link";

export function WorkshopButton() {
  return (
    <Link href="/cardbuilder" passHref>
      <Button variant="outline" size="sm" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 logo-font w-full justify-start">
        <Hammer className="mr-2 h-4 w-4" />
        Workshop
      </Button>
    </Link>
  );
} 
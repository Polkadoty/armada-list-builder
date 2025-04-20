import { Button } from "@/components/ui/button";
import { Hammer } from "lucide-react";
import Link from "next/link";

export function WorkshopButton() {
  return (
    <Link href="/cardbuilder" passHref>
      <Button variant="outline" size="sm" className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md logo-font w-full justify-start">
        <Hammer className="mr-2 h-4 w-4" />
        Workshop
      </Button>
    </Link>
  );
} 
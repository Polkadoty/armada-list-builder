import { useState, useEffect } from 'react';
import { CardBuilder } from '@/components/CardBuilder';
import { ThemeToggle } from '@/components/ThemeToggle';
import StarryBackground from '@/components/StarryBackground';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function CardBuilderPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col relative">
      <StarryBackground show={true} lightDisabled={true} />
      
      <div className="p-8 relative z-10">
        <div className="flex justify-between items-center mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              BACK
            </Button>
          </Link>
          <ThemeToggle />
        </div>

        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Card Builder</h1>
          <CardBuilder />
        </div>
      </div>
    </div>
  );
} 
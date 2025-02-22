import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { SquadronBuilder } from '@/components/cardbuilder/SquadronBuilder';
import StarryBackground from '@/components/StarryBackground';
import { useUser } from '@auth0/nextjs-auth0/client';
import { toast } from '@/hooks/use-toast';

type CardType = 'squadron' | 'ship' | 'upgrade';

export default function CardBuilder() {
  const { user } = useUser();
  const [selectedType, setSelectedType] = useState<CardType | null>(null);

  const handleBack = () => {
    setSelectedType(null);
    toast({
      title: "Content saved successfully!",
      description: "Your content has been saved and is ready to share.",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col relative">
        <StarryBackground show={true} lightDisabled={true} />
        <div className="p-8 relative z-10">
          <div className="container mx-auto">
            <h1 className="text-2xl font-bold mb-4">Workshop</h1>
            <p>Please log in to access the workshop.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative">
      <StarryBackground show={true} lightDisabled={true} />
      <div className="p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {!selectedType ? (
            <>
              <div className="mb-8">
                <Link href="/">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                  </Button>
                </Link>
              </div>
              <h1 className="text-3xl font-bold mb-8 text-center">Card Builder</h1>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card 
                  className="p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                  onClick={() => setSelectedType('squadron')}
                >
                  <h2 className="text-xl font-semibold mb-2">Squadron</h2>
                  <p className="text-gray-600">Create custom squadron cards</p>
                </Card>
                {/* Add other card types here */}
              </div>
            </>
          ) : (
            <div>
              <Button 
                variant="outline" 
                className="mb-4"
                onClick={() => setSelectedType(null)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Card Types
              </Button>
              {selectedType === 'squadron' && (
                <SquadronBuilder onBack={handleBack} />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
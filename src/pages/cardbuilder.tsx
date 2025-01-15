import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from 'next/link';
import { ArrowLeft, Plus } from 'lucide-react';
import { SquadronBuilder } from '@/components/cardbuilder/SquadronBuilder';
import StarryBackground from '@/components/StarryBackground';
import { useUser } from '@auth0/nextjs-auth0/client';

type CardType = 'ship' | 'squadron' | 'upgrade' | 'objective';

export default function CardBuilder() {
  const { user } = useUser();
  const [selectedType, setSelectedType] = useState<CardType | null>(null);

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

  const renderBuilder = () => {
    switch (selectedType) {
      case 'squadron':
        return <SquadronBuilder 
          onBack={() => setSelectedType(null)} 
          userId={user.sub as string}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <StarryBackground show={true} lightDisabled={true} />
      <div className="p-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link href="/">
              <Button variant="outline" className="text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
          </div>

          {!selectedType ? (
            <>
              <h1 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Card Builder</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card 
                  className="p-6 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md" 
                  onClick={() => setSelectedType('squadron')}
                >
                  <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Squadron</h2>
                  <p className="text-gray-600 dark:text-gray-400">Create custom squadron cards</p>
                </Card>
              </div>
            </>
          ) : (
            renderBuilder()
          )}
        </div>
      </div>
    </div>
  );
}
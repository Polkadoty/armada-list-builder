import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Filter, Printer, ArrowLeft, FileText } from 'lucide-react';

interface FleetBuilderProps {
  faction: string;
}

export default function FleetBuilder({ faction }: FleetBuilderProps) {
  const [fleetName, setFleetName] = useState('Untitled Fleet');
  const [isEditingName, setIsEditingName] = useState(false);
  const [points, setPoints] = useState(0);

  const handleNameClick = () => {
    setIsEditingName(true);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFleetName(e.target.value);
  };

  const handleNameBlur = () => {
    setIsEditingName(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          {/* Placeholder for faction logo */}
          <div className="w-8 h-8 bg-gray-300 rounded-full mr-2"></div>
          {isEditingName ? (
            <Input
              value={fleetName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className="text-xl font-bold"
              autoFocus
            />
          ) : (
            <h1 className="text-xl font-bold cursor-pointer" onClick={handleNameClick}>
              {fleetName}
            </h1>
          )}
        </div>
        <div className="text-xl font-bold">{points} points</div>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Button className="w-full justify-between" variant="outline">
            ADD SHIP <Filter size={16} />
          </Button>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardContent className="p-4">
          <Button className="w-full justify-between" variant="outline">
            ADD SQUADRON <Filter size={16} />
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2 mb-4">
        <Button variant="outline" className="w-full justify-start">ADD ASSAULT</Button>
        <Button variant="outline" className="w-full justify-start">ADD DEFENSE</Button>
        <Button variant="outline" className="w-full justify-start">ADD NAVIGATION</Button>
      </div>

      <div className="flex justify-between">
        <Button variant="outline">
          <Printer className="mr-2 h-4 w-4" /> PRINT
        </Button>
        <Button variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> BACK
        </Button>
        <Button variant="outline">
          <FileText className="mr-2 h-4 w-4" /> EXPORT TEXT
        </Button>
      </div>
    </div>
  );
}
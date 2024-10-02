/* eslint-disable @typescript-eslint/no-empty-interface */

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, /* CardContent */ } from "@/components/ui/card";
import { Filter, Printer, ArrowLeft, FileText } from 'lucide-react';


export default function FleetBuilder() {
  const [fleetName, setFleetName] = useState('Untitled Fleet');
  const [isEditingName, setIsEditingName] = useState(false);
  const [points] = useState(0);

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
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <div className="mb-2 sm:mb-0">
          {isEditingName ? (
            <Input
              value={fleetName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className="text-xl font-bold"
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-bold cursor-pointer" onClick={handleNameClick}>
              {fleetName}
            </h2>
          )}
        </div>
        <div className="text-xl font-bold">{points} points</div>
      </div>

      <Card className="mb-4">
        <Button className="w-full justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" variant="outline">
          ADD SHIP <Filter size={16} />
        </Button>
      </Card>

      <Card className="mb-4">
        <Button className="w-full justify-between bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" variant="outline">
          ADD SQUADRON <Filter size={16} />
        </Button>
      </Card>

      <div className="space-y-2 mb-4">
        <Button variant="outline" className="w-full justify-start">ADD ASSAULT</Button>
        <Button variant="outline" className="w-full justify-start">ADD DEFENSE</Button>
        <Button variant="outline" className="w-full justify-start">ADD NAVIGATION</Button>
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" className="flex-grow">
          <Printer className="mr-2 h-4 w-4" /> PRINT
        </Button>
        <Button variant="outline" className="flex-grow">
          <ArrowLeft className="mr-2 h-4 w-4" /> BACK
        </Button>
        <Button variant="outline" className="flex-grow">
          <FileText className="mr-2 h-4 w-4" /> EXPORT TEXT
        </Button>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface ShipFilterProps {
  onApplyFilter: (filter: ShipFilter) => void;
  onClose: () => void;
}

interface ShipFilter {
  minPoints: number;
  maxPoints: number;
  // Add more filter options as needed
}

export function ShipFilter({ onApplyFilter, onClose }: ShipFilterProps) {
  const [filter, setFilter] = useState<ShipFilter>({
    minPoints: 0,
    maxPoints: 1000,
  });

  const handleApplyFilter = () => {
    onApplyFilter(filter);
    onClose();
  };

  return (
    <Card className="absolute z-10 top-full left-0 mt-2">
      <CardContent className="p-4">
        <h3 className="font-bold mb-2">Filter Ships</h3>
        <div className="mb-2">
          <label className="block">Min Points:</label>
          <input
            type="number"
            value={filter.minPoints}
            onChange={(e) => setFilter({ ...filter, minPoints: parseInt(e.target.value) })}
            className="border rounded p-1"
          />
        </div>
        <div className="mb-2">
          <label className="block">Max Points:</label>
          <input
            type="number"
            value={filter.maxPoints}
            onChange={(e) => setFilter({ ...filter, maxPoints: parseInt(e.target.value) })}
            className="border rounded p-1"
          />
        </div>
        <div className="flex justify-between">
          <Button onClick={handleApplyFilter}>Apply</Button>
          <Button onClick={onClose}>Cancel</Button>
        </div>
      </CardContent>
    </Card>
  );
}
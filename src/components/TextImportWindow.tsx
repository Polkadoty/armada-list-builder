// TextImportWindow.tsx
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type FleetFormat = 'kingston' | 'afd' | 'warlords';

export function TextImportWindow({ onImport, onClose }: { onImport: (text: string, format: FleetFormat) => void; onClose: () => void }) {
  const [importText, setImportText] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<FleetFormat>("kingston");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-md shadow-lg p-6 border-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import Fleet</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Format</Label>
            <Select 
              value={selectedFormat} 
              onValueChange={(value: FleetFormat) => setSelectedFormat(value)}
            >
              <SelectTrigger className="bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kingston">Ryan Kingston Format</SelectItem>
                <SelectItem value="afd">Armada Fleet Designer</SelectItem>
                <SelectItem value="warlords">Armada Warlords</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Label className="text-gray-700 dark:text-gray-300">Fleet List</Label>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your fleet list here..."
              rows={10}
              className="resize-none bg-white/50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6 space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onImport(importText, selectedFormat);
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Import
          </Button>
        </div>
      </Card>
    </div>
  );
}

// TextImportWindow.tsx
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type FleetFormat = 'kingston' | 'afd' | 'warlords' | 'starforge';

export function TextImportWindow({ onImport, onClose }: { onImport: (text: string, format: FleetFormat) => void; onClose: () => void }) {
  const [importText, setImportText] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<FleetFormat>("starforge");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md bg-black/30">
      <Card className="w-full max-w-lg md:max-w-2xl bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md shadow-lg p-6 border border-zinc-200 dark:border-zinc-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white logo-font">Import Fleet</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300">Format</Label>
            <Select 
              value={selectedFormat} 
              onValueChange={(value: FleetFormat) => setSelectedFormat(value)}
            >
              <SelectTrigger className="bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700">
                <SelectItem value="starforge">Star Forge</SelectItem>
                <SelectItem value="kingston">Ryan Kingston</SelectItem>
                <SelectItem value="afd">Armada Fleet Designer</SelectItem>
                <SelectItem value="warlords">Armada Warlords</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex flex-col space-y-2">
            <Label className="text-zinc-700 dark:text-zinc-300">Fleet List</Label>
            <Textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste your fleet list here..."
              rows={10}
              className="resize-none bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-6 space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="bg-zinc-100/80 dark:bg-zinc-800/80 text-zinc-900 dark:text-white hover:bg-zinc-200/90 dark:hover:bg-zinc-700/90 border-zinc-200 dark:border-zinc-700 backdrop-blur-md"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onImport(importText, selectedFormat);
              onClose();
            }}
            className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100"
          >
            Import
          </Button>
        </div>
      </Card>
    </div>
  );
}

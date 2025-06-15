import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FleetNamePromptProps {
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
  action: 'save' | 'share';
}

export function FleetNamePrompt({ currentName, onConfirm, onCancel, action }: FleetNamePromptProps) {
  const [newName, setNewName] = useState(currentName === 'Untitled Fleet' ? '' : currentName);
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const trimmedName = newName.trim();
    
    if (!trimmedName) {
      setError('Fleet name cannot be empty');
      return;
    }
    
    if (trimmedName === 'Untitled Fleet') {
      setError('Please choose a different name');
      return;
    }
    
    if (trimmedName.length > 64) {
      setError('Fleet name must be 64 characters or less');
      return;
    }
    
    onConfirm(trimmedName);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/30">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-center">
            Name Your Fleet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Please give your fleet a name before {action === 'save' ? 'saving' : 'sharing'} it.
          </p>
          
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Enter fleet name..."
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError('');
              }}
              onKeyDown={handleKeyPress}
              maxLength={64}
              autoFocus
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {newName.length}/64 characters
            </p>
          </div>
          
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!newName.trim()}
            >
              {action === 'save' ? 'Save Fleet' : 'Share Fleet'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 
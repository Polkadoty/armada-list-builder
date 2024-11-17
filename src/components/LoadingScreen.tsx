import React from 'react';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";

interface LoadingScreenProps {
  progress: number;
  message: string;
}

export function LoadingScreen({ progress, message }: LoadingScreenProps) {
  const { toast } = useToast();

  React.useEffect(() => {
    toast({
      title: "Loading Data",
      description: message,
    });
  }, [message, toast]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-opacity-30 dark:bg-opacity-30">
      <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-lg">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">Loading Data</h2>
        </div>
        <div className="p-4">
          <Progress value={progress} className="w-full mb-4" />
          <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
        </div>
      </Card>
    </div>
  );
}


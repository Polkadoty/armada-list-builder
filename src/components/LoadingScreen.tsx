import React from 'react';
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-lg font-semibold mb-4">Loading Data</h2>
        <Progress value={progress} className="w-full mb-4" />
        <p className="text-sm text-gray-600 dark:text-gray-300">{message}</p>
      </div>
    </div>
  );
}


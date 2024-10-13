import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UniqueClassContextType {
  uniqueClassNames: string[];
  addUniqueClassName: (name: string) => void;
  removeUniqueClassName: (name: string) => void;
}

const UniqueClassContext = createContext<UniqueClassContextType | undefined>(undefined);

export const UniqueClassProvider = ({ children }: { children: ReactNode }) => {
  const [uniqueClassNames, setUniqueClassNames] = useState<string[]>([]);

  const addUniqueClassName = (name: string) => {
    setUniqueClassNames(prev => Array.from(new Set([...prev, name])));
  };

  const removeUniqueClassName = (name: string) => {
    setUniqueClassNames(prev => prev.filter(n => n !== name));
  };

  return (
    <UniqueClassContext.Provider value={{ uniqueClassNames, addUniqueClassName, removeUniqueClassName }}>
      {children}
    </UniqueClassContext.Provider>
  );
};

export const useUniqueClassContext = () => {
  const context = useContext(UniqueClassContext);
  if (!context) {
    throw new Error('useUniqueClassContext must be used within a UniqueClassProvider');
  }
  return context;
};
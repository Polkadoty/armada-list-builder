import React, { createContext, useContext, useState, useCallback } from 'react';

const UniqueClassContext = createContext<{
  uniqueClassNames: string[];
  addUniqueClassName: (name: string) => void;
  removeUniqueClassName: (name: string) => void;
}>({
  uniqueClassNames: [],
  addUniqueClassName: () => {},
  removeUniqueClassName: () => {},
});

export const UniqueClassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [uniqueClassNames, setUniqueClassNames] = useState<string[]>([]);

  const addUniqueClassName = useCallback((name: string) => {
    setUniqueClassNames(prev => {
      if (!prev.includes(name)) {
        return [...prev, name];
      }
      return prev;
    });
  }, []);

  const removeUniqueClassName = useCallback((name: string) => {
    setUniqueClassNames(prev => prev.filter(n => n !== name));
  }, []);

  return (
    <UniqueClassContext.Provider value={{ uniqueClassNames, addUniqueClassName, removeUniqueClassName }}>
      {children}
    </UniqueClassContext.Provider>
  );
};

export const useUniqueClassContext = () => useContext(UniqueClassContext);

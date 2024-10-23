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

  const addUniqueClassName = useCallback((className: string) => {
    setUniqueClassNames(prev => prev.includes(className) ? prev : [...prev, className]);
  }, []);

  const removeUniqueClassName = useCallback((className: string) => {
    setUniqueClassNames(prev => prev.filter(name => name !== className));
  }, []);

  return (
    <UniqueClassContext.Provider value={{ uniqueClassNames, addUniqueClassName, removeUniqueClassName }}>
      {children}
    </UniqueClassContext.Provider>
  );
};

export const useUniqueClassContext = () => useContext(UniqueClassContext);

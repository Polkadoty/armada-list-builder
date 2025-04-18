import React from 'react';
import { useTheme } from 'next-themes';

const StarryBackground: React.FC<{ show: boolean, lightDisabled?: boolean }> = ({ show, lightDisabled }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === 'dark' || lightDisabled;

  return (
    <>
      {/* Light mode background */}
      <div 
        className={`bg-absolute-cover transition-opacity duration-300 ${!isDarkMode ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: 'url(/images/nebula-lightmode.webp)',
          filter: 'contrast(1.1) brightness(1.5) blur(2px)',
          transform: 'scale(1.1)',
          transformOrigin: 'center center'
        }}
      />

      {/* Dark mode background */}
      <div 
        className={`bg-absolute-cover transition-opacity duration-300 ${isDarkMode && show ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: 'url(/images/nebula-darkmode.webp)',
          filter: 'contrast(1.1)',
          transform: 'scale(1.1)',
          transformOrigin: 'center center'
        }}
      />
    </>
  );
};

export default StarryBackground;

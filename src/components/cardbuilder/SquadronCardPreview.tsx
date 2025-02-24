import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArtworkTransform } from './ArtworkUploader';
import { replaceIconShortcodes } from '@/constants/icons';
import { ICON_MAP } from '@/constants/icons';
import { DiceDisplay } from './DiceDisplay';
import { convertArmamentToDisplay } from '@/components/cardbuilder/SquadronBuilder';

interface SquadronCardPreviewProps {
  formData: {
    faction: string;
    name: string;
    ace_name?: string;
    hull: number;
    speed: number;
    ability: string;
    armament: {
      'anti-squadron': [number, number, number];
      'anti-ship': [number, number, number];
    };
    tokens: {
      def_scatter: number;
      def_evade: number;
      def_brace: number;
    };
    artwork?: string;
    artworkTransform?: ArtworkTransform;
    points: number;
    unique: boolean;
    ace: boolean;
    nameItalics?: boolean;
    aceNameItalics?: boolean;
    nameFontSize?: number;
    aceNameFontSize?: number;
    silhouette?: string;
    silhouetteTransform?: ArtworkTransform;
  };
  exportMode?: boolean;
}



export function SquadronCardPreview({ formData, exportMode }: SquadronCardPreviewProps) {
  const [cardBase, setCardBase] = useState<string>('');
  const [uniqueOverlay, setUniqueOverlay] = useState<string>('');
  
  // Add text shift calculation
  const textShift = exportMode ? -4.9 : 0; // Shift up by 5% in export mode
  
  // Instead of iterating over Object.entries (which only gives one entry per token type),
  // build an array that repeats the token type based on its count.
  const tokensArray: string[] = [];
  Object.entries(formData.tokens).forEach(([key, count]) => {
    const tokenType = key.replace('def_', '');
    for (let i = 0; i < count; i++) {
      tokensArray.push(tokenType);
    }
  });

  // Determine the total token count for layout.
  const tokenCount = tokensArray.length;

  useEffect(() => {
    // Base image is always the faction's squadron card
    const baseImage = `cardbuilder/squadron/${formData.faction}_squadron.webp`;
    setCardBase(baseImage);
    
    // If squadron is unique, show appropriate overlay
    if (formData.unique) {
      const overlayImage = `cardbuilder/squadron/${formData.faction}_squadron-unique-${tokenCount}defense.webp`;
      setUniqueOverlay(overlayImage);
    } else {
      setUniqueOverlay('');
    }
  }, [formData.faction, formData.tokens, formData.unique, tokenCount]);

  return (
    <div className="relative w-full max-w-[400px] aspect-[2.5/3.5] bg-black/50 rounded-lg overflow-hidden">
      <div className="relative w-full h-full">
        {/* Title text */}
        <div className="absolute z-50 w-full text-center" 
             style={{ 
               top: `${2 + textShift}%`,
               fontFamily: 'Title',
               fontSize: '20pt',
               color: '#ffffff',
               textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
               letterSpacing: '1px',
               WebkitTextStroke: 'black', // Change to apply stroke color
               WebkitTextFillColor: 'white', // Make the text fill transparent
             }}>
          Star Forge Cardbuilder
        </div>

        {/* Add silhouette layer */}
        {formData.silhouette && (
          <div className="absolute bottom-[5%] left-[5%] z-30 w-[15%]">
            <Image
              src={formData.silhouette}
              alt="Squadron silhouette"
              width={100}
              height={100}
              className="w-full h-auto"
              style={{
                transform: `
                  translate(${formData.silhouetteTransform?.x || 0}px, ${formData.silhouetteTransform?.y || 0}px)
                  rotate(${formData.silhouetteTransform?.rotation || 0}deg)
                  scale(${formData.silhouetteTransform?.flipped ? -1 : 1}, 1)
                  scale(${formData.silhouetteTransform?.scale || 1})
                `,
                filter: `
                  brightness(${formData.silhouetteTransform?.brightness || 100}%)
                  contrast(${formData.silhouetteTransform?.contrast || 100}%)
                `,
                opacity: `${formData.silhouetteTransform?.opacity || 100}%`,
              }}
            />
          </div>
        )}

        {/* Artwork layer */}
        {formData.artwork && (
          <div 
            className="absolute top-0 left-0 right-0 z-0"
            style={{
              transform: `
                translate(${formData.artworkTransform?.x || 0}px, ${formData.artworkTransform?.y || 0}px)
                rotate(${formData.artworkTransform?.rotation || 0}deg)
                scale(${formData.artworkTransform?.flipped ? -1 : 1}, 1)
                scale(${formData.artworkTransform?.scale || 1})
              `,
              transformOrigin: 'top center',
            }}
          >
            <Image
              src={formData.artwork}
              alt="Card artwork"
              width={1271}
              height={614}
              className="w-full object-contain"
              style={{ height: 'auto' }}
            />
          </div>
        )}

        {/* Base card image */}
        {cardBase && (
          <div className="absolute inset-x-0 bottom-0 z-10">
            <Image
              src={cardBase}
              alt="Card base"
              width={1271}
              height={1136}
              className="w-full h-auto"
            />
            
            {/* Speed value */}
            <div className="absolute z-10" 
                 style={{ 
                   left: '17.41%',
                   top: `${17.44 + textShift}%`,
                   width: '4.196%',
                   height: '12.177%',
                   fontFamily: 'RevengerLiteBB',
                   fontSize: '30pt',
                   color: '#fde505',
                   textAlign: 'center',
                 }}>
              {formData.speed}
            </div>

            {/* Hull value */}
            <div className="absolute z-10" 
                 style={{ 
                   left: '40.58%',
                   top: `${17.44 + textShift}%`,
                   width: '4.196%',
                   height: '12.177%',
                   fontFamily: 'RevengerLiteBB',
                   fontSize: '30pt',
                   color: '#ffffff',
                   textAlign: 'center',
                 }}>
              {formData.hull}
            </div>

            {/* Squadron Name */}
            <div className="absolute z-10" 
                 style={{ 
                   left: '55%',
                   top: `${2.62 + textShift}%`,
                   width: '388.85px',
                   height: '48px',
                   fontFamily: 'Title',
                   fontSize: `${formData.nameFontSize || 22}pt`,
                   fontStyle: formData.nameItalics ? 'italic' : 'normal',
                   color: '#000000',
                   textAlign: 'center',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   transform: 'translateX(-50%)',
                 }}>
              {formData.name}
            </div>

            {/* Ability Text */}
            <div className="absolute z-10" 
                 style={{ 
                   left: '8.68%',
                   top: `${40.37 + textShift}%`,
                   width: '83.09%',
                   height: '44.15%',
                   fontFamily: 'Optima',
                   fontSize: '12pt',
                   color: '#000000',
                   textAlign: 'left',
                   overflowY: 'auto',
                   padding: '1px',  // Reduced padding for denser spacing
                   whiteSpace: 'pre-wrap',  // Preserve line breaks
                 }}>
              {formData.ability.split(/(\*\*[^*]+\*\*|\*[^*]+\*|:[\w-]+:|`[^`]+`|\n)/g).map((segment, index) => {
                if (segment === '\n') {
                  return <br key={index} />;
                } else if (segment.match(/^:[\w-]+:$/)) {
                  // Handle standalone icons
                  const iconCode = segment.slice(1, -1);
                  return (
                    <span key={index} className="icon" style={{ fontFamily: 'icons' }}>
                      {ICON_MAP[iconCode as keyof typeof ICON_MAP] || segment}
                    </span>
                  );
                } else if (segment.startsWith('**') && segment.endsWith('**')) {
                  // Handle bold text, but process any icons within it
                  const innerText = segment.slice(2, -2);
                  return (
                    <span key={index} style={{ fontFamily: 'FighterKeyword', fontSize: '14pt' }}>
                      {innerText.split(/(:[\w-]+:)/g).map((part, i) => {
                        if (part.match(/^:[\w-]+:$/)) {
                          const iconCode = part.slice(1, -1);
                          return (
                            <span key={i} className="icon" style={{ fontFamily: 'icons' }}>
                              {ICON_MAP[iconCode as keyof typeof ICON_MAP] || part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </span>
                  );
                } else if (segment.startsWith('*') && segment.endsWith('*')) {
                  // Handle italic text, but process any icons within it
                  const innerText = segment.slice(1, -1);
                  return (
                    <span key={index} style={{ fontFamily: 'Optima', fontStyle: 'italic' }}>
                      {innerText.split(/(:[\w-]+:)/g).map((part, i) => {
                        if (part.match(/^:[\w-]+:$/)) {
                          const iconCode = part.slice(1, -1);
                          return (
                            <span key={i} className="icon" style={{ fontFamily: 'icons', fontStyle: 'normal' }}>
                              {ICON_MAP[iconCode as keyof typeof ICON_MAP] || part}
                            </span>
                          );
                        }
                        return part;
                      })}
                    </span>
                  );
                }
                return <span key={index}>{segment}</span>;
              })}
            </div>

            {/* Points value */}
            <div className="absolute z-10" 
                 style={{ 
                   right: '3.31%',     // ((1271 - 1141.52) / 1271) * 100
                   bottom: tokenCount === 0 ? `${-7.7 - 0.5*textShift}%` : `${-7.7 - 0.5*textShift}%`,
                   width: '44.2px',
                   height: '61.48px',
                   fontFamily: 'RevengerLightBB',
                   fontSize: '13pt',
                   color: '#000000',
                   textAlign: 'center',
                 }}>
              {formData.points}
            </div>
          </div>
        )}
        
        {/* Defense Tokens */}
        {tokensArray.map((tokenType, index) => {
          const left = tokenCount === 1 ? 50 : (index === 0 ? 43.75 : 56.25);
          const baseBottom = (tokenCount === 2 && (index === 0 || index === 1)) ? -0.7 : -1;
          const bottom = `${baseBottom - 0.5*textShift}%`;
          
          return (
            <div
              key={`${tokenType}-${index}`}
              className="absolute z-50"
              style={{
                left: `${left}%`,
                bottom: bottom,
                fontFamily: 'icons',
                fontSize: '20pt',
                color: '#ffffff',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textShadow: '0 0 2px rgba(255, 255, 255, 0.5)',
                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.4))',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
              }}
            >
              <span>{ICON_MAP[tokenType as keyof typeof ICON_MAP]}</span>
            </div>
          );
        })}
        
        {/* Unique overlay */}
        {uniqueOverlay && (
          <div className="absolute z-20" 
               style={{ 
                 width: '82.45%',
                 left: '11.96%',
                 top: tokenCount === 2 ? '31.33%' : '31.48%',
               }}>
            <Image
              src={uniqueOverlay}
              alt="Unique overlay"
              width={1048}
              height={1222}
              className="w-full h-auto"
            />

              {/* Ace Name (only shown if ace_name exists) */}
              {formData.ace_name && (formData.unique || formData.ace) && (
              <div className="absolute z-30" 
                   style={{ 
                    left: '50%',
                    top: formData.unique && tokenCount === 0 ? `${-12 + 8*textShift}%` : tokenCount === 0 ? `${-11 + 8*textShift}%` : tokenCount === 1 ? `${-1 + .75*textShift}%` : `${-1 + .75*textShift}%`,
                    width: '388.85px',
                    height: '48px',
                    fontFamily: 'Title',
                    fontSize: `${formData.aceNameFontSize || 20}pt`,
                    fontStyle: formData.aceNameItalics ? 'italic' : 'normal',
                    color: '#000000',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: 'translateX(-50%)',
                   }}>
                    {formData.ace_name && formData.unique && (
                      <>
                        <span style={{ fontFamily: 'icons', marginRight: '4px', fontSize: '15.11pt' }}>
                          {replaceIconShortcodes(':unique:')}
                        </span>
                        {formData.ace_name}
                      </>
                    )}
                    {formData.ace_name && !formData.unique && formData.ace_name}
              </div>
            )}
          </div>
        )}

        {/* Anti-squadron dice */}
        <div className="absolute z-10" 
             style={{ 
               left: `${convertArmamentToDisplay(formData.armament['anti-squadron']).total === 4 ? 65 : 65.75}%`,
               top: `${53.2 + 0.33*textShift}%`,
               width: '8.196%',
               height: '6.177%',
               transform: 'translate(-50%, -50%)'
             }}>
          <DiceDisplay 
            count={convertArmamentToDisplay(formData.armament['anti-squadron']).total}
            colors={convertArmamentToDisplay(formData.armament['anti-squadron']).colors}
          />
        </div>

        {/* Anti-ship dice */}
        <div className="absolute z-10" 
             style={{ 
               left: `${convertArmamentToDisplay(formData.armament['anti-ship']).total === 4 ? 88 : 88.75}%`,
               top: `${53.2 + 0.33*textShift}%`,
               width: '8.196%',
               height: '6.177%',
               transform: 'translate(-50%, -50%)'
             }}>
          <DiceDisplay 
            count={convertArmamentToDisplay(formData.armament['anti-ship']).total}
            colors={convertArmamentToDisplay(formData.armament['anti-ship']).colors}
          />
        </div>
      </div>
    </div>
  );
} 
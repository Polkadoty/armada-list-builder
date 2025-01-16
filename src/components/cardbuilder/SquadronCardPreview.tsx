import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ArtworkTransform } from './ArtworkUploader';

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
  };
}

export function SquadronCardPreview({ formData }: SquadronCardPreviewProps) {
  const [cardBase, setCardBase] = useState<string>('');
  const [uniqueOverlay, setUniqueOverlay] = useState<string>('');

  useEffect(() => {
    // Base image is always the faction's squadron card
    const baseImage = `cardbuilder/squadron/${formData.faction}_squadron.webp`;
    setCardBase(baseImage);

    // Determine if we need a unique overlay based on defense tokens
    const tokenCount = Object.values(formData.tokens).filter(v => v > 0).length;
    if (tokenCount > 0) {
      const overlayImage = `cardbuilder/squadron/${formData.faction}_squadron-unique-${tokenCount}defense.webp`;
      setUniqueOverlay(overlayImage);
    } else {
      setUniqueOverlay('');
    }
  }, [formData.faction, formData.tokens]);

  return (
    <div className="relative w-full max-w-[400px] aspect-[2.5/3.5] bg-black/50 rounded-lg overflow-hidden">
      <div className="relative w-full h-full">
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

        {/* Base card image - now with higher z-index */}
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
                   top: '17.44%',
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
                   top: '17.44%',
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
                   top: '2.62%',
                   width: '388.85px',
                   height: '48px',
                   fontFamily: 'Title',
                   fontSize: '18pt',
                   color: '#000000',
                   textAlign: 'center',
                   display: 'flex',
                   alignItems: 'center',
                   justifyContent: 'center',
                   transform: 'translateX(-50%)',
                 }}>
              {formData.name}
            </div>

            {/* Ace Name (only shown if ace_name exists)
            {formData.ace_name && (
              <div className="absolute z-10" 
                   style={{ 
                     left: '15.34%',    // Same as squadron name
                     top: '13.62%',     // About 9% below squadron name relative to base image
                     width: '388.85px', // Same as squadron name
                     height: '98.23px', // Same as squadron name
                     fontFamily: 'Title',
                     fontSize: '13.11pt',
                     fontStyle: 'italic',
                     color: '#000000',
                     textAlign: 'center',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                   }}>
                {formData.ace_name}
              </div>
            )} */}

            {/* Ability Text */}
            <div className="absolute z-10" 
                 style={{ 
                   left: '8.68%',
                   top: '40.37%',
                   width: '83.09%',
                   height: '44.15%',
                   fontFamily: 'Optima',
                   fontSize: '10pt',
                   color: '#000000',
                   textAlign: 'left',
                   overflowY: 'auto',
                   padding: '2px',
                   whiteSpace: 'pre-wrap',  // Preserve line breaks
                 }}>
              {formData.ability.split(/(\*\*.*?\*\*|\`.*?\`|\*.*?\*|\n)/).map((segment, index) => {
                if (segment === '\n') {
                  return <br key={index} />;
                } else if (segment.startsWith('**') && segment.endsWith('**')) {
                  return (
                    <span key={index} style={{ fontFamily: 'FighterKeyword' }}>
                      {segment.slice(2, -2)}
                    </span>
                  );
                } else if (segment.startsWith('`') && segment.endsWith('`')) {
                  const iconChar = segment.slice(1, -1);
                  const iconVar = `--icon-${iconChar}`;
                  return (
                    <span key={index} style={{ fontFamily: 'icons' }}>
                      {getComputedStyle(document.documentElement).getPropertyValue(iconVar).trim() || iconChar}
                    </span>
                  );
                } else if (segment.startsWith('*') && segment.endsWith('*')) {
                  return (
                    <span key={index} style={{ fontFamily: 'Optima', fontStyle: 'italic' }}>
                      {segment.slice(1, -1)}
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
                   bottom: '-7.7%',    // ((1750 - 1657.94) / 1750) * 100
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
        
        {/* Unique overlay - highest z-index */}
        {uniqueOverlay && (
          <div className="absolute bottom-0 z-20" 
               style={{ 
                 width: '82.45%',
                 left: '12%',
               }}>
            <Image
              src={uniqueOverlay}
              alt="Unique overlay"
              width={1048}
              height={1222}
              className="w-full h-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
} 
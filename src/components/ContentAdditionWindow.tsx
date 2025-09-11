import React, { useEffect, useState } from 'react';
import { ImageModal } from './ImageModal';
import { Eye } from 'lucide-react';
import { useRouter } from 'next/router';
import { OptimizedImage } from './OptimizedImage';

interface Card {
  id: string;
  name: string;
  faction: string;
  cardimage: string;
  unique: boolean;
  'ace-name': string;
  size?: string;
  type?: string;
  // ...other fields as needed
}

interface ContentAdditionWindowProps {
  contentType: string;
  onClose: () => void;
  showNonSWFactions?: boolean;
}

const DATA_TYPES = ['Ships', 'Squadrons', 'Upgrades', 'Objectives'];

// Helper to capitalize each word and special-case Legacy/Nexus/LegacyBeta
const formatFactionName = (faction: string): string => {
  if (faction === 'legacy') return 'Legacy';
  if (faction === 'nexus') return 'Nexus';
  if (faction === 'legends') return 'Legends';
  if (faction === 'legacyBeta') return 'Legacy Beta';
  if (faction === 'naboo') return 'Battle for Naboo';
  
  return faction
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

function getDisplayName(card: Card) {
  // For squadrons, use ace-name if present, else name
  let name = card['ace-name'] && card['ace-name'].trim() !== '' ? card['ace-name'] : card.name;
  // Add bullet if unique
  if (card.unique) {
    name = '• ' + name;
  }
  return name;
}

const ContentAdditionWindow: React.FC<ContentAdditionWindowProps> = ({ contentType, onClose, showNonSWFactions = false }) => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalImage, setModalImage] = useState<{src: string, alt: string} | null>(null);
  const [isTouchMoving, setIsTouchMoving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const allCards: Card[] = [];
    DATA_TYPES.forEach(type => {
      const key = `${contentType}${type}`; // e.g., nexusShips
      const raw = localStorage.getItem(key);
      if (raw && raw.trim().length > 0) {
        try {
          const data = JSON.parse(raw);
          /* eslint-disable @typescript-eslint/no-explicit-any */
          let items: any[] = [];
          if (type === 'Ships' && data.ships) {
            items = Object.values(data.ships).flatMap((chassis: any) =>
              chassis.models ? Object.values(chassis.models).map((model: any) => ({ ...model, size: chassis.size })) : []
            );
          } else if (type === 'Squadrons' && data.squadrons) {
            items = Object.values(data.squadrons);
          } else if (type === 'Upgrades' && data.upgrades) {
            items = Object.values(data.upgrades);
          } else if (type === 'Objectives' && data.objectives) {
            items = Object.values(data.objectives);
          }
          // Normalize to Card shape, including fields needed for display
          items.forEach(item => {
            if (item.cardimage && item.faction && item.name) {
              allCards.push({
                id: item.id || item.name,
                name: item.name,
                faction: item.faction,
                cardimage: item.cardimage,
                unique: item.unique,
                'ace-name': item['ace-name'] || '',
                size: item.size,
                type,
              });
            }
          });
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // Ignore parse errors for this key
        }
      }
    });
    // Filter out Cylon, Colonial, UNSC, Covenant (and combos) unless showNonSWFactions is true
    const forbiddenFactions = [
      'cylon', 'colonial', 'unsc', 'covenant',
    ];
    let filteredCards = allCards;
    if (!showNonSWFactions) {
      filteredCards = allCards.filter(card => {
        const faction = typeof card.faction === 'string' ? card.faction.toLowerCase() : '';
        // Exclude if any forbidden faction appears as a substring (comma, dash, space, or alone)
        return !forbiddenFactions.some(ff =>
          faction === ff ||
          faction.startsWith(ff + '-') ||
          faction.endsWith('-' + ff) ||
          faction.includes('-' + ff + '-') ||
          faction.includes(',' + ff + ',') ||
          faction.includes(' ' + ff + ' ') ||
          faction.includes(ff + ',') ||
          faction.includes(',' + ff) ||
          faction.includes(ff + ' ') ||
          faction.includes(' ' + ff) ||
          faction === ff.replace(/\s+/g, '') // catch e.g. 'unsc' in 'unsc,covenant'
        );
      });
    }
    setCards(filteredCards);
    setLoading(false);
  }, [contentType, showNonSWFactions]);

  // Group cards by faction
  const cardsByFaction = cards.reduce<Record<string, Card[]>>((acc, card) => {
    if (!acc[card.faction]) acc[card.faction] = [];
    acc[card.faction].push(card);
    return acc;
  }, {});

  // Render logic
  // If on home page, use special centering logic
  const isHome = router.pathname === '/';
  return (
    isHome ? (
      <div className="fixed inset-0 z-[9999] bg-black bg-opacity-80 flex items-center justify-center" style={{ pointerEvents: 'auto', width: '100vw', height: '100vh' }}>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-[98vw] h-[98vh] min-w-[200px] min-h-[120px] overflow-y-auto transition-all duration-200 flex flex-col" style={{ maxWidth: '98vw', maxHeight: '98vh', padding: 0 }}>
          {/* Sticky header for title and close button, always at the very top */}
          <div className="sticky top-0 z-20 bg-white dark:bg-zinc-900 rounded-t-lg flex items-center justify-between px-4 sm:px-10 pt-2 pb-2 sm:pt-6 sm:pb-4" style={{ borderBottom: '1px solid #e5e7eb', minWidth: 0 }}>
            <h2 className="font-bold" style={{ fontSize: 'clamp(1.1rem, 2vw, 2rem)', minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word', flex: 1, paddingRight: '1rem' }}>
              Content Window - {formatFactionName(contentType)}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-3xl ml-4"
              aria-label="Close"
              style={{ minWidth: '2.2rem', minHeight: '2.2rem', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          {/* <p className="mb-4">Showing content for: <span className="font-mono font-semibold">{contentType}</span></p> */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6">
          {loading ? (
            <div className="text-center text-zinc-500">Loading...</div>
          ) : cards.length === 0 ? (
            <div className="text-center text-zinc-500">No content found for this category.</div>
          ) : (
            <div>
              {Object.entries(cardsByFaction).map(([faction, factionCards]) => (
                <div key={faction} className="mb-12 pb-4">
                  <h3 className="text-xl font-semibold mb-2">{formatFactionName(faction)}</h3>
                  <div
                    className="content-grid"
                    style={{ maxWidth: '100%' }}
                  >
                    {factionCards.map((card, i) => {
                      const key = (card.id ? card.id : `${card.name}-${card.faction}-${i}`) + '-' + Math.random().toString(36).substr(2, 6);
                      let width = 250, height = 350, aspect = 'aspect-[8.75/15]', colSpan = '';
                      const className = 'object-cover object-center w-full h-full rounded shadow border border-zinc-700';
                      if (card.type === 'Ships' && (card.size === 'huge' || card.size === '280-huge' || card.size === 'wide-huge')) {
                        width = 900; height = 630; aspect = 'aspect-[5/4]';
                        colSpan = 'col-span-3';
                      } else if (card.type === 'Squadrons' || card.type === 'Upgrades') {
                        width = 250; height = 350; aspect = 'aspect-[2.5/3.5]';
                      }
                      return (
                        <div
                          key={key}
                          className={`flex flex-col items-center relative group ${aspect} ${colSpan}`}
                          onClick={() => {
                            if (!isTouchMoving) setModalImage({ src: card.cardimage, alt: card.name });
                          }}
                          onTouchStart={() => setIsTouchMoving(false)}
                          onTouchMove={() => setIsTouchMoving(true)}
                          style={{ cursor: 'pointer' }}
                        >
                          <OptimizedImage
                            src={card.cardimage}
                            alt={card.name}
                            width={width}
                            height={height}
                            className={className}
                          />
                          <div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded"
                            style={{ pointerEvents: 'none' }}
                          >
                            <Eye className="text-white w-10 h-10 drop-shadow-lg" />
                          </div>
                          <span 
                            className="mt-1 text-xs text-center"
                            style={{ 
                              fontSize: 'clamp(0.85rem, 1.5vw, 1.2rem)', 
                              fontWeight: 600, 
                              textAlign: 'center', 
                              whiteSpace: 'normal', 
                              wordBreak: 'break-word', 
                              maxWidth: '95%',
                              display: 'block',
                            }}>
                            {getDisplayName(card)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
        {modalImage && (
          <ImageModal
            src={modalImage.src}
            alt={modalImage.alt}
            onClose={() => setModalImage(null)}
          />
        )}
      </div>
    ) : (
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] bg-black bg-opacity-80" style={{ pointerEvents: 'auto', width: '100vw', height: '100vh' }}>
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg w-[98vw] h-[98vh] min-w-[200px] min-h-[120px] overflow-y-auto transition-all duration-200 flex flex-col" style={{ maxWidth: '98vw', maxHeight: '98vh', padding: 0 }}>
          {/* Sticky header for title and close button, always at the very top */}
          <div className="sticky top-0 z-20 bg-white dark:bg-zinc-900 rounded-t-lg flex items-center justify-between px-4 sm:px-10 pt-2 pb-2 sm:pt-6 sm:pb-4" style={{ borderBottom: '1px solid #e5e7eb', minWidth: 0 }}>
            <h2 className="font-bold" style={{ fontSize: 'clamp(1.1rem, 2vw, 2rem)', minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word', flex: 1, paddingRight: '1rem' }}>
              Content Window - {formatFactionName(contentType)}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-3xl ml-4"
              aria-label="Close"
              style={{ minWidth: '2.2rem', minHeight: '2.2rem', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
          {/* <p className="mb-4">Showing content for: <span className="font-mono font-semibold">{contentType}</span></p> */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-6">
          {loading ? (
            <div className="text-center text-zinc-500">Loading...</div>
          ) : cards.length === 0 ? (
            <div className="text-center text-zinc-500">No content found for this category.</div>
          ) : (
            <div>
              {Object.entries(cardsByFaction).map(([faction, factionCards]) => (
                <div key={faction} className="mb-12 pb-4">
                  <h3 className="text-xl font-semibold mb-2">{formatFactionName(faction)}</h3>
                  <div
                    className="content-grid"
                    style={{ maxWidth: '100%' }}
                  >
                    {factionCards.map((card, i) => {
                      const key = (card.id ? card.id : `${card.name}-${card.faction}-${i}`) + '-' + Math.random().toString(36).substr(2, 6);
                      let width = 250, height = 350, aspect = 'aspect-[8.75/15]', colSpan = '';
                      const className = 'object-cover object-center w-full h-full rounded shadow border border-zinc-700';
                      if (card.type === 'Ships' && (card.size === 'huge' || card.size === '280-huge' || card.size === 'wide-huge')) {
                        width = 900; height = 630; aspect = 'aspect-[5/4]';
                        colSpan = 'col-span-3';
                      } else if (card.type === 'Squadrons' || card.type === 'Upgrades') {
                        width = 250; height = 350; aspect = 'aspect-[2.5/3.5]';
                      }
                      return (
                        <div
                          key={key}
                          className={`flex flex-col items-center relative group ${aspect} ${colSpan}`}
                          onClick={() => {
                            if (!isTouchMoving) setModalImage({ src: card.cardimage, alt: card.name });
                          }}
                          onTouchStart={() => setIsTouchMoving(false)}
                          onTouchMove={() => setIsTouchMoving(true)}
                          style={{ cursor: 'pointer' }}
                        >
                          <OptimizedImage
                            src={card.cardimage}
                            alt={card.name}
                            width={width}
                            height={height}
                            className={className}
                          />
                          <div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded"
                            style={{ pointerEvents: 'none' }}
                          >
                            <Eye className="text-white w-10 h-10 drop-shadow-lg" />
                          </div>
                          <span 
                            className="mt-1 text-xs text-center"
                            style={{ 
                              fontSize: 'clamp(0.85rem, 1.5vw, 1.2rem)', 
                              fontWeight: 600, 
                              textAlign: 'center', 
                              whiteSpace: 'normal', 
                              wordBreak: 'break-word', 
                              maxWidth: '95%',
                              display: 'block',
                            }}>
                            {getDisplayName(card)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
        {modalImage && (
          <ImageModal
            src={modalImage.src}
            alt={modalImage.alt}
            onClose={() => setModalImage(null)}
          />
        )}
      </div>
    )
  );
};

export default ContentAdditionWindow; 
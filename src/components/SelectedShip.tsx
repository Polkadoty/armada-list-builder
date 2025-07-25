import React, { useState, useRef, memo, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSpring, animated } from 'react-spring';
import UpgradeIconsToolbar from './UpgradeIconsToolbar';
import { Ship, Upgrade } from "./FleetBuilder";
import { Copy, Trash2, ArrowLeftRight, X, Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import Cookies from 'js-cookie';

interface SelectedShipProps {
  ship: Ship;
  onRemove: (id: string) => void;
  onUpgradeClick: (shipId: string, upgrade: string, index: number) => void;
  onCopy: (ship: Ship) => void;
  handleRemoveUpgrade: (shipId: string, upgradeType: string, index: number) => void;
  disabledUpgrades: string[];
  filledSlots: Record<string, number[]>;
  hasCommander: boolean;
  traits: string[];
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  greyUpgrades: string[];
}

function SelectedShipComponent({ ship, onRemove, onUpgradeClick, onCopy, handleRemoveUpgrade, disabledUpgrades, filledSlots, hasCommander, onMoveUp, onMoveDown, isFirst, isLast, greyUpgrades }: SelectedShipProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const [useTextOnly, setUseTextOnly] = useState(false);
  const [showTextDetails, setShowTextDetails] = useState(false);
  
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(false);

  const SWIPE_THRESHOLD = 100;
  const ANGLE_THRESHOLD = 30; // Degrees
  const [showImageModal, setShowImageModal] = useState(false);

  const isDummy = ship.name.includes('Dummy');

  useEffect(() => {
    const textOnlyCookie = Cookies.get('useTextOnlyMode');
    setUseTextOnly(textOnlyCookie === 'true');
  }, []); 

  // Poll for text-only mode cookie changes and update state
  useEffect(() => {
    let prevTextOnly = Cookies.get('useTextOnlyMode');
    const interval = setInterval(() => {
      const currentTextOnly = Cookies.get('useTextOnlyMode');
      if (currentTextOnly !== prevTextOnly) {
        setUseTextOnly(currentTextOnly === 'true');
        prevTextOnly = currentTextOnly;
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShipTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleShipTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.current;
    const deltaY = currentY - startY.current;

    if (!isHorizontalSwipe.current) {
      const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
      isHorizontalSwipe.current = angle < ANGLE_THRESHOLD || angle > (180 - ANGLE_THRESHOLD);
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault();
      e.stopPropagation();
      api.start({ x: deltaX, immediate: true });
    } else if (Math.abs(deltaY) > 10) {
      isDragging.current = false;
      api.start({ x: 0, immediate: false });
    }
  };

  const handleShipTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (isHorizontalSwipe.current) {
      const currentX = x.get();
      if (currentX < -SWIPE_THRESHOLD) {
        onRemove(ship.id);
      } else if (currentX > SWIPE_THRESHOLD) {
        onCopy(ship);
      }
    }
    api.start({ x: 0, immediate: false });
    isHorizontalSwipe.current = false;
  };



  const totalShipPoints = ship.points + ship.assignedUpgrades.reduce((total, upgrade) => total + upgrade.points, 0);

  const handleUpgradeRemove = (upgradeType: string, upgradeIndex: number) => {
    handleRemoveUpgrade(ship.id, upgradeType, upgradeIndex);
  };

  const handleImageTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    // Only open modal if not swiping
    if (isDragging.current) {
      setShowImageModal(true);
    }
  };

  return (
    <div className="relative overflow-hidden mb-2">
      <animated.div style={{ x }}>
        <Card className="relative">
          <div
            onTouchStart={handleShipTouchStart}
            onTouchMove={handleShipTouchMove}
            onTouchEnd={handleShipTouchEnd}
          >
            <CardContent className="p-0">
              {!isDummy && (
                <>
                  {useTextOnly ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
                      <div className="flex justify-end mb-2">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{ship.size} ship</span>
                      </div>
                      
                      {/* Collapsible detailed information */}
                      {showTextDetails && (
                        <div className="space-y-3 text-sm">
                          {ship.traits && ship.traits.length > 0 && (
                            <div>
                              <strong className="text-blue-600 dark:text-blue-400">Traits:</strong> {ship.traits.map(trait => trait.charAt(0).toUpperCase() + trait.slice(1)).join(', ')}
                            </div>
                          )}
                          
                          <div>
                            <strong className="text-green-600 dark:text-green-400">Stats:</strong>
                            <div className="ml-2 grid grid-cols-2 gap-2 mt-1">
                              <span>Command: {ship.tokens?.command || 0}</span>
                              <span>Squadron: {ship.tokens?.squadron || 0}</span>
                              <span>Engineering: {ship.tokens?.engineering || 0}</span>
                              <span>Hull: {ship.tokens?.hull || 0}</span>
                            </div>
                          </div>

                          {ship.tokens?.flak && (
                            <div>
                              <strong className="text-red-600 dark:text-red-400">Flak:</strong> {ship.tokens.flak}
                            </div>
                          )}

                          {ship.tokens && Object.keys(ship.tokens).some(key => key.startsWith('def_')) && (
                            <div>
                              <strong className="text-purple-600 dark:text-purple-400">Defense Tokens:</strong>
                              <div className="ml-2">
                                {Object.entries(ship.tokens)
                                  .filter(([key, value]) => key.startsWith('def_') && value > 0)
                                  .map(([token, count]) => (
                                    <span key={token} className="mr-3 capitalize">
                                      {token.replace('def_', '').replace('_', ' ')}: {count}
                                    </span>
                                  ))
                                }
                              </div>
                            </div>
                          )}

                          {ship.speed && (
                            <div>
                              <strong className="text-indigo-600 dark:text-indigo-400">Speed Chart:</strong>
                              <div className="ml-2">
                                {Object.entries(ship.speed).map(([click, speeds]) => (
                                  <div key={click}>Click {click}: {speeds.join('-')}</div>
                                ))}
                              </div>
                            </div>
                          )}

                          {ship.armament && (
                            <div>
                              <strong className="text-orange-600 dark:text-orange-400">Hull Zones:</strong>
                              <div className="ml-2 space-y-1">
                                {Object.entries(ship.armament)
                                  .filter(([zone, dice]) => {
                                    // Show standard zones always, hide non-standard zones if they have no dice
                                    const standardZones = ['asa', 'front', 'rear', 'left', 'right'];
                                    const isStandardZone = standardZones.includes(zone.toLowerCase());
                                    const hasDice = dice.some(count => count > 0);
                                    return isStandardZone || hasDice;
                                  })
                                  .map(([zone, dice]) => (
                                    <div key={zone} className="flex justify-between">
                                      <span className="capitalize">{zone}:</span>
                                      <span>
                                        {dice.map((count, i) => {
                                          const colors = ['Red', 'Blue', 'Black'];
                                          return count > 0 ? `${count}${colors[i]}` : '';
                                        }).filter(Boolean).join(' ') || 'None'}
                                      </span>
                                    </div>
                                  ))
                                }
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative w-full aspect-[8/3] overflow-hidden group rounded-t-lg bg-transparent">
                      <OptimizedImage 
                        src={ship.cardimage} 
                        alt={ship.name}
                        width={800}
                        height={300}
                        className="object-cover object-top scale-[104%] absolute top-0 left-0 w-full h-full bg-transparent"
                        onClick={() => setShowImageModal(true)}
                      />
                      <button
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Only open modal if not swiping
                          if (!isDragging.current) {
                            setShowImageModal(true);
                          }
                        }}
                        onTouchEnd={handleImageTouch}
                      >
                        <Eye size={24} className="text-white cursor-pointer" />
                      </button>
                    </div>
                  )}
                  <div className="p-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="title-font text-2xl flex items-center">
                        {ship.unique && <span className="mr-1 text-yellow-500">●</span>}
                        {ship.name}
                      </span>
                      {/* Text details toggle and view card button - only visible in text-only mode */}
                      {useTextOnly && (
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowImageModal(true)}
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          >
                            <Eye size={14} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowTextDetails(!showTextDetails)}
                          >
                            {showTextDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>{totalShipPoints} points</span>
                      <div className="flex items-center gap-1">
                        <div className="flex flex-row sm:flex-row items-center gap-1 mr-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onMoveUp(ship.id)} 
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                            disabled={isFirst}
                          >
                            <ChevronLeft className="h-4 w-4 rotate-90 sm:rotate-0" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onMoveDown(ship.id)} 
                            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1"
                            disabled={isLast}
                          >
                            <ChevronRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                          </Button>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onCopy(ship)} 
                          className={`text-blue-500 p-1 ${ship.unique ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={ship.unique}
                        >
                          <Copy size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onRemove(ship.id)} className="text-red-500 p-1">
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {isDummy && (
                <div className="p-4">
                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onCopy(ship)} 
                        className={`text-blue-500 p-1 ${ship.unique ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={ship.unique}
                      >
                        <Copy size={16} />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onRemove(ship.id)} className="text-red-500 p-1">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </div>
          
          <>
            <UpgradeIconsToolbar
              upgrades={ship.availableUpgrades}
              onUpgradeClick={(upgrade, index) => onUpgradeClick(ship.id, upgrade, index)}
              assignedUpgrades={ship.assignedUpgrades}
              disabledUpgrades={disabledUpgrades}
              filledSlots={filledSlots}
              hasCommander={hasCommander}
              traits={ship.traits || []}
              greyUpgrades={greyUpgrades}
            />
            <div className="p-2 space-y-2">
              {ship.assignedUpgrades.map((upgrade, index) => (
                <SwipeableUpgrade
                  key={`${upgrade.type}-${upgrade.slotIndex ?? index}-${upgrade.name}-${upgrade.id}`}
                  upgrade={upgrade}
                  onSwipe={(direction) => {
                    if (direction === 'left') {
                      handleUpgradeRemove(upgrade.type, upgrade.slotIndex ?? index);
                    } else if (direction === 'right') {
                      onUpgradeClick(ship.id, upgrade.type, upgrade.slotIndex ?? index);
                    }
                  }}
                  onSwap={() => onUpgradeClick(ship.id, upgrade.type, upgrade.slotIndex ?? index)}
                  onRemove={() => handleUpgradeRemove(upgrade.type, upgrade.slotIndex ?? index)}
                />
              ))}
            </div>
          </>
        </Card>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-16 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          <Copy size={20} />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-16 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          <Trash2 size={20} />
        </div>
      </animated.div>
      {showImageModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative">
            <OptimizedImage
              src={ship.cardimage}
              alt={ship.name}
              width={420}
              height={630}
              className="rounded-lg w-auto h-[420px] sm:h-[630px] lg:h-[840px] scale-[1.03]"
            />
            <button
              className="absolute top-2 right-2 rounded-full p-1"
              onClick={() => setShowImageModal(false)}
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Create a custom comparison function that only triggers re-renders when necessary
function arePropsEqual(prevProps: SelectedShipProps, nextProps: SelectedShipProps) {
  // Always re-render if the ship ID changes
  if (prevProps.ship.id !== nextProps.ship.id) return false;
  
  // Re-render if the ship's data has changed (points, upgrades, etc.)
  if (prevProps.ship.points !== nextProps.ship.points) return false;
  if (prevProps.ship.name !== nextProps.ship.name) return false;
  if (prevProps.ship.cardimage !== nextProps.ship.cardimage) return false;
  
  // Check if assigned upgrades changed
  const prevUpgrades = prevProps.ship.assignedUpgrades;
  const nextUpgrades = nextProps.ship.assignedUpgrades;
  if (prevUpgrades.length !== nextUpgrades.length) return false;
  
  // Deep comparison of each upgrade
  for (let i = 0; i < prevUpgrades.length; i++) {
    const prevUpgrade = prevUpgrades[i];
    const nextUpgrade = nextUpgrades[i];
    
    // Compare key properties that would affect the UI
    if (prevUpgrade.id !== nextUpgrade.id) return false;
    if (prevUpgrade.name !== nextUpgrade.name) return false;
    if (prevUpgrade.points !== nextUpgrade.points) return false;
    if (prevUpgrade.cardimage !== nextUpgrade.cardimage) return false;
    if (prevUpgrade.type !== nextUpgrade.type) return false;
    if (prevUpgrade.slotIndex !== nextUpgrade.slotIndex) return false;
  }
  
  // Compare disabled upgrades arrays
  if (prevProps.disabledUpgrades?.length !== nextProps.disabledUpgrades?.length) return false;
  if (prevProps.disabledUpgrades?.some((upgrade, index) => upgrade !== nextProps.disabledUpgrades?.[index])) return false;
  
  // Compare grey upgrades arrays
  if (prevProps.greyUpgrades?.length !== nextProps.greyUpgrades?.length) return false;
  if (prevProps.greyUpgrades?.some((upgrade, index) => upgrade !== nextProps.greyUpgrades?.[index])) return false;
  
  // Check position-related props
  if (prevProps.isFirst !== nextProps.isFirst || prevProps.isLast !== nextProps.isLast) return false;
  
  // Deep comparison of filled slots
  const prevSlotKeys = Object.keys(prevProps.filledSlots || {});
  const nextSlotKeys = Object.keys(nextProps.filledSlots || {});
  if (prevSlotKeys.length !== nextSlotKeys.length) return false;
  
  // Return true if nothing changed (skip re-render)
  return true;
}

// Export the memoized version of the component
export const SelectedShip = memo(SelectedShipComponent, arePropsEqual);

interface SwipeableUpgradeProps {
  upgrade: Upgrade;
  onSwipe: (direction: 'left' | 'right') => void;
  onSwap: () => void;
  onRemove: () => void;
}

function SwipeableUpgrade({ upgrade, onSwipe, onSwap, onRemove }: SwipeableUpgradeProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const SWIPE_THRESHOLD = 100;
  const ANGLE_THRESHOLD = 30; // Degrees

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isHorizontalSwipe.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX.current;
    const deltaY = currentY - startY.current;

    if (!isHorizontalSwipe.current) {
      const angle = Math.abs(Math.atan2(deltaY, deltaX) * 180 / Math.PI);
      isHorizontalSwipe.current = angle < ANGLE_THRESHOLD || angle > (180 - ANGLE_THRESHOLD);
    }

    if (isHorizontalSwipe.current) {
      e.preventDefault();
      e.stopPropagation();
      api.start({ x: deltaX, immediate: true });
    } else if (Math.abs(deltaY) > 10) {
      isDragging.current = false;
      api.start({ x: 0, immediate: false });
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (isHorizontalSwipe.current) {
      const currentX = x.get();
      if (Math.abs(currentX) > SWIPE_THRESHOLD) {
        onSwipe(currentX < 0 ? 'left' : 'right');
      }
    }
    api.start({ x: 0, immediate: false });
    isHorizontalSwipe.current = false;
  };

  return (
    <div className="relative overflow-hidden mb-2">
      <animated.div
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative"
      >
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded p-2">
          <div className="flex items-center min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Image
                src={`/icons/${upgrade.type}.svg`}
                alt={upgrade.type}
                width={24}
                height={24}
                className="dark:invert"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageModal(true)}
                className="p-1"
              >
                <Eye size={16} />
              </Button>
            </div>
            <span className="title-font text-xl flex items-center ml-2">
              {upgrade.unique && <span className="mr-1 text-yellow-500">●</span>}
              {upgrade.name}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
          <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSwap} 
                className={`p-1 ${
                  upgrade.restrictions?.enable_upgrades?.some(upgrade => upgrade.trim() !== '') 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-blue-500'
                }`}
                disabled={upgrade.restrictions?.enable_upgrades?.some(upgrade => upgrade.trim() !== '')}
              >
                <ArrowLeftRight size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={onRemove} className="text-red-500 p-1">
                <X size={16} />
              </Button>
            </div>
            <span>{upgrade.points}<span className="hidden sm:inline"> pts</span></span>
          </div>
        </div>
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-12 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          <ArrowLeftRight size={20} />
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-12 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          <X size={20} />
        </div>
      </animated.div>
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative">
            <OptimizedImage
              src={upgrade.cardimage}
              alt={upgrade.name}
              width={300}
              height={420}
              className="rounded-lg sm:w-[450px] sm:h-[630px] lg:w-[600px] lg:h-[840px] scale-[1.03]"
            />
            <button
              className="absolute top-2 right-2 rounded-full p-1"
              onClick={() => setShowImageModal(false)}
            >
              <X size={20} className="text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}




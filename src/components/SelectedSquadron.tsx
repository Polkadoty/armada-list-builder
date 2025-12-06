import React, { useRef, useState, useEffect} from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useSpring, animated } from 'react-spring';
import { Squadron } from './FleetBuilder';
import { Plus, Minus, ArrowLeftRight, Trash2, Eye, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { OptimizedImage } from './OptimizedImage';
import Image from 'next/image';
import Cookies from 'js-cookie';

// Add this line at the top of the file
/** @jsxImportSource react */

interface SelectedSquadronProps {
  squadron: Squadron;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onSwapSquadron: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  isFirst: boolean;
  isLast: boolean;
  selectedSquadrons: Squadron[];
  gamemode?: string; // Add gamemode prop for Fighter Group detection
  onUpgradeClick?: (squadronId: string, upgradeType: string) => void;
  handleRemoveUpgrade?: (squadronId: string, upgradeType: string) => void;
}

export function SelectedSquadron({ squadron, onRemove, onIncrement, onDecrement, onSwapSquadron, onMoveUp, onMoveDown, isFirst, isLast, selectedSquadrons, gamemode, onUpgradeClick, handleRemoveUpgrade }: SelectedSquadronProps) {
  const [{ x }, api] = useSpring(() => ({ x: 0 }));
  const [useTextOnly, setUseTextOnly] = useState(false);
  const [showTextDetails, setShowTextDetails] = useState(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontalSwipe = useRef(false);
  const [showImageModal, setShowImageModal] = useState(false);

  const SWIPE_THRESHOLD = 100;
  const ANGLE_THRESHOLD = 30; // Degrees

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
      if (currentX < -SWIPE_THRESHOLD) {
        // Swipe left - remove/decrement
        if (squadron.count === 1) {
          onRemove(squadron.id);
        } else {
          onDecrement(squadron.id);
        }
      } else if (currentX > SWIPE_THRESHOLD) {
        // Swipe right - increment or swap
        if (squadron.unique && (!squadron.unique_limit || squadron.unique_limit <= 1)) {
          onSwapSquadron(squadron.id);
        } else {
          onIncrement(squadron.id);
        }
      }
    }
    api.start({ x: 0, immediate: false });
    isHorizontalSwipe.current = false;
  };

  const handleImageTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    // Only open modal if not swiping
    if (isDragging.current) {
      setShowImageModal(true);
    }
  };

  const shouldShowIncrementButtons = () => {
    // Show for non-unique squadrons (generic squadrons can always be incremented)
    if (!squadron.unique) {
      return true;
    }
    
    // Show for unique squadrons in Fighter Group mode
    if (gamemode === "Fighter Group") {
      return true;
    }
    
    // Show for unique squadrons with unique_limit > 1 (they can create new copies)
    if (squadron.unique && squadron.unique_limit && squadron.unique_limit > 1) {
      return true;
    }
    
    // Hide for regular unique squadrons (traditional unique behavior)
    return false;
  };

  const getCurrentSquadronTypeCount = () => {
    return selectedSquadrons.filter(s => s.name === squadron.name).reduce((acc, s) => acc + s.count, 0);
  };

  const canIncrement = () => {
    // Non-unique squadrons have no practical limit
    if (!squadron.unique) {
      return true;
    }
    
    // Unique squadrons respect their unique_limit (default to 1 if not specified)
    return getCurrentSquadronTypeCount() < (squadron.unique_limit || 1);
  };

  const count = squadron.count;
  const totalPoints = squadron.points * count;

  return (
    <div className="relative overflow-hidden mb-4">
      <animated.div
        style={{ x }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card>
          <CardContent className="p-0"> {/* Removed padding */}
            {useTextOnly ? (
              <div className="flex flex-col">
                {/* Squadron info at top in text-only mode */}
                <div className="p-2">
                  <div className="title-font text-xl flex items-center">
                    {squadron.unique && <span className="mr-1 text-yellow-500">●</span>}
                    {count > 1 ? `(${count}) ` : ''}
                    {squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
                    {squadron.unique && (
                      <Button variant="ghost" size="sm" onClick={() => onSwapSquadron(squadron.id)} className="text-blue-500 p-1 ml-1">
                        <ArrowLeftRight size={16} />
                      </Button>
                    )}
                    {/* Text details toggle and view card button - only visible in text-only mode */}
                    <div className="ml-auto flex items-center gap-1">
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
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      <div className="text-sm sm:text-base">
                        {totalPoints} {!squadron.unique ? 'pts' : 'points'}
                      </div>
                      {shouldShowIncrementButtons() && (
                        <>
                          <Button variant="ghost" size="sm" onClick={() => onDecrement(squadron.id)} className="text-red-500 p-1">
                            <Minus size={16} />
                          </Button>
                          <span>{count}</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onIncrement(squadron.id)} 
                            className="text-blue-500 p-1"
                            disabled={!canIncrement()}
                          >
                            <Plus size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="flex flex-row sm:flex-row items-center gap-1 mr-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onMoveUp(squadron.id)} 
                          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                          disabled={isFirst}
                        >
                          <ChevronLeft className="h-4 w-4 rotate-90 sm:rotate-0" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onMoveDown(squadron.id)} 
                          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                          disabled={isLast}
                        >
                          <ChevronRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                        </Button>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => onRemove(squadron.id)} className="text-red-500 p-1">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Collapsible text details */}
                {showTextDetails && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 border-t">
                    <div className="space-y-2 text-xs">
                      <div>
                        <strong className="text-blue-600 dark:text-blue-400">Type:</strong> {squadron.squadron_type || 'Fighter'}
                      </div>
                      
                      <div>
                        <strong className="text-green-600 dark:text-green-400">Stats:</strong>
                        <div className="ml-1">
                          Speed: {squadron.speed} | Hull: {squadron.hull}
                        </div>
                      </div>

                      {squadron.tokens && Object.keys(squadron.tokens).length > 0 && (
                        <div>
                          <strong className="text-purple-600 dark:text-purple-400">Defense:</strong>
                          <div className="ml-1">
                            {Object.entries(squadron.tokens)
                              .filter(([, count]) => count > 0)
                              .map(([token, count]) => (
                                <span key={token} className="mr-2 capitalize">
                                  {token.replace('def_', '').replace('_', ' ')}: {count}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {squadron.armament && (
                        <div>
                          <strong className="text-red-600 dark:text-red-400">Anti-Squadron:</strong>
                          <div className="ml-1">
                            {Object.entries(squadron.armament).map(([type, dice]) => (
                              <div key={type} className="capitalize">
                                {type}: {dice.map((count, i) => {
                                  const colors = ['Red', 'Blue', 'Black'];
                                  return count > 0 ? `${count}${colors[i]}` : '';
                                }).filter(Boolean).join(' ') || 'None'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {squadron.keywords && squadron.keywords.length > 0 && (
                        <div>
                          <strong className="text-indigo-600 dark:text-indigo-400">Keywords:</strong>
                          <div className="ml-1 text-xs">
                            {squadron.keywords.map(keyword => keyword.charAt(0).toUpperCase() + keyword.slice(1)).join(', ')}
                          </div>
                        </div>
                      )}

                      {squadron.abilities && Object.keys(squadron.abilities).length > 0 && (
                        <div>
                          <strong className="text-yellow-600 dark:text-yellow-400">Abilities:</strong>
                          <div className="ml-1 text-xs">
                            {Object.entries(squadron.abilities)
                              .filter(([, value]) => value !== 0 && value !== false)
                              .map(([key, value]) => (
                                <div key={key} className={squadron.unique ? "italic" : ""}>
                                  {typeof value === 'boolean' ? 
                                    key.charAt(0).toUpperCase() + key.slice(1) : 
                                    `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`
                                  }
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-2/5 aspect-[3.75/2] relative overflow-hidden group rounded-l-lg bg-transparent">
                  <OptimizedImage 
                    src={squadron.cardimage} 
                    alt={squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
                    width={250}
                    height={350}
                    className="object-cover object-top scale-[103%] rounded-l-lg absolute top-0 left-0"
                    onClick={() => setShowImageModal(true)}
                  />
                  <button
                    className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDragging.current) {
                        setShowImageModal(true);
                      }
                    }}
                    onTouchEnd={handleImageTouch}
                  >
                    <Eye size={16} className="text-white" />
                  </button>
                </div>
                <div className="flex-grow p-2">

                <div className="title-font text-xl flex items-center">
                  {squadron.unique && <span className="mr-1 text-yellow-500">●</span>}
                  {count > 1 ? `(${count}) ` : ''}
                  {squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
                  {squadron.unique && (
                    <Button variant="ghost" size="sm" onClick={() => onSwapSquadron(squadron.id)} className="text-blue-500 p-1 ml-1">
                      <ArrowLeftRight size={16} />
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <div className="text-sm sm:text-base">
                      {totalPoints} {!squadron.unique ? 'pts' : 'points'}
                    </div>
                    {shouldShowIncrementButtons() && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => onDecrement(squadron.id)} className="text-red-500 p-1">
                          <Minus size={16} />
                        </Button>
                        <span>{count}</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onIncrement(squadron.id)} 
                          className="text-blue-500 p-1"
                          disabled={!canIncrement()}
                        >
                          <Plus size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex flex-row sm:flex-row items-center gap-1 mr-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onMoveUp(squadron.id)} 
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                        disabled={isFirst}
                      >
                        <ChevronLeft className="h-4 w-4 rotate-90 sm:rotate-0" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onMoveDown(squadron.id)} 
                        className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 p-1"
                        disabled={isLast}
                      >
                        <ChevronRight className="h-4 w-4 rotate-90 sm:rotate-0" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onRemove(squadron.id)} className="text-red-500 p-1">
                      <Trash2 size={16} />
                    </Button>
                  </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Fighter Group upgrade toolbar for leaders - only show on aces */}
        {gamemode === "Fighter Group" && squadron.ace && onUpgradeClick && (() => {
          const hasLeaderInFleet = selectedSquadrons.some(s => s.assignedUpgrades?.some(u => u.type === "leader"));
          const thisSquadronHasLeader = squadron.assignedUpgrades?.some(u => u.type === "leader");
          const isDisabled = hasLeaderInFleet && !thisSquadronHasLeader;
          
          return (
            <div 
              className="bg-white dark:bg-zinc-900 p-2 flex flex-wrap justify-left backdrop-blur-md bg-opacity-30 dark:bg-opacity-30"
              onClick={(e) => e.stopPropagation()}
            >
              <Button
                variant="ghost"
                size="icon"
                className={`m-1 ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={{
                  width: '32px',
                  height: '32px',
                  padding: '4px',
                  minWidth: '32px',
                  flexGrow: 0,
                  flexShrink: 0,
                }}
                onClick={() => !isDisabled && onUpgradeClick(squadron.id, "leader")}
                disabled={isDisabled}
              >
                <Image
                  src="/icons/leader.svg"
                  alt="leader"
                  width={32}
                  height={40}
                  className={`dark:invert ${isDisabled ? 'opacity-50' : ''}`}
                />
              </Button>
            </div>
          );
        })()}
        
        {/* Show assigned leader upgrades for aces */}
        {gamemode === "Fighter Group" && squadron.ace && squadron.assignedUpgrades && squadron.assignedUpgrades.filter(u => u.type === "leader").length > 0 && (
          <div className="p-2 space-y-2">
            {squadron.assignedUpgrades.filter(u => u.type === "leader").map((upgrade, index) => (
              <div key={`leader-${index}`} className="flex items-center justify-between bg-secondary rounded p-2">
                <div className="flex items-center min-w-0">
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Image
                      src="/icons/leader.svg"
                      alt="leader"
                      width={24}
                      height={24}
                      className="dark:invert"
                    />
                  </div>
                  <span className="title-font text-xl flex items-center ml-2">
                    {upgrade.unique && <span className="mr-1 text-yellow-500">●</span>}
                    {upgrade.name}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  {handleRemoveUpgrade && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveUpgrade(squadron.id, "leader")} 
                      className="text-red-500 p-1"
                    >
                      <X size={16} />
                    </Button>
                  )}
                  <span>{upgrade.points}<span className="hidden sm:inline"> pts</span></span>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-16 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
          {squadron.unique && (!squadron.unique_limit || squadron.unique_limit <= 1) ? 
            <ArrowLeftRight size={20} className="text-blue-500" /> : 
            <Plus size={20} className="text-blue-500" />
          }
        </div>
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-16 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
          {squadron.count === 1 ? <Trash2 size={20} className="text-red-500" /> : <Minus size={20} className="text-red-500" />}
        </div>
      </animated.div>
      {showImageModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" onClick={() => setShowImageModal(false)}>
          <div className="relative">
            <OptimizedImage
              src={squadron.cardimage}
              alt={squadron.unique && squadron['ace-name'] ? squadron['ace-name'] : squadron.name}
              width={250}
              height={350}
              className="rounded-lg w-[250px] h-[350px] sm:w-[450px] sm:h-[630px] lg:w-[600px] lg:h-[840px] scale-[1.03]"
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
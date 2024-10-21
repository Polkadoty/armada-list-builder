import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { useSpring, animated } from 'react-spring';
import { ObjectiveModel } from './ObjectiveSelector';
import { X, ArrowLeftRight } from 'lucide-react';

interface SwipeableObjectiveProps {
    type: 'Assault' | 'Defense' | 'Navigation';
    selectedObjective: ObjectiveModel | null;
    onRemove: () => void;
    onOpen: () => void;
    color: string;
}

export function SwipeableObjective({ type, selectedObjective, onRemove, onOpen, color }: SwipeableObjectiveProps) {
    const [{ x }, api] = useSpring(() => ({ x: 0 }));
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startY = useRef(0);
    const isHorizontalSwipe = useRef(false);

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
            api.start({ x: deltaX, immediate: true });
        }
    };

    const handleTouchEnd = () => {
        isDragging.current = false;
        if (isHorizontalSwipe.current) {
            const currentX = x.get();
            if (currentX < -SWIPE_THRESHOLD) {
                onRemove();
            } else if (currentX > SWIPE_THRESHOLD) {
                onOpen();
            }
        }
        api.start({ x: 0, immediate: false });
        isHorizontalSwipe.current = false;
    };

    return (
        <div className="relative overflow-hidden w-full">
            <animated.div
                style={{ x }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="relative"
            >
                <Button
                    variant="outline"
                    className="w-full justify-start transition-colors"
                    onClick={onOpen}
                >
                    <div className="flex justify-between items-center w-full">
                        <div className="flex items-center font-bold">
                            <div style={{ width: '16px', height: '16px', backgroundColor: color, marginRight: '8px' }}></div>
                            {selectedObjective ? selectedObjective.name : `Add ${type}`}
                        </div>
                        {selectedObjective && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </Button>
                <div className="absolute left-0 top-0 bottom-0 flex items-center justify-center w-16 text-blue-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(-100%)' }}>
                    <ArrowLeftRight size={20} />
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-16 text-red-500 bg-gray-800 bg-opacity-75" style={{ transform: 'translateX(100%)' }}>
                    <X size={20} />
                </div>
            </animated.div>
        </div>
    );
}

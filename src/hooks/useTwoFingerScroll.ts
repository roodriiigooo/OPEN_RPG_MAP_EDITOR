import { useEffect, useRef } from 'react';

export const useTwoFingerScroll = (enabled: boolean = true) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const lastTouchY = useRef<number | null>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !enabled) return;

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                // Two fingers: Scroll
                const touchY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
                
                if (lastTouchY.current !== null) {
                    const deltaY = lastTouchY.current - touchY;
                    el.scrollTop += deltaY * 2.0; // Faster scroll for better feel
                }
                
                lastTouchY.current = touchY;
                
                // Block native behavior strictly for 2 fingers
                if (e.cancelable) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            } else {
                lastTouchY.current = null;
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 2) {
                lastTouchY.current = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            }
        };

        const handleTouchEnd = () => {
            lastTouchY.current = null;
        };

        // Use capture: true to ensure we see the events before children block them
        el.addEventListener('touchstart', handleTouchStart, { passive: true, capture: true });
        el.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true });
        el.addEventListener('touchend', handleTouchEnd, { capture: true });

        return () => {
            el.removeEventListener('touchstart', handleTouchStart, { capture: true });
            el.removeEventListener('touchmove', handleTouchMove, { capture: true });
            el.removeEventListener('touchend', handleTouchEnd, { capture: true });
        };
    }, [enabled]);

    return scrollRef;
};

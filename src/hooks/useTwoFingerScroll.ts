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
                    el.scrollTop += deltaY;
                }
                
                lastTouchY.current = touchY;
                
                // Prevent default scrolling and zooming
                if (e.cancelable) e.preventDefault();
            } else if (e.touches.length === 1) {
                // Reset on single touch
                lastTouchY.current = null;
            }
        };

        const handleTouchEnd = () => {
            lastTouchY.current = null;
        };

        el.addEventListener('touchmove', handleTouchMove, { passive: false });
        el.addEventListener('touchend', handleTouchEnd);

        return () => {
            el.removeEventListener('touchmove', handleTouchMove);
            el.removeEventListener('touchend', handleTouchEnd);
        };
    }, [enabled]);

    return scrollRef;
};

import React, { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/useEditorStore';
import { useAssetStore } from '../../store/useAssetStore';
import { Flame, Square, Circle, Triangle, Pentagon } from 'lucide-react';

export const DragFollower: React.FC = () => {
    const activeStamp = useEditorStore(s => s.activeStamp);
    const customAssets = useAssetStore(s => s.customAssets);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
            const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
            setPos({ x: clientX, y: clientY });
        };

        const handleDragStart = () => setIsVisible(true);
        const handleDragEnd = () => setIsVisible(false);

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('touchstart', handleMove);
        window.addEventListener('touchmove', handleMove);
        window.addEventListener('dragstart', handleDragStart);
        window.addEventListener('dragend', handleDragEnd);
        window.addEventListener('drop', handleDragEnd);

        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchstart', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('dragstart', handleDragStart);
            window.removeEventListener('dragend', handleDragEnd);
            window.removeEventListener('drop', handleDragEnd);
        };
    }, []);

    if (!activeStamp || !isVisible) return null;

    const renderPreview = () => {
        if (activeStamp.type === 'custom' && activeStamp.customAssetId) {
            const asset = customAssets.find(a => a.id === activeStamp.customAssetId);
            if (asset) return <img src={asset.thumbnailUrl || asset.previewUrl} className="w-12 h-12 object-contain" />;
        }
        
        switch (activeStamp.type) {
            case 'light': return <Flame size={32} className="text-amber-400" />;
            case 'square': return <Square size={32} className="text-muted" />;
            case 'circle': return <Circle size={32} className="text-muted" />;
            case 'triangle': return <Triangle size={32} className="text-muted" />;
            case 'pentagon': return <Pentagon size={32} className="text-muted" />;
            default: return null;
        }
    };

    return (
        <div 
            className="fixed pointer-events-none z-[9999] transition-transform duration-[40ms] ease-out"
            style={{ 
                left: pos.x, 
                top: pos.y, 
                transform: 'translate(-50%, -50%)',
                opacity: 0.8
            }}
        >
            <div className="p-2 bg-panel/80 border border-orange-500/50 rounded-xl shadow-2xl backdrop-blur-sm">
                {renderPreview()}
            </div>
        </div>
    );
};

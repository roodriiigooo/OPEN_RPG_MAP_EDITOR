import { 
    NW, N, NE, W, E, SW, S, SE, 
    BLOB_MASKS 
} from './tiling';

/**
 * Utility to programmatically convert a 5x3 tileset image into a 47-tile blob atlas.
 * This can be used for batch processing without UI interaction.
 */
export const convert5x3ToBlob = async (sourceFile: File): Promise<{ blob: Blob, tileSize: number }> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = URL.createObjectURL(sourceFile);
        
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            const tw = img.naturalWidth / 5;
            const th = img.naturalHeight / 3;
            const qs = tw / 2;

            canvas.width = tw * 6;
            canvas.height = th * 8;
            ctx.imageSmoothingEnabled = false;

            const getSourceTile = (tx: number, ty: number) => ({ x: tx * tw, y: ty * th });

            const getTileForQ = (mask: number, subPos: 'TL' | 'TR' | 'BL' | 'BR') => {
                const getQ = (sx: number, sy: number, qPos: 'TL' | 'TR' | 'BL' | 'BR') => ({
                    sx, sy, 
                    sqx: (qPos === 'TR' || qPos === 'BR') ? qs : 0,
                    sqy: (qPos === 'BL' || qPos === 'BR') ? qs : 0,
                });

                if (mask === 0) return getQ(3, 2, subPos); 
                
                if (subPos === 'TL') {
                    const hasN = mask & N, hasW = mask & W, hasNW = mask & NW;
                    if (!hasN && !hasW) return getQ(0, 0, 'TL');
                    if (hasN && !hasW) return getQ(0, 1, 'TL');
                    if (!hasN && hasW) return getQ(1, 0, 'TL');
                    if (hasN && hasW && !hasNW) return getQ(4, 1, 'TL');
                    return getQ(1, 1, 'TL');
                }
                if (subPos === 'TR') {
                    const hasN = mask & N, hasE = mask & E, hasNE = mask & NE;
                    if (!hasN && !hasE) return getQ(2, 0, 'TR');
                    if (hasN && !hasE) return getQ(2, 1, 'TR');
                    if (!hasN && hasE) return getQ(1, 0, 'TR');
                    if (hasN && hasE && !hasNE) return getQ(3, 1, 'TR');
                    return getQ(1, 1, 'TR');
                }
                if (subPos === 'BL') {
                    const hasS = mask & S, hasW = mask & W, hasSW = mask & SW;
                    if (!hasS && !hasW) return getQ(0, 2, 'BL');
                    if (hasS && !hasW) return getQ(0, 1, 'BL');
                    if (!hasS && hasW) return getQ(1, 2, 'BL');
                    if (hasS && hasW && !hasSW) return getQ(4, 0, 'BL');
                    return getQ(1, 1, 'BL');
                }
                if (subPos === 'BR') {
                    const hasS = mask & S, hasE = mask & E, hasSE = mask & SE;
                    if (!hasS && !hasE) return getQ(2, 2, 'BR');
                    if (hasS && !hasE) return getQ(2, 1, 'BR');
                    if (!hasS && hasE) return getQ(1, 2, 'BR');
                    if (hasS && hasE && !hasSE) return getQ(3, 0, 'BR');
                    return getQ(1, 1, 'BR');
                }
                return getQ(1, 1, subPos);
            };

            BLOB_MASKS.forEach((mask, i) => {
                const tx = i % 6;
                const ty = Math.floor(i / 6);
                const dx = tx * tw;
                const dy = ty * th;

                ['TL', 'TR', 'BL', 'BR'].forEach((qPos: any) => {
                    const { sx, sy, sqx, sqy } = getTileForQ(mask, qPos);
                    const src = getSourceTile(sx, sy);
                    let dx_q = qPos === 'TR' || qPos === 'BR' ? qs : 0;
                    let dy_q = qPos === 'BL' || qPos === 'BR' ? qs : 0;
                    ctx.drawImage(img, src.x + sqx, src.y + sqy, qs, qs, dx + dx_q, dy + dy_q, qs, qs);
                });
            });

            canvas.toBlob(blob => {
                URL.revokeObjectURL(img.src);
                if (blob) resolve({ blob, tileSize: tw });
                else reject(new Error("Canvas toBlob failed"));
            }, 'image/png');
        };

        img.onerror = () => {
            URL.revokeObjectURL(img.src);
            reject(new Error("Failed to load image"));
        };
    });
};

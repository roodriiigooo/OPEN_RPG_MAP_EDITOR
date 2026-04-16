import { useEffect } from 'react';
import { db, CustomFont } from '../db/projectDB';
import { useTextStore } from '../store/useTextStore';

export const useCustomFonts = () => {
  const { setCustomFontFamilies } = useTextStore();

  const loadFont = async (font: CustomFont) => {
    try {
      const arrayBuffer = await font.blob.arrayBuffer();
      const fontFace = new FontFace(font.family, arrayBuffer);
      const loadedFace = await fontFace.load();
      document.fonts.add(loadedFace);
      return true;
    } catch (err) {
      console.error(`Error loading custom font ${font.family}:`, err);
      return false;
    }
  };

  const loadAllCustomFonts = async () => {
    const fonts = await db.customFonts.toArray();
    const families: string[] = [];
    
    for (const font of fonts) {
      const success = await loadFont(font);
      if (success) {
        families.push(font.family);
      }
    }
    
    setCustomFontFamilies(families);
  };

  useEffect(() => {
    loadAllCustomFonts();
  }, []);

  const importFont = async (file: File) => {
    // 1. Validate file
    if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
      throw new Error("Invalid font file. Please use .ttf, .otf, .woff, or .woff2");
    }

    // 2. Extract and normalize family name
    // We remove special characters and extra spaces to get a clean family name
    const family = file.name
      .replace(/\.[^/.]+$/, "") // Remove extension
      .replace(/[-_]/g, " ")    // Replace hyphens/underscores with spaces
      .replace(/[^a-zA-Z0-9 ]/g, "") // Remove other special chars
      .replace(/\s+/g, " ")     // Collapse multiple spaces
      .trim();
    
    if (!family) throw new Error("Could not determine a valid font family name from the file name.");

    // 3. Check against System Fonts to avoid confusion
    const systemFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia', 'Trebuchet MS',
      'Alternity', 'Breathe Fire', 'Britannian', 'Dragnel', 'Dragonfly', 'Dragonwick', 
      'Eyvindr', 'High Drowic', 'Magna Veritas', 'Runewood', 'The Wild Breath of Zelda', 'Vecna'
    ];
    
    if (systemFonts.some(f => f.toLowerCase() === family.toLowerCase())) {
      throw new Error(`"${family}" is a system font and cannot be overwritten.`);
    }

    // 4. Check for duplicates by family name in Custom Fonts
    // We use a normalized comparison (no spaces, lowercase) for maximum safety
    const normalizedNew = family.toLowerCase().replace(/\s+/g, "");
    const existingFonts = await db.customFonts.toArray();
    const isDuplicate = existingFonts.some(f => 
      f.family.toLowerCase().replace(/\s+/g, "") === normalizedNew
    );

    if (isDuplicate) {
      throw new Error(`Font family "${family}" is already installed.`);
    }
    
    // 5. Save to DB
    const id = crypto.randomUUID();
    const customFont: CustomFont = {
      id,
      name: file.name,
      family,
      blob: file,
      fileName: file.name
    };

    await db.customFonts.add(customFont);

    // 6. Load into browser
    const success = await loadFont(customFont);
    if (success) {
      useTextStore.getState().addCustomFontFamily(family);
      return family;
    }
    throw new Error("Failed to load font into browser.");
  };

  return { importFont };
};

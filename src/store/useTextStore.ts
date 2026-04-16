import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TextAlign = 'left' | 'center' | 'right';

interface TextSettings {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  isBold: boolean;
  isItalic: boolean;
  align: TextAlign;
}

interface TextStore extends TextSettings {
  customFontFamilies: string[];
  setText: (text: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setCustomFontFamilies: (families: string[]) => void;
  addCustomFontFamily: (family: string) => void;
  setColor: (color: string) => void;
  setIsBold: (isBold: boolean) => void;
  setIsItalic: (isItalic: boolean) => void;
  setAlign: (align: TextAlign) => void;
  setSettings: (settings: Partial<TextSettings>) => void;
}

export const useTextStore = create<TextStore>()(
  persist(
    (set) => ({
      text: 'New Text',
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      isBold: false,
      isItalic: false,
      align: 'left',
      customFontFamilies: [],

      setText: (text) => set({ text }),
      setFontSize: (fontSize) => set({ fontSize }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      setCustomFontFamilies: (customFontFamilies) => set({ customFontFamilies }),
      addCustomFontFamily: (family) => set((state) => ({ 
        customFontFamilies: state.customFontFamilies.includes(family) 
          ? state.customFontFamilies 
          : [...state.customFontFamilies, family] 
      })),
      setColor: (color) => set({ color }),
      setIsBold: (isBold) => set({ isBold }),
      setIsItalic: (isItalic) => set({ isItalic }),
      setAlign: (align) => set({ align }),
      setSettings: (settings) => set((state) => ({ ...state, ...settings })),
    }),
    {
      name: 'openrpg-text-settings',
      partialize: (state) => {
        const { customFontFamilies, ...rest } = state;
        return rest;
      }
    }
  )
);

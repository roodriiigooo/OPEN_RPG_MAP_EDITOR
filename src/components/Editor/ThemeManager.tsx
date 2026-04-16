import React, { useEffect } from 'react';
import { useEditorStore, EditorTheme } from '../../store/useEditorStore';

const themePalettes: Record<EditorTheme, Record<string, string>> = {
  dark: {
    '--bg-editor': '#050505', 
    '--bg-panel': '#121212',  
    '--bg-sidebar': '#0a0a0a',
    '--text-main': '#f5f5f5',
    '--text-muted': '#a0a0a0',
    '--accent': '#f97316', 
    '--border': '#262626',
  },
  light: {
    '--bg-editor': '#f8fafc', 
    '--bg-panel': '#f1f5f9', 
    '--bg-sidebar': '#ffffff',
    '--text-main': '#0f172a',
    '--text-muted': '#475569',
    '--accent': '#2563eb',
    '--border': '#cbd5e1',
  },
  dracula: {
    '--bg-editor': '#282a36',
    '--bg-panel': '#21222c',
    '--bg-sidebar': '#191a21',
    '--text-main': '#f8f8f2',
    '--text-muted': '#6272a4',
    '--accent': '#bd93f9',
    '--border': '#44475a',
  },
  comic: {
    '--bg-editor': '#fdf6e3',
    '--bg-panel': '#ffde00',
    '--bg-sidebar': '#ffde00',
    '--text-main': '#000000',
    '--text-muted': '#222222',
    '--accent': '#000000',
    '--border': '#000000',
  },
  'high-contrast': {
    '--bg-editor': '#ffffff',
    '--bg-panel': '#ffffff',
    '--bg-sidebar': '#ffffff',
    '--text-main': '#000000',
    '--text-muted': '#000000',
    '--accent': '#0000ff',
    '--border': '#000000',
  }
};

export const ThemeManager: React.FC = () => {
  const theme = useEditorStore(state => state.theme);

  useEffect(() => {
    const palette = themePalettes[theme];
    const root = document.documentElement;
    Object.entries(palette).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    
    if (theme === 'comic') {
      root.style.setProperty('--border-width', '2px');
    } else {
      root.style.setProperty('--border-width', '1px');
    }

    // Force body background
    document.body.style.backgroundColor = palette['--bg-editor'];
    document.body.style.color = palette['--text-main'];
  }, [theme]);

  return null;
};

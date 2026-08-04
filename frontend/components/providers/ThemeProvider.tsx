'use client';

import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  actualTheme: 'light' | 'dark'; // The actual theme being used (resolved from system)
  setTheme: (theme: Theme) => void;
  // Helper functions to get theme-aware colors
  getBackground: () => string;
  getBackgroundGradient: () => string;
  getTextColor: () => string;
  getCardBg: () => string;
  getBorderColor: () => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initTheme = (): Theme => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'auto') {
        localStorage.setItem('theme', 'system');
        return 'system';
      }
      return (saved as Theme) || 'system';
    }
    return 'system';
  };

  const initActualTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    
    // Check if dark class is already set (by our blocking script)
    if (document.documentElement.classList.contains('dark')) {
      return 'dark';
    }
    
    const saved = localStorage.getItem('theme');
    const normalized = saved === 'auto' ? 'system' : saved;
    
    if (normalized === 'dark') return 'dark';
    if (normalized === 'light') return 'light';
    
    // For system, check media query
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const [theme, setThemeState] = useState<Theme>(initTheme);
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>(initActualTheme);

  // Resolve actual theme from theme setting
  const resolveTheme = (themeValue: Theme): 'light' | 'dark' => {
    if (themeValue === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return themeValue;
  };

  // Update theme
  const setTheme = (newTheme: Theme) => {
    const normalized = newTheme === 'auto' ? 'system' : newTheme;
    setThemeState(normalized);
    localStorage.setItem('theme', normalized);
    document.cookie = `theme=${normalized};path=/;max-age=31536000;SameSite=Lax`;
    
    const resolved = resolveTheme(normalized);
    setActualTheme(resolved);
    
    if (resolved === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Sync dark class synchronously before paint to prevent flash
  useLayoutEffect(() => {
    if (actualTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [actualTheme]);

  // Listen for system theme changes when theme is set to 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      const newActualTheme = e.matches ? 'dark' : 'light';
      setActualTheme(newActualTheme);
      
      if (newActualTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Theme-aware helper functions
  const getBackground = () => {
    return 'hsl(var(--background))';
  };

  const getBackgroundGradient = () => {
    return 'hsl(var(--background))';
  };

  const getTextColor = () => {
    return 'hsl(var(--foreground))';
  };

  const getCardBg = () => {
    return 'hsl(var(--card))';
  };

  const getBorderColor = () => {
    return 'hsl(var(--border))';
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      actualTheme, 
      setTheme,
      getBackground,
      getBackgroundGradient,
      getTextColor,
      getCardBg,
      getBorderColor
    }}>
      {/* Theme Background Container */}
      <div className="min-h-screen w-full relative overflow-hidden">
        {/* Light Mode Background */}
        <div
          className="absolute inset-0 z-0 transition-opacity duration-500 opacity-100 dark:opacity-0"
          style={{
            background: 'hsl(var(--background))',
          }}
          suppressHydrationWarning
        >
          {/* Primary glow overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at top center, hsl(var(--accent) / 0.3), transparent 70%)',
              filter: 'blur(80px)',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>

        {/* Dark Mode Background */}
        <div
          className="absolute inset-0 z-0 transition-opacity duration-500 opacity-0 dark:opacity-100"
          style={{
            background: 'hsl(var(--background))',
          }}
          suppressHydrationWarning
        >
          {/* Primary top glow overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(ellipse 80% 60% at 50% 0%, hsl(var(--primary) / 0.3), transparent 70%)',
              filter: 'blur(60px)',
              backgroundRepeat: 'no-repeat',
            }}
          />
        </div>

        {/* Content with relative positioning */}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

'use client';

import { useTheme } from './providers/ThemeProvider';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useState, useEffect } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const themes = [
    { value: 'light' as const, icon: Sun, label: 'Light' },
    { value: 'dark' as const, icon: Moon, label: 'Dark' },
    { value: 'system' as const, icon: Monitor, label: 'System' },
  ];

  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      {themes.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={`
            relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md
            text-sm font-medium transition-all duration-200
            ${
              theme === value
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }
          `}
          aria-label={`Switch to ${label} theme`}
          title={`${label} mode`}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}

// Compact version for navbar
export function ThemeToggleCompact() {
  const { theme, actualTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    // Cycle through: light -> dark -> system -> light
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getIcon = () => {
    if (theme === 'system') return Monitor;
    return actualTheme === 'dark' ? Moon : Sun;
  };

  const Icon = getIcon();

  // Show a placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg text-gray-700 dark:text-gray-300"
        aria-label="Toggle theme"
        disabled
      >
        <Monitor className="w-5 h-5 opacity-0" />
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      aria-label="Toggle theme"
      title={`Current: ${theme} mode`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

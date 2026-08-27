import { createContext, useContext, useEffect, useState } from 'react';

export enum Theme {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: Theme.System,
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children, defaultTheme = Theme.System, storageKey = 'vite-ui-theme', ...props }: ThemeProviderProps) {
  const [theme, _setTheme] = useState<Theme>(() => (localStorage.getItem(storageKey) as Theme) || defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (theme: Theme) => {
      root.classList.remove('light', 'dark'); // Remove existing theme classes
      const systemTheme = mediaQuery.matches ? Theme.Dark : Theme.Light;
      const effectiveTheme = theme === Theme.System ? systemTheme : theme;
      root.classList.add(effectiveTheme); // Add the new theme class
    };

    const handleChange = () => {
      if (theme === Theme.System) {
        applyTheme(Theme.System);
      }
    };

    applyTheme(theme);

    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (theme: Theme) => {
    localStorage.setItem(storageKey, theme);
    _setTheme(theme);
  };

  const value = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};

/** Resolves the effective light/dark mode, tracking OS preference changes when theme is 'system'. */
// eslint-disable-next-line react-refresh/only-export-components
export const useIsDarkMode = () => {
  const { theme } = useTheme();
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setPrefersDark(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return theme === Theme.Dark || (theme === Theme.System && prefersDark);
};

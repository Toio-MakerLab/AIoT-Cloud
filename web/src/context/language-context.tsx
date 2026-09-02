import { createContext, useContext, useEffect, useState } from 'react';
import i18n from '@/lib/i18n';

export enum Language {
  EN = 'en',
  VI = 'vi',
}

type LanguageProviderProps = {
  children: React.ReactNode;
  defaultLanguage?: Language;
  storageKey?: string;
};

type LanguageProviderState = {
  language: Language;
  setLanguage: (language: Language) => void;
};

const initialState: LanguageProviderState = {
  language: Language.EN,
  setLanguage: () => null,
};

const LanguageProviderContext = createContext<LanguageProviderState>(initialState);

// Mirrors `ThemeProvider` (context/theme-context.tsx): persists the choice to
// localStorage client-side only, same as theme — no backend/user-settings sync.
export function LanguageProvider({ children, defaultLanguage = Language.EN, storageKey = 'vite-ui-language', ...props }: LanguageProviderProps) {
  const [language, _setLanguage] = useState<Language>(() => (localStorage.getItem(storageKey) as Language) || defaultLanguage);

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (language: Language) => {
    localStorage.setItem(storageKey, language);
    _setLanguage(language);
  };

  const value = {
    language,
    setLanguage,
  };

  return (
    <LanguageProviderContext.Provider {...props} value={value}>
      {children}
    </LanguageProviderContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useLanguage = () => {
  const context = useContext(LanguageProviderContext);

  if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');

  return context;
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'vi' | 'en';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'vi',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'language-storage',
    }
  )
);

// Translation helper hook
export const useTranslation = () => {
  const { language, setLanguage } = useLanguageStore();

  const t = (_key: string, translations: Record<Language, string>) => {
    return translations[language] || translations['vi'];
  };

  return { language, setLanguage, t };
};

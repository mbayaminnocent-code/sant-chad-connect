import { useApp } from '@/contexts/AppContext';
import { translations, TranslationKey } from '@/i18n/translations';

export const useTranslation = () => {
  const { language } = useApp();

  const t = (key: TranslationKey): string => {
    return translations[language]?.[key] || translations.fr[key] || key;
  };

  const isRTL = language === 'ar';

  return { t, language, isRTL };
};

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
// Import with fallback for development
let RNLocalize: any;
try {
  RNLocalize = require('react-native-localize');
} catch (e) {
  console.warn('react-native-localize not available, using fallback');
  RNLocalize = {
    getLocales: () => [{ languageCode: 'en' }],
  };
}
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import translation files
import enTranslation from '../locales/en/translation.json';
import huTranslation from '../locales/hu/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  hu: {
    translation: huTranslation,
  },
};

// Get device language
const getDeviceLanguage = (): string => {
  const locales = RNLocalize.getLocales();
  if (Array.isArray(locales) && locales.length > 0) {
    const deviceLanguage = locales[0].languageCode;
    // Return 'hu' for Hungarian, 'en' for everything else
    return deviceLanguage === 'hu' ? 'hu' : 'en';
  }
  return 'en'; // Default fallback
};

// Get saved language preference
const getSavedLanguage = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('app_language');
  } catch (error) {
    console.error('Error getting saved language:', error);
    return null;
  }
};

// Save language preference
export const saveLanguage = async (language: string): Promise<void> => {
  try {
    await AsyncStorage.setItem('app_language', language);
  } catch (error) {
    console.error('Error saving language:', error);
  }
};

// Initialize i18n
const initI18n = async (): Promise<void> => {
  const savedLanguage = await getSavedLanguage();
  const deviceLanguage = getDeviceLanguage();
  const initialLanguage = savedLanguage || deviceLanguage;

  await i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: initialLanguage,
      fallbackLng: 'en',
      
      interpolation: {
        escapeValue: false, // React already escapes values
      },
      
      react: {
        useSuspense: false, // Disable suspense to avoid issues with React Native
      },
      
      // Debug mode (disable in production)
      debug: __DEV__,
    });
};

// Initialize i18n immediately with error handling
initI18n().catch((error) => {
  console.error('i18n initialization failed:', error);
  // Continue with default English
});

export default i18n;
export { initI18n };
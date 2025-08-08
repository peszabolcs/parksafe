import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Import with fallback for development
let RNLocalize: any;
try {
  RNLocalize = require('react-native-localize');
} catch (e) {
  console.warn('react-native-localize not available, using fallback');
  RNLocalize = {
    getLocales: () => [{ languageCode: 'en' }],
    addEventListener: (event: string, callback: () => void) => ({ remove: () => {} }),
  };
}
import i18n from '../lib/i18n';
import { saveLanguage } from '../lib/i18n';

type SupportedLanguage = 'hu' | 'en' | 'system';

interface LanguageState {
  language: SupportedLanguage;
  actualLanguage: 'hu' | 'en'; // The actual language being used (resolved from system if needed)
  setLanguage: (language: SupportedLanguage) => Promise<void>;
  getSystemLanguage: () => 'hu' | 'en';
  initializeLanguage: () => Promise<void>;
}

// Get device language
const getDeviceLanguage = (): 'hu' | 'en' => {
  const locales = RNLocalize.getLocales();
  if (Array.isArray(locales) && locales.length > 0) {
    const deviceLanguage = locales[0].languageCode;
    return deviceLanguage === 'hu' ? 'hu' : 'en';
  }
  return 'en'; // Default fallback
};

// Resolve actual language from preference
const resolveActualLanguage = (language: SupportedLanguage): 'hu' | 'en' => {
  if (language === 'system') {
    return getDeviceLanguage();
  }
  return language;
};

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'system', // Default to system language
      actualLanguage: getDeviceLanguage(),
      
      getSystemLanguage: () => getDeviceLanguage(),
      
      setLanguage: async (language: SupportedLanguage) => {
        const actualLanguage = resolveActualLanguage(language);
        
        // Update i18n language
        await i18n.changeLanguage(actualLanguage);
        
        // Save to AsyncStorage for i18n persistence
        if (language !== 'system') {
          await saveLanguage(actualLanguage);
        } else {
          // Remove saved language if using system default
          try {
            await AsyncStorage.removeItem('app_language');
          } catch (error) {
            console.error('Error removing saved language:', error);
          }
        }
        
        // Update store
        set({ language, actualLanguage });
      },
      
      initializeLanguage: async () => {
        const { language } = get();
        const actualLanguage = resolveActualLanguage(language);
        
        // Ensure i18n is using the correct language
        if (i18n.language !== actualLanguage) {
          await i18n.changeLanguage(actualLanguage);
        }
        
        set({ actualLanguage });
      },
    }),
    {
      name: 'language-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the language preference, not actualLanguage (it should be computed)
      partialize: (state) => ({ language: state.language }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Recompute actualLanguage after hydration
          const actualLanguage = resolveActualLanguage(state.language);
          state.actualLanguage = actualLanguage;
          // Update i18n language
          i18n.changeLanguage(actualLanguage);
        }
      },
    }
  )
);

// Listen for system language changes (with fallback handling)
try {
  if (RNLocalize.addEventListener && typeof RNLocalize.addEventListener === 'function') {
    RNLocalize.addEventListener('change', () => {
      const store = useLanguageStore.getState();
      if (store.language === 'system') {
        const newSystemLanguage = getDeviceLanguage();
        if (store.actualLanguage !== newSystemLanguage) {
          store.setLanguage('system'); // This will update the actual language
        }
      }
    });
  }
} catch (error) {
  console.warn('Could not set up language change listener:', error);
}
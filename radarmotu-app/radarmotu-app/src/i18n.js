// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// REMOVEMOS o RNLocalize

// Importe suas traduções
import ptTranslation from './locales/pt/translation.json';
import esTranslation from './locales/es/translation.json';

// Objeto com os recursos de tradução
const resources = {
  pt: {
    translation: ptTranslation,
  },
  es: {
    translation: esTranslation,
  },
};

// REMOVEMOS o languageDetector

i18n
  // REMOVEMOS o .use(languageDetector)
  .use(initReactI18next) // Passa o i18n para o react-i18next
  .init({
    resources,
    
    // ESTA É A MUDANÇA PRINCIPAL:
    // Força o idioma a ser 'pt'. Isso é instantâneo (síncrono)
    // e corrige o crash.
    lng: 'pt', 

    fallbackLng: 'pt', // Idioma padrão se a detecção falhar
    compatibilityJSON: 'v3', // Necessário para React Native
    interpolation: {
      escapeValue: false, // React já faz o escape de XSS
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';



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



i18n
  
  .use(initReactI18next) // Passa o i18n para o react-i18next
  .init({
    resources,
    lng: 'pt', 

    fallbackLng: 'pt', 
    compatibilityJSON: 'v3', 
    interpolation: {
      escapeValue: false, 
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
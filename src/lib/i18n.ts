import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// English translations
import commonEN from '@/locales/en/common.json'
import portfolioEN from '@/locales/en/portfolio.json'

// Japanese translations
import commonJA from '@/locales/ja/common.json'
import portfolioJA from '@/locales/ja/portfolio.json'

// Russian translations
import commonRU from '@/locales/ru/common.json'
import portfolioRU from '@/locales/ru/portfolio.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    load: 'languageOnly',
    lng: 'en',
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        common: commonEN,
        portfolio: portfolioEN.portfolio,
      },
      ja: {
        common: commonJA,
        portfolio: portfolioJA.portfolio,
      },
      ru: {
        common: commonRU,
        portfolio: portfolioRU.portfolio,
      },
    },
  })

export default i18n

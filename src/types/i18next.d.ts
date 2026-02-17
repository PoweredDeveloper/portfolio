import 'i18next'
import 'react-i18next'

import commonEN from '@/locales/en/common.json'
import portfolioEN from '@/locales/en/portfolio.json'

// Extract the nested portfolio type
type PortfolioEN = typeof portfolioEN.portfolio

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof commonEN
      portfolio: PortfolioEN
    }
    returnNull: false
  }
}

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof commonEN
      portfolio: PortfolioEN
    }
    returnNull: false
  }
}

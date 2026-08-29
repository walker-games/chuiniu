import { createI18n } from 'vue-i18n'
import zhHant from './locales/zh-Hant'
import zhHans from './locales/zh-Hans'
import en from './locales/en'
import th from './locales/th'
import { detectCurrentLocale, persistLocale, type Locale } from './detector'
import { applyVantLocale } from './vant-locale'
import type { MessageSchema } from './types'

const initial = detectCurrentLocale()

export const i18n = createI18n<[MessageSchema], Locale>({
  legacy: false,
  locale: initial,
  fallbackLocale: 'en',
  messages: {
    'zh-Hant': zhHant,
    'zh-Hans': zhHans,
    'en': en,
    'th': th,
  },
})

applyVantLocale(initial)

export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  persistLocale(locale)
  applyVantLocale(locale)
}

export type { Locale } from './detector'
export { SUPPORTED_LOCALES } from './detector'

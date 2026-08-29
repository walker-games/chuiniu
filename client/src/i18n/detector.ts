export const SUPPORTED_LOCALES = ['zh-Hant', 'zh-Hans', 'en', 'th'] as const
export type Locale = typeof SUPPORTED_LOCALES[number]

const STORAGE_KEY = 'chuiniu_locale'

export function detectLocale(
  stored: string | null | undefined,
  browser: string | null | undefined,
): Locale {
  if (stored && (SUPPORTED_LOCALES as readonly string[]).includes(stored)) {
    return stored as Locale
  }

  const lang = (browser || '').toLowerCase()
  if (!lang) return 'en'

  if (lang.startsWith('zh')) {
    if (lang.includes('hant') || lang.includes('tw') || lang.includes('hk')) {
      return 'zh-Hant'
    }
    return 'zh-Hans'
  }
  if (lang.startsWith('th')) return 'th'
  return 'en'
}

export function detectCurrentLocale(): Locale {
  const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
  const browser = typeof navigator !== 'undefined' ? navigator.language : null
  return detectLocale(stored, browser)
}

export function persistLocale(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, locale)
  }
}

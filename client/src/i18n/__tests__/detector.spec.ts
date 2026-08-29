import { describe, it, expect } from 'vitest'
import { detectLocale, SUPPORTED_LOCALES, type Locale } from '../detector'

describe('detectLocale', () => {
  it('returns stored locale when localStorage has valid value', () => {
    expect(detectLocale('en', 'zh-TW')).toBe('en')
    expect(detectLocale('th', 'zh-TW')).toBe('th')
  })

  it('ignores invalid stored locale and falls back to browser', () => {
    expect(detectLocale('fr', 'zh-TW')).toBe('zh-Hant')
    expect(detectLocale('', 'en-US')).toBe('en')
  })

  it('maps zh-TW / zh-HK / zh-Hant to zh-Hant', () => {
    expect(detectLocale(null, 'zh-TW')).toBe('zh-Hant')
    expect(detectLocale(null, 'zh-HK')).toBe('zh-Hant')
    expect(detectLocale(null, 'zh-Hant-TW')).toBe('zh-Hant')
  })

  it('maps zh-CN / zh-SG / generic zh to zh-Hans', () => {
    expect(detectLocale(null, 'zh-CN')).toBe('zh-Hans')
    expect(detectLocale(null, 'zh')).toBe('zh-Hans')
    expect(detectLocale(null, 'zh-Hans-CN')).toBe('zh-Hans')
  })

  it('maps th* to th', () => {
    expect(detectLocale(null, 'th')).toBe('th')
    expect(detectLocale(null, 'th-TH')).toBe('th')
  })

  it('falls back to en for unknown browser language', () => {
    expect(detectLocale(null, 'fr-FR')).toBe('en')
    expect(detectLocale(null, 'ja-JP')).toBe('en')
    expect(detectLocale(null, '')).toBe('en')
    expect(detectLocale(null, undefined)).toBe('en')
  })

  it('exposes SUPPORTED_LOCALES with exactly 4 locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['zh-Hant', 'zh-Hans', 'en', 'th'])
  })
})

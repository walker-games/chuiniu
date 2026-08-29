import { Locale as VantLocale } from 'vant'
import zhHK from 'vant/es/locale/lang/zh-HK'
import zhCN from 'vant/es/locale/lang/zh-CN'
import enUS from 'vant/es/locale/lang/en-US'
import type { Locale } from './detector'

// Vant 无泰文官方包；仅覆盖项目用到的最小集（按钮/对话框）
const thTH = {
  vanCalendar: {
    end: 'สิ้นสุด',
    start: 'เริ่มต้น',
    title: 'ปฏิทิน',
    confirm: 'ยืนยัน',
  },
  vanDialog: { confirm: 'ยืนยัน', cancel: 'ยกเลิก' },
  vanPicker: { confirm: 'ยืนยัน', cancel: 'ยกเลิก', title: 'เลือก' },
  vanActionSheet: { cancel: 'ยกเลิก' },
  vanPullRefresh: { pulling: 'ดึงลงเพื่อรีเฟรช...', loosing: 'ปล่อยเพื่อรีเฟรช...' },
}

const vantLocaleMap: Record<Locale, Record<string, unknown>> = {
  'zh-Hant': zhHK,
  'zh-Hans': zhCN,
  'en': enUS,
  'th': thTH,
}

export function applyVantLocale(locale: Locale): void {
  VantLocale.use(locale, vantLocaleMap[locale] as any)
}

export type CompanyConfig = {
  companyName: string
  legalCompanyName: string | null
  phone: string | null
  wechat: string | null
  wechatId: string | null
  email: string | null
  address: string | null
  wechatQr: string | null
  businessHours: string | null
  icpNumber: string | null
  policeRecordNumber: string | null
}

const publicValue = (value: string | undefined) => value?.trim() || null

export const companyConfig: CompanyConfig = {
  companyName: '瑞客照明',
  legalCompanyName: '上海瑞客莱照明有限公司',
  phone: publicValue(import.meta.env.VITE_COMPANY_PHONE),
  wechat: '瑞客照明官方微信公众号',
  wechatId: publicValue(import.meta.env.VITE_WECHAT_ID),
  email: publicValue(import.meta.env.VITE_COMPANY_EMAIL),
  address: '上海市奉贤区金大公路 8218 号 1 幢',
  wechatQr: 'assets/ruike-wechat-official.jpg',
  businessHours: null,
  icpNumber: null,
  policeRecordNumber: null,
}

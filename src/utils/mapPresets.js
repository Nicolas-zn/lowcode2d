export const provinceOptions = [
  { code: '110000', label: '北京市' },
  { code: '120000', label: '天津市' },
  { code: '130000', label: '河北省' },
  { code: '140000', label: '山西省' },
  { code: '150000', label: '内蒙古自治区' },
  { code: '210000', label: '辽宁省' },
  { code: '220000', label: '吉林省' },
  { code: '230000', label: '黑龙江省' },
  { code: '310000', label: '上海市' },
  { code: '320000', label: '江苏省' },
  { code: '330000', label: '浙江省' },
  { code: '340000', label: '安徽省' },
  { code: '350000', label: '福建省' },
  { code: '360000', label: '江西省' },
  { code: '370000', label: '山东省' },
  { code: '410000', label: '河南省' },
  { code: '420000', label: '湖北省' },
  { code: '430000', label: '湖南省' },
  { code: '440000', label: '广东省' },
  { code: '450000', label: '广西壮族自治区' },
  { code: '460000', label: '海南省' },
  { code: '500000', label: '重庆市' },
  { code: '510000', label: '四川省' },
  { code: '520000', label: '贵州省' },
  { code: '530000', label: '云南省' },
  { code: '540000', label: '西藏自治区' },
  { code: '610000', label: '陕西省' },
  { code: '620000', label: '甘肃省' },
  { code: '630000', label: '青海省' },
  { code: '640000', label: '宁夏回族自治区' },
  { code: '650000', label: '新疆维吾尔自治区' },
  { code: '710000', label: '台湾省' },
  { code: '810000', label: '香港特别行政区' },
  { code: '820000', label: '澳门特别行政区' }
]

export const DEFAULT_CHINA_CODE = '100000'

export const getPresetMapUrl = (code) => {
  const normalized = String(code || DEFAULT_CHINA_CODE)
  const suffix = normalized === DEFAULT_CHINA_CODE ? '_full' : ''
  return `https://geo.datav.aliyun.com/areas_v3/bound/${normalized}${suffix}.json`
}

export const getProvinceLabelByCode = (code) => {
  return provinceOptions.find(item => item.code === String(code))?.label || ''
}

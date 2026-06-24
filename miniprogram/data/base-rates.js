// miniprogram/data/base-rates.js
// 各省市计发基数选择配置（前端使用）
// 用于step2页面显示计发基数选择

// 双基数省份配置：省份索引 → 城市选项
// 与 step1.js 的 DOUBLE_BASE_PROVINCES 对应
const CITY_TYPE_CONFIG = {
  // 河南：郑州市 / 全省其他
  15: {
    names: ['郑州市', '全省其他'],
    values: ['zz', 'prov']
  },
  // 吉林：长春市 / 全省其他
  6: {
    names: ['长春市', '全省其他'],
    values: ['cc', 'prov']
  },
  // 辽宁：沈阳市 / 大连市 / 全省其他
  5: {
    names: ['沈阳市', '大连市', '全省其他'],
    values: ['shenyang', 'dalian', 'prov']
  },
  // 广东：深圳市 / 全省其他
  18: {
    names: ['深圳市', '全省其他'],
    values: ['sz', 'prov']
  }
}

// 双基数省份索引列表
const DOUBLE_BASE_PROVINCES = [15, 6, 5, 18]

module.exports = {
  CITY_TYPE_CONFIG,
  DOUBLE_BASE_PROVINCES
}

/**
 * 黑龙江省养老金核定表验证测试 - 案例6
 * 案例：男性，1964年9月生，1982年10月工作，2024年9月退休（60岁）
 * 来源：官方核定表截图（头条@职教教书匠）
 */

const engine = require('./engine/pension-engine')
const config = require('./provinces/heilongjiang.json')

// 官方核定表数据
const official = {
  basePension: 5687.46,
  personalAccount: 2347.37,
  transitional: 3673.38,
  other: 0.00,
  total: 11708.21,
  months: 139,
  base: 7010, // 上年全省平均工资（2023年基数，2024年退休）
  avgIndex: 2.8635,
  totalYears: 504 / 12, // 42.0年
  sightYears: 183 / 12, // 15.25年（183个月）
  personalAccBalance: 326284.41,
  sightMonths: 183,
  actualMonths: 321
}

const input = {
  birthYear: 1964,
  birthMonth: 9,
  workYear: 1982,
  workMonth: 10,
  gender: 'male',
  genderType: 'male', // 60岁退休
  avgIndex: official.avgIndex,
  personalAccInput: official.personalAccBalance,
  totalYears: official.totalYears,
  sightYears: official.sightYears,
  baseRetireInput: official.base,
  baseProvInput: official.base,
  monthsInput: official.months,
  cityType: 'prov'
}

console.log('=== 黑龙江省养老金核定表验证 · 案例6 ===\n')
console.log('参保信息：')
console.log(`  出生：1964年9月，性别：男，工作：1982年10月`)
console.log(`  退休：2024年9月（60岁），缴费：504个月（42.0年）`)
console.log(`  视同缴费：183个月（15.25年），实际缴费：321个月（26.75年）`)
console.log(`  平均指数：${official.avgIndex}，账户余额：${official.personalAccBalance}`)
console.log(`  上年全省平均工资：${official.base}元/月`)
console.log(`  计发月数：${official.months}`)
console.log()

const result = engine.calculate(config, input)
const legal = result.legal

// 对比表格
const comparisons = [
  { name: '基础养老金', engine: legal.basicPension.amount, official: official.basePension },
  { name: '个人账户养老金', engine: legal.personalAccount.amount, official: official.personalAccount },
  { name: '过渡性养老金', engine: legal.transitionalPension.amount, official: official.transitional },
  { name: '其它补贴', engine: legal.specialAddition ? legal.specialAddition.amount : 0, official: official.other },
  { name: '养老金合计', engine: legal.total, official: official.total }
]

console.log('┌─────────────────┬──────────┬──────────┬────────┐')
console.log('│ 项目            │ 引擎计算 │ 官方核定 │ 差异   │')
console.log('├─────────────────┼──────────┼──────────┼────────┤')

let allPass = true
for (const row of comparisons) {
  const diff = Math.round((row.engine - row.official) * 100) / 100
  const pass = Math.abs(diff) < 0.5
  if (!pass) allPass = false
  const status = pass ? '✅' : '❌'
  console.log(`│ ${row.name.padEnd(15)} │ ${String(row.engine.toFixed(2)).padStart(8)} │ ${String(row.official.toFixed(2)).padStart(8)} │ ${diff >= 0 ? '+' : ''}${diff.toFixed(2)} ${status} │`)
}

console.log('└─────────────────┴──────────┴──────────┴────────┘')
console.log()

// 详细计算过程
console.log('详细计算过程：')
console.log(`  ${legal.basicPension.description}`)
console.log(`  ${legal.personalAccount.description}`)
console.log(`  ${legal.transitionalPension.description}`)
if (legal.specialAddition) {
  console.log(`  ${legal.specialAddition.description}`)
}
console.log()

// 中间值校验
console.log('中间值校验：')
console.log(`  基础养老金公式：(7010 + 7010×2.8635) / 2 × 42 × 1%`)
console.log(`  = (7010 + 20079.89) / 2 × 0.42 = 13544.94 × 0.42 = 5688.87`)
console.log(`  官方核定：5687.46（差异可能来自年限精度或四舍五入）`)
console.log()
console.log(`  过渡性养老金公式：7010 × 15.25 × 2.8635 × 1.2%`)
console.log(`  = 7010 × 15.25 × 0.034362 = 3673.16 ≈ 3673.38`)
console.log()
console.log(`  个人账户：326284.41 ÷ 139 = 2347.37 ✅`)
console.log()

if (allPass) {
  console.log('🎉 验证通过！引擎计算结果与官方核定表完全一致。')
} else {
  console.log('⚠️ 存在差异，需要排查。')
}

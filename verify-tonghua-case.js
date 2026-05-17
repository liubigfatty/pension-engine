/**
 * 验证案例：通化市2025年8月退休男性（清晰核定表）
 * 来源：吉林省城镇职工养老保险基本养老金核定表（图片）
 */

const engine = require('./engine/pension-engine')
const config = require('./provinces/jilin.json')

// === 表单提取的关键参数 ===
const caseData = {
  name: '通化市李某',
  gender: 'male',
  birthYear: 1965,
  birthMonth: 8,
  workYear: 1961,
  workMonth: 4,
  avgIndex: 0.46,
  cityType: 'prov', // 通化市 = 全省其他（非长春）
  // 官方核定的精确值
  totalYears: 44.42,       // 累计缴费年限
  sightYears: 15.25,       // 视同缴费年限
  personalAccInput: 83944.83, // 个人账户累计储存额
}

console.log('========================================')
console.log('  通化市2025年8月退休案例验证')
console.log('========================================')
console.log(`出生：${caseData.birthYear}.${caseData.birthMonth}  参工：${caseData.workYear}.${caseData.workMonth}`)
console.log(`指数：${caseData.avgIndex}  累计年限：${caseData.totalYears}年  视同：${caseData.sightYears}年`)
console.log(`个人账户：${caseData.personalAccInput.toLocaleString()}元  城市：通化市(prov)`)
console.log('')

const result = engine.calculate(config, caseData)
const legal = result.legal

// === 各模块对比 ===
console.log('--- 引擎计算结果 vs 官方核定 ---')
console.log('')

// 1. 基础养老金
console.log('【基础养老金①】')
console.log(`  引擎：${legal.basicPension.amount.toFixed(2)}元`)
console.log(`  官方：2,374.30元`)
console.log(`  差额：${(legal.basicPension.amount - 2374.30).toFixed(2)}元`)
console.log(`  公式：${legal.basicPension.description}`)
console.log(`  计发基数(退休地)：${legal.baseRetire.toFixed(2)}`)
console.log(`  计发基数(全省)：${legal.baseProv.toFixed(2)}`)
console.log('')

// 2. 增发基础养老金
console.log('【增发基础养老金②】')
console.log(`  引擎：${legal.extraPension.amount.toFixed(2)}元`)
console.log(`  官方：286.23元 (40.09 + 53.45 + 192.69)`)
console.log(`  差额：${(legal.extraPension.amount - 286.23).toFixed(2)}元`)
console.log(`  说明：${legal.extraPension.description}`)
if (legal.extraPension.bracketDetails && legal.extraPension.bracketDetails.length > 0) {
  console.log('  分段明细：引擎 vs 官方')
  const officialBrackets = [
    { range: '21-25', official: 40.09 },
    { range: '26-30', official: 53.45 },
    { range: '31+',   official: 192.69 },
  ]
  let i = 0
  for (const d of legal.extraPension.bracketDetails) {
    const off = officialBrackets[i]
    console.log(`    ${d.range}: 引擎=${d.amount.toFixed(2)}  官方=${off.official}  差=${(d.amount - off.official).toFixed(2)}`)
    i++
  }
}
console.log('')

// 3. 个人账户养老金
console.log('【个人账户养老金③】')
console.log(`  引擎：${legal.personalAccount.amount.toFixed(2)}元`)
console.log(`  官方：603.20元`)
console.log(`  差额：${(legal.personalAccount.amount - 603.20).toFixed(2)}元`)
console.log(`  说明：${legal.personalAccount.description}`)
console.log('')

// 4. 过渡性养老金
console.log('【过渡性养老金④】')
console.log(`  引擎：${legal.transitionalPension.amount.toFixed(2)}元`)
console.log(`  官方：719.10元`)
console.log(`  差额：${(legal.transitionalPension.amount - 719.10).toFixed(2)}元`)
console.log(`  说明：${legal.transitionalPension.description}`)
console.log('')

// 5. 其他加发
console.log('【其他加发⑤】')
console.log(`  引擎：${legal.specialAddition.amount.toFixed(2)}元`)
console.log(`  官方：0元`)
console.log('')

// 合计
const officialTotal = 2374.3 + 286.23 + 603.2 + 719.1
console.log('【月基本养老金合计】')
console.log(`  引擎：${legal.total.toFixed(2)}元`)
console.log(`  官方：3,892.83元（表单合计）`)
console.log(`  手工加总各模块：${officialTotal.toFixed(2)}元`)
console.log(`  引擎差额：${(legal.total - 3892.83).toFixed(2)}元`)
console.log('')

// === 退休信息 ===
console.log('--- 退休信息 ---')
console.log(`法定退休年龄：${legal.ageStr} (精确：${legal.age.toFixed(2)}岁)`)
console.log(`退休日期：${result.getDateStr(legal.date)}`)
console.log(`计发月数：${legal.months}`)
console.log(`实际缴费年限：${legal.actualYears.toFixed(2)}年`)
console.log(`视同缴费年限：${legal.sightYears.toFixed(2)}年`)
console.log(`累计缴费年限：${legal.totalYears.toFixed(2)}年`)

// 验证结果汇总
const diffs = [
  { name: '基础养老金', engine: legal.basicPension.amount, official: 2374.3 },
  { name: '增发', engine: legal.extraPension.amount, official: 286.23 },
  { name: '个人账户', engine: legal.personalAccount.amount, official: 603.2 },
  { name: '过渡性', engine: legal.transitionalPension.amount, official: 719.1 },
]
let passCount = 0
for (const d of diffs) {
  const diff = Math.abs(d.engine - d.official)
  if (diff < 0.05) passCount++
}
console.log('')
console.log('=== 验证结果 ===')
for (const d of diffs) {
  const diff = Math.abs(d.engine - d.official)
  const ok = diff < 0.05 ? '✅' : '❌'
  console.log(`  ${ok} ${d.name}: 引擎${d.engine.toFixed(2)} vs 官方${d.official.toFixed(2)} 差${diff.toFixed(2)}`)
}
console.log(`  通过：${passCount}/4  合计差额：${Math.abs(legal.total - 3892.83).toFixed(2)}元`)

/**
 * 验证案例：吉林省2025年11月退休男性，高指数长缴费
 * 来源：官方养老金核定表（图片）
 */

const engine = require('./engine/pension-engine')
const config = require('./provinces/jilin.json')

// === 表单提取的关键参数 ===
const caseData = {
  name: '核定表案例',
  gender: 'male',
  birthYear: 1965,
  birthMonth: 11,
  workYear: 1982,
  workMonth: 7,
  avgIndex: 2.97,
  cityType: 'cc', // 长春市
  // 官方核定的精确值（覆盖引擎自动计算）
  totalYears: 43.42,      // 累计缴费年限
  sightYears: 13,         // 视同缴费年限
  personalAccInput: 629297.96, // 个人账户累计储存额
}

console.log('========================================')
console.log('  吉林2025年11月退休案例验证')
console.log('========================================')
console.log(`出生：${caseData.birthYear}.${caseData.birthMonth}  参工：${caseData.workYear}.${caseData.workMonth}`)
console.log(`指数：${caseData.avgIndex}  累计年限：${caseData.totalYears}年  视同：${caseData.sightYears}年`)
console.log(`个人账户：${caseData.personalAccInput.toLocaleString()}元  城市：长春市`)
console.log('')

const result = engine.calculate(config, caseData)
const legal = result.legal

// === 各模块对比 ===
console.log('--- 引擎计算结果 vs 官方核定 ---')
console.log('')

// 1. 基础养老金
console.log('【基础养老金①】')
console.log(`  引擎：${legal.basicPension.amount.toFixed(2)}元`)
console.log(`  官方：约6,152.20元（核定表可见）`)
console.log(`  公式：${legal.basicPension.description}`)
console.log(`  计发基数(退休地/长春市)：${legal.baseRetire.toFixed(2)}`)
console.log(`  计发基数(全省)：${legal.baseProv.toFixed(2)}`)
console.log('')

// 2. 增发基础养老金
console.log('【增发基础养老金②】')
console.log(`  引擎：${legal.extraPension.amount.toFixed(2)}元`)
console.log(`  官方：758.72元（合计）`)
console.log(`  说明：${legal.extraPension.description}`)
if (legal.extraPension.bracketDetails && legal.extraPension.bracketDetails.length > 0) {
  console.log('  分段明细：')
  for (const d of legal.extraPension.bracketDetails) {
    console.log(`    ${d.range}: ${d.years.toFixed(2)}年 × ${(d.rate*100).toFixed(2)}% = 系数${d.contribution.toFixed(4)} → ${d.amount.toFixed(2)}元`)
  }
}
console.log('')

// 3. 个人账户养老金
console.log('【个人账户养老金③】')
console.log(`  引擎：${legal.personalAccount.amount.toFixed(2)}元`)
console.log(`  官方：4,528.93元`)
console.log(`  说明：${legal.personalAccount.description}`)
console.log('')

// 4. 过渡性养老金
console.log('【过渡性养老金④】')
console.log(`  引擎：${legal.transitionalPension.amount.toFixed(2)}元`)
console.log(`  官方：约3,932.68元`)
console.log(`  说明：${legal.transitionalPension.description}`)
console.log('')

// 5. 其他加发
console.log('【其他加发⑤】')
console.log(`  引擎：${legal.specialAddition.amount.toFixed(2)}元`)
console.log(`  官方：0元`)
console.log('')

// 合计
console.log('【月基本养老金合计】')
console.log(`  引擎：${legal.total.toFixed(2)}元`)
console.log(`  官方：14,258.26元`)
console.log(`  差额：${(legal.total - 14258.26).toFixed(2)}元`)
console.log('')

// === 退休信息 ===
console.log('--- 退休信息 ---')
console.log(`法定退休年龄：${legal.ageStr} (精确：${legal.age.toFixed(2)}岁)`)
console.log(`退休日期：${result.getDateStr(legal.date)}`)
console.log(`计发月数：${legal.months}`)
console.log(`实际缴费年限：${legal.actualYears.toFixed(2)}年`)
console.log(`视同缴费年限：${legal.sightYears.toFixed(2)}年`)
console.log(`累计缴费年限：${legal.totalYears.toFixed(2)}年`)
console.log(`退休地基数：${legal.baseRetire.toFixed(2)}`)
console.log(`全省基数：${legal.baseProv.toFixed(2)}`)
console.log(`替代率：${legal.rate.toFixed(1)}%`)

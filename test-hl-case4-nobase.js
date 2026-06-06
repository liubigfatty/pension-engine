const engine = require('./engine/pension-engine')
const hlConfig = require('./provinces/heilongjiang.json')

// 案例4：不传 baseRetire/baseProv，让引擎自动查表
const input = {
  birthYear: 1976,
  birthMonth: 1,
  workYear: 1992,
  workMonth: 9,
  gender: 'female',
  cityType: 'prov',
  avgIndex: 0.6519,
  personalAcc: 76556.96,
  totalYears: 401 / 12,
  sightYears: 40 / 12,
  months: 195,
  // 不传 baseRetire/baseProv
}

const result = engine.calculate(hlConfig, input)
const legal = result.legal

console.log('=== 黑龙江案例4 自动查表验证 ===')
console.log('1976年1月女/1992年9月参工 → 法定退休约2026年1月')
console.log('期望基数：7705（2025年社平，用于2026年退休）')
console.log()
console.log('引擎自动查出：')
console.log('  baseRetire:', legal.baseRetire)
console.log('  baseProv:', legal.baseProv)
console.log()
console.log('基础养老金:', legal.basicPension.amount, '(官方=2126.62)')
console.log('个人账户:', legal.personalAccount.amount, '(官方=392.60)')
console.log('过渡性:', legal.transitionalPension.amount, '(官方=200.92)')
console.log('合计:', legal.total, '(官方=2720.14)')

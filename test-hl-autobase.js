const engine = require('./engine/pension-engine')
const hlConfig = require('./provinces/heilongjiang.json')

// 测试：不传 baseRetireInput，让引擎自动查表
// 案例2：1964年2月生，2024年2月退休 → 应该用2023年社平 = 7010

const input = {
  birthYear: 1964,
  birthMonth: 2,
  workYear: 1980,
  workMonth: 9,
  cityType: 'prov',
  gender: 'male',
  personalAccInput: 150471.35,
  avgIndex: 1.2416,
  totalYears: 522 / 12,
  sightYears: 190 / 12,
  monthsInput: 139,
  // 不传 baseRetireInput / baseProvInput，让引擎自动查
}

const result = engine.calculate(hlConfig, input)
const legal = result.legal

console.log('=== 黑龙江自动查表验证 ===')
console.log('案例：1964年2月生/2024年2月退休')
console.log('期望基数：7010（2023年社平，用于2024年退休）')
console.log()
console.log('引擎自动查出的基数：')
console.log('  退休地 baseRetire:', legal.baseRetire, '(期望 7010)')
console.log('  全省 baseProv:', legal.baseProv, '(期望 7010)')
console.log()
console.log('基础养老金:', legal.basicPension.amount, '(覆盖值=3417.71)')
console.log('过渡性养老金:', legal.transitionalPension.amount, '(覆盖值=1653.69)')
console.log('个人账户:', legal.personalAccount.amount, '(覆盖值=1082.53)')
console.log('合计:', legal.total, '(覆盖值=6153.93)')
console.log()

// 再测一个：2025年退休
const input2 = {
  birthYear: 1964,
  birthMonth: 2,
  workYear: 1980,
  workMonth: 9,
  cityType: 'prov',
  gender: 'male',
  personalAccInput: 150471.35,
  avgIndex: 1.2416,
  totalYears: 522 / 12,
  sightYears: 190 / 12,
  monthsInput: 139,
  retireYear: 2025,
  retireMonth: 2,
}

const result2 = engine.calculate(hlConfig, input2)
const legal2 = result2.legal

console.log('=== 2025年退休自动查表 ===')
console.log('期望基数：7570（2024年社平，用于2025年退休）')
console.log('  退休地 baseRetire:', legal2.baseRetire)
console.log('  全省 baseProv:', legal2.baseProv)

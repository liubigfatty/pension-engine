/**
 * 甘肃案例测试 - 验证调节金计算（视同≥15年）
 * 
 * 模拟数据：假设某人有视同缴费16年（≥15年），应该增发15元调节金
 */

const { calculate } = require('./engine/pension-engine.js')
const fs = require('fs')

// 读取甘肃配置
const gansuConfig = JSON.parse(fs.readFileSync('./provinces/gansu.json', 'utf8'))

console.log('=== 甘肃调节金测试（视同≥15年）===\n')

// 测试案例：视同缴费16年，应该增发15元调节金
const testInput = {
  birthYear: 1965,
  birthMonth: 5,
  workYear: 1980,  // 1980年参工，1996年建账，视同约16年
  workMonth: 7,
  retireYear: 2025,
  retireMonth: 5,
  cityType: 'prov',
  sightYears: 16,  // 视同缴费16年（≥15年）
  totalYears: 45,
  personalAccInput: 200000,
  avgIndex: 1.2,
  baseRetireInput: 7594,
  baseProvInput: 7594
}

const result = calculate(gansuConfig, testInput)

console.log('测试结果：')
console.log('  视同缴费年限:', testInput.sightYears, '年')
console.log('  调节金:', result.legal.adjustmentFund.amount, '元')
console.log('  调节金说明:', result.legal.adjustmentFund.description)
console.log('')

if (result.legal.adjustmentFund.amount === 15) {
  console.log('✅ 调节金计算正确！（视同≥15年，+15元/月）')
} else {
  console.log('❌ 调节金计算错误！期望15元，实际', result.legal.adjustmentFund.amount, '元')
}

console.log('\n=== 对比测试：视同<15年（不增发）===\n')

// 测试案例2：视同缴费6年（<15年），不应该增发调节金
const testInput2 = {
  ...testInput,
  sightYears: 6,
  totalYears: 35,
  workYear: 1990
}

const result2 = calculate(gansuConfig, testInput2)

console.log('测试结果：')
console.log('  视同缴费年限:', testInput2.sightYears, '年')
console.log('  调节金:', result2.legal.adjustmentFund.amount, '元')
console.log('  调节金说明:', result2.legal.adjustmentFund.description)
console.log('')

if (result2.legal.adjustmentFund.amount === 0) {
  console.log('✅ 调节金计算正确！（视同<15年，不增发）')
} else {
  console.log('❌ 调节金计算错误！期望0元，实际', result2.legal.adjustmentFund.amount, '元')
}

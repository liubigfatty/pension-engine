/**
 * 全面测试脚本 - 验证手动输入和Excel导入两种场景
 * 测试案例：3个已验证案例（吉林1976女、长春1965男、省直1964男）
 */

const engine = require('./engine/pension-engine')
const config = require('./provinces/jilin.json')

// ==================== 案例1：吉林1976女（预核定表2026-02）====================
function testCase1() {
  console.log('\n========== 案例1：吉林1976女（预核定表2026-02）==========')
  
  const input = {
    birthYear: 1976,
    birthMonth: 2,
    workYear: 1995,
    workMonth: 3,
    gender: '女',
    cityType: 'prov',  // 非长春
    totalYears: 31,
    sightYears: 0.33,
    avgIndex: 0.75,
    personalAcc: 112406.89,
    baseRetireInput: 7322.08,  // 预核定：用上年基数
    baseProvInput: 7322.08,
    skipDelay: true
  }
  
  const official = {
    basic: 1986.11,
    extra: 128.14,
    personal: 576.45,
    trans: 25.37,
    total: 2716.07
  }
  
  const result = engine.calculate(config, input)
  const e = result.legal
  
  const calc = {
    basic: e.basicPension.amount,
    extra: e.extraPension.amount,
    personal: e.personalAccount.amount,
    trans: e.transitionalPension.amount,
    total: e.basicPension.amount + e.extraPension.amount + e.personalAccount.amount + e.transitionalPension.amount
  }
  
  console.log('数据项          | 引擎值   | 官方值   | 差异')
  console.log('----------------|----------|----------|--------')
  check('基础养老金', calc.basic, official.basic)
  check('增发养老金', calc.extra, official.extra)
  check('个人账户', calc.personal, official.personal)
  check('过渡性养老金', calc.trans, official.trans)
  check('合计', calc.total, official.total)
  
  console.log('\n关键中间值:')
  console.log(`  计发月数: ${e.months}`)
  console.log(`  实际缴费年限: ${e.actualYears.toFixed(2)}`)
  console.log(`  个人账户余额: ${result.metaData.personalAccBalance.toFixed(2)}`)
  
  console.log('\n增发分段明细:')
  if (e.extraPension.bracketDetails) {
    e.extraPension.bracketDetails.forEach(b => {
      console.log(`  ${b.range}年: ${b.years.toFixed(2)}年 × ${(b.rate*100).toFixed(2)}% = ${b.amount.toFixed(2)}元`)
    })
  }
}

// ==================== 案例2：长春男1965-08（预核定表2025-08）====================
function testCase2() {
  console.log('\n========== 案例2：长春男1965-08（预核定表2025-08）==========')
  
  const input = {
    birthYear: 1965,
    birthMonth: 8,
    workYear: 1982,
    workMonth: 10,
    gender: '男',
    cityType: 'cc',  // 长春
    totalYears: 42.67,
    sightYears: 12.5,
    avgIndex: 0.61,
    personalAcc: 86106.56,
    baseRetireInput: 7852.58,  // 2025年长春基数
    baseProvInput: 7178.5,     // 2025年全省基数
    skipDelay: true
  }
  
  const official = {
    basic: 2609.58,
    extra: 300.75,
    personal: 619.47,
    trans: 766.31,
    total: 4296.11
  }
  
  const result = engine.calculate(config, input)
  const e = result.legal
  
  const calc = {
    basic: e.basicPension.amount,
    extra: e.extraPension.amount,
    personal: e.personalAccount.amount,
    trans: e.transitionalPension.amount,
    total: e.basicPension.amount + e.extraPension.amount + e.personalAccount.amount + e.transitionalPension.amount
  }
  
  console.log('数据项          | 引擎值   | 官方值   | 差异')
  console.log('----------------|----------|----------|--------')
  check('基础养老金', calc.basic, official.basic)
  check('增发养老金', calc.extra, official.extra)
  check('个人账户', calc.personal, official.personal)
  check('过渡性养老金', calc.trans, official.trans)
  check('合计', calc.total, official.total)
  
  console.log('\n增发分段明细:')
  if (e.extraPension.bracketDetails) {
    e.extraPension.bracketDetails.forEach(b => {
      console.log(`  ${b.range}年: ${b.years.toFixed(2)}年 × ${(b.rate*100).toFixed(2)}% = ${b.amount.toFixed(2)}元`)
    })
  }
}

// ==================== 案例3：省直男1964-11（核定表2024-11）====================
function testCase3() {
  console.log('\n========== 案例3：省直男1964-11（核定表2024-11）==========')
  
  const input = {
    birthYear: 1964,
    birthMonth: 11,
    workYear: 1980,
    workMonth: 12,
    gender: '男',
    cityType: 'prov',  // 省直
    totalYears: 44,
    sightYears: 17.08,
    avgIndex: 1.48,
    personalAcc: 189789.05,
    baseRetireInput: 7178.5,  // 2024年全省基数
    baseProvInput: 7178.5,
    skipDelay: true
  }
  
  const official = {
    basic: 3916.59,
    extra: 467.32,
    personal: 1365.39,
    trans: 2540.45,
    total: 8289.75
  }
  
  const result = engine.calculate(config, input)
  const e = result.legal
  
  const calc = {
    basic: e.basicPension.amount,
    extra: e.extraPension.amount,
    personal: e.personalAccount.amount,
    trans: e.transitionalPension.amount,
    total: e.basicPension.amount + e.extraPension.amount + e.personalAccount.amount + e.transitionalPension.amount
  }
  
  console.log('数据项          | 引擎值   | 官方值   | 差异')
  console.log('----------------|----------|----------|--------')
  check('基础养老金', calc.basic, official.basic)
  check('增发养老金', calc.extra, official.extra)
  check('个人账户', calc.personal, official.personal)
  check('过渡性养老金', calc.trans, official.trans)
  check('合计', calc.total, official.total)
  
  console.log('\n增发分段明细:')
  if (e.extraPension.bracketDetails) {
    e.extraPension.bracketDetails.forEach(b => {
      console.log(`  ${b.range}年: ${b.years.toFixed(2)}年 × ${(b.rate*100).toFixed(2)}% = ${b.amount.toFixed(2)}元`)
    })
  }
}

// ==================== 模拟Excel导入后计算 ====================
function testExcelImport() {
  console.log('\n========== 模拟Excel导入后计算 ==========')
  
  // 模拟Excel解析后的数据（来自云函数返回值）
  const importedData = {
    avgIndex: 0.75,
    personalAcc: 112406.89,
  }
  
  console.log('模拟Excel导入数据:')
  console.log(`  平均缴费指数: ${importedData.avgIndex}`)
  console.log(`  个人账户累计: ${importedData.personalAcc}`)
  
  // 用导入的数据计算（预核定场景：用上年基数）
  const input = {
    birthYear: 1976,
    birthMonth: 2,
    workYear: 1995,
    workMonth: 3,
    gender: '女',
    cityType: 'prov',
    totalYears: 31,
    sightYears: 0.33,
    avgIndex: importedData.avgIndex,  // 使用Excel导入的指数
    personalAcc: importedData.personalAcc,  // 使用Excel导入的账户余额
    baseRetireInput: 7322.08,
    baseProvInput: 7322.08,
    skipDelay: true
  }
  
  const official = {
    basic: 1986.11,
    extra: 128.14,
    personal: 576.45,
    trans: 25.37,
    total: 2716.07
  }
  
  const result = engine.calculate(config, input)
  const e = result.legal
  
  const calc = {
    basic: e.basicPension.amount,
    extra: e.extraPension.amount,
    personal: e.personalAccount.amount,
    trans: e.transitionalPension.amount,
    total: e.basicPension.amount + e.extraPension.amount + e.personalAccount.amount + e.transitionalPension.amount
  }
  
  console.log('\n导入后计算结果:')
  console.log('数据项          | 引擎值   | 官方值   | 差异')
  console.log('----------------|----------|----------|--------')
  check('基础养老金', calc.basic, official.basic)
  check('增发养老金', calc.extra, official.extra)
  check('个人账户', calc.personal, official.personal)
  check('过渡性养老金', calc.trans, official.trans)
  check('合计', calc.total, official.total)
}

// ==================== 工具函数 ====================
function check(name, calcVal, officialVal) {
  const diff = Math.round((calcVal - officialVal) * 100) / 100
  const ok = Math.abs(diff) < 0.01 ? '✅' : '❌'
  console.log(`${name.padEnd(14)} | ${calcVal.toFixed(2).padStart(8)} | ${officialVal.toFixed(2).padStart(8)} | ${diff >= 0 ? '+' : ''}${diff.toFixed(2).padStart(6)} ${ok}`)
}

// ==================== 运行所有测试 ====================
console.log('')
console.log('╔═══════════════════════════════════════════╗')
console.log('║     养老金计算引擎 - 全面测试              ║')
console.log('╚═══════════════════════════════════════════╝')
console.log('')

try {
  testCase1()
  testCase2()
  testCase3()
  testExcelImport()
  
  console.log('\n')
  console.log('========== 全部测试完成 ==========')
} catch (err) {
  console.error('\n❌ 测试失败:', err.message)
  console.error(err.stack)
}

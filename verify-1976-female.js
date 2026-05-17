// 长春女性1976年出生案例验证（官方预核定表）
// 退休时间: 2026-02-01, 50岁
// 基准: 7322.08, 指数0.75, 年限31年(实际30.67+视同0.33)

const engine = require('./engine/pension-engine')
const config = require('./provinces/jilin')

const input = {
  birthYear: 1976, birthMonth: 2,
  workYear: 1995, workMonth: 3,
  gender: '女',
  cityType: 'prov',  // 全省基数7322.08（非长春）
  totalYears: 31,
  sightYears: 0.33,
  avgIndex: 0.75,
  personalAcc: 112406.89,
  skipDelay: true  // 按官方表中年限，不计延迟退休
}

const r = engine.calculate(config, input)

console.log('========== 长春女性 1976-02-10 案例 ==========')
console.log('')
console.log('输入参数:')
console.log(`  出生: ${input.birthYear}年${input.birthMonth}月  性别: ${input.gender}`)
console.log(`  工作: ${input.workYear}年${input.workMonth}月  城市: ${input.cityType}`)
console.log(`  累计年限: ${input.totalYears}年  视同年限: ${input.sightYears}年  指数: ${input.avgIndex}`)
console.log(`  个人账户: ${input.personalAcc.toLocaleString()}元`)
console.log('')

// 官方值
const official = {
  basic: 1986.11,
  extra: 128.14,
  personal: 576.45,
  trans: 25.37,
  total: 2716.07
}

// 引擎值
const e = r.legal

console.log('验证结果:')
console.log(`项目          官方值      引擎值      差异`)
console.log(`-------------------------------------------------------`)

function cmp(name, o, v) {
  const diff = Math.round((v - o) * 100) / 100
  const ok = Math.abs(diff) < 0.01 ? '✅' : '❌'
  console.log(`${name.padEnd(13)} ${o.toFixed(2).padStart(8)} ${v.toFixed(2).padStart(8)} ${diff >= 0 ? '+' : ''}${diff.toFixed(2).padStart(6)} ${ok}`)
}

cmp('①基础养老金', official.basic, e.basicPension.amount)
cmp('②增发养老金', official.extra, e.extraPension.amount)
cmp('③个人账户', official.personal, e.personalAccount.amount)
cmp('④过渡性养老金', official.trans, e.transitionalPension.amount)
console.log('-------------------------------------------------------')
const eTotal = e.basicPension.amount + e.extraPension.amount + e.personalAccount.amount + e.transitionalPension.amount
cmp('合计', official.total, eTotal)

console.log('')
console.log('引擎详细说明:')
console.log('  ' + e.basicPension.description)
console.log('  ' + e.extraPension.description)
console.log('  ' + e.personalAccount.description)
console.log('  ' + e.transitionalPension.description)

console.log('')
console.log('增发分段明细:')
if (e.extraPension.bracketDetails) {
  e.extraPension.bracketDetails.forEach(b => {
    console.log(`  ${b.range}年: ${b.years.toFixed(2)}年 × ${(b.rate*100).toFixed(2)}% = 系数${b.contribution.toFixed(4)} → ${b.amount.toFixed(2)}元`)
  })
}

console.log('')
console.log('关键中间值:')
console.log(`  退休地计发基数: ${e.baseRetire}`)
console.log(`  全省计发基数: ${e.baseProv}`)
console.log(`  实际缴费年限: ${e.actualYears.toFixed(2)}`)
console.log(`  退休年龄: ${e.ageStr}  计发月数: ${e.months}`)

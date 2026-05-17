/**
 * 跨引擎交叉验证
 * 对比新计算引擎(pension-engine)与缴费指数计算器(pension-calc)的测算结果
 * 
 * 目标：确保新引擎的算法逻辑与H5版本保持一致
 */

const newEngine = require('../engine/pension-engine')
const oldCalc = require('../../缴费指数计算器/utils/pension-calc')
const jilinConfig = require('../provinces/jilin.json')

let passCount = 0
let failCount = 0

function test(name, fn) {
  try {
    fn()
    passCount++
    console.log(`  ✅ ${name}`)
  } catch (e) {
    failCount++
    console.log(`  ❌ ${name}`)
    console.log(`     错误: ${e.message}`)
  }
}

function assertNear(actual, expected, tolerance, msg) {
  const diff = Math.abs(actual - expected)
  if (diff > tolerance) {
    throw new Error(msg || `期望 ${expected} (±${tolerance}), 实际 ${actual}, 差值 ${diff.toFixed(2)}`)
  }
}

// ==================== 测试场景 ====================

console.log('========================================')
console.log('📋 刘阿姨 — 1972.8 出生, 2001.4 参保, 60% 档, 长春')
console.log('========================================\n')

const liu = {
  birthYear: 1972, birthMonth: 8,
  workYear: 2001, workMonth: 4,
  avgIndex: 0.6, city: 'cc', genderType: 'fw',
  personalAcc: 0
}

// 新引擎
const liuNew = newEngine.calculate(jilinConfig, {
  name: '刘阿姨', gender: 'female', birthYear: 1972, birthMonth: 8,
  workYear: 2001, workMonth: 4, cityType: 'cc', avgIndex: 0.6
})

// 旧引擎
const liuOld = oldCalc.calculatePension({
  birthYear: 1972, birthMonth: 8,
  workYear: 2001, workMonth: 4,
  avgIndex: 0.6, city: 'cc', genderType: 'fw',
  personalAcc: 0
})

test('基础养老金差异', () => {
  assertNear(liuNew.legal.basicPension.amount, liuOld.basicPension, 1.0,
    `基础养老金: 新=${liuNew.legal.basicPension.amount}, 旧=${liuOld.basicPension}`)
})

test('个人账户养老金差异', () => {
  assertNear(liuNew.legal.personalAccount.amount, liuOld.personalPension, 1.0,
    `个人账户养老金: 新=${liuNew.legal.personalAccount.amount}, 旧=${liuOld.personalPension}`)
})

test('总养老金差异', () => {
  assertNear(liuNew.legal.total, liuOld.total, 2.0,
    `总养老金: 新=${liuNew.legal.total}, 旧=${liuOld.total}`)
})

test('缴费年限一致', () => {
  assertNear(liuNew.legal.totalYears, liuOld.totalYears, 0.01,
    `总年限: 新=${liuNew.legal.totalYears}, 旧=${liuOld.totalYears}`)
})

test('退休年龄一致', () => {
  assertNear(liuNew.legal.age, liuOld.retireAgeExact, 0.01,
    `退休年龄: 新=${liuNew.legal.age}, 旧=${liuOld.retireAgeExact}`)
})

console.log('\n========================================')
console.log('📋 赵哥 — 1976.6 出生, 2005.1 参保, 85% 档, 长春')
console.log('========================================\n')

const zhao = {
  birthYear: 1976, birthMonth: 6,
  workYear: 2005, workMonth: 1,
  avgIndex: 0.85, city: 'cc', genderType: 'male',
  personalAcc: 0
}

const zhaoNew = newEngine.calculate(jilinConfig, {
  name: '赵哥', gender: 'male', birthYear: 1976, birthMonth: 6,
  workYear: 2005, workMonth: 1, cityType: 'cc', avgIndex: 0.85
})

const zhaoOld = oldCalc.calculatePension({
  birthYear: 1976, birthMonth: 6,
  workYear: 2005, workMonth: 1,
  avgIndex: 0.85, city: 'cc', genderType: 'male',
  personalAcc: 0
})

test('基础养老金差异', () => {
  assertNear(zhaoNew.legal.basicPension.amount, zhaoOld.basicPension, 1.0)
})

test('个人账户养老金差异', () => {
  assertNear(zhaoNew.legal.personalAccount.amount, zhaoOld.personalPension, 1.0)
})

test('总养老金差异', () => {
  assertNear(zhaoNew.legal.total, zhaoOld.total, 2.0)
})

test('缴费年限一致', () => {
  assertNear(zhaoNew.legal.totalYears, zhaoOld.totalYears, 0.01)
})

test('延迟月数一致', () => {
  const newDelay = zhaoNew.legalTotalMonths - 60 * 12
  const oldDelay = zhaoOld.legalTotalMonths - 60 * 12
  assertNear(newDelay, oldDelay, 1.0, `延迟月数: 新=${newDelay}, 旧=${oldDelay}`)
})

console.log('\n========================================')
console.log('📋 孙姐 — 1978.3 出生, 2000.1 参保, 100% 档, 全省')
console.log('========================================\n')

const sunNew = newEngine.calculate(jilinConfig, {
  name: '孙姐', gender: 'female', birthYear: 1978, birthMonth: 3,
  workYear: 2000, workMonth: 1, cityType: 'prov', avgIndex: 1.0
})

const sunOld = oldCalc.calculatePension({
  birthYear: 1978, birthMonth: 3,
  workYear: 2000, workMonth: 1,
  avgIndex: 1.0, city: 'prov', genderType: 'fw',
  personalAcc: 0
})

test('基础养老金差异', () => {
  assertNear(sunNew.legal.basicPension.amount, sunOld.basicPension, 1.0)
})

test('个人账户养老金差异', () => {
  assertNear(sunNew.legal.personalAccount.amount, sunOld.personalPension, 1.0)
})

test('总养老金差异', () => {
  assertNear(sunNew.legal.total, sunOld.total, 2.0)
})

test('退休年龄一致', () => {
  assertNear(sunNew.legal.age, sunOld.retireAgeExact, 0.01)
})

console.log('\n========================================')
console.log('📋 刘忠辉 — 1983.4 出生, 2006.1 参保, 100% 档, 长春')
console.log('========================================\n')

const liuZhonghuiNew = newEngine.calculate(jilinConfig, {
  name: '刘忠辉', gender: 'male', birthYear: 1983, birthMonth: 4,
  workYear: 2006, workMonth: 1, cityType: 'cc', avgIndex: 1.0
})

const liuZhonghuiOld = oldCalc.calculatePension({
  birthYear: 1983, birthMonth: 4,
  workYear: 2006, workMonth: 1,
  avgIndex: 1.0, city: 'cc', genderType: 'male',
  personalAcc: 0
})

test('基础养老金差异', () => {
  assertNear(liuZhonghuiNew.legal.basicPension.amount, liuZhonghuiOld.basicPension, 1.0)
})

test('个人账户养老金差异', () => {
  assertNear(liuZhonghuiNew.legal.personalAccount.amount, liuZhonghuiOld.personalPension, 1.0)
})

test('总养老金差异', () => {
  assertNear(liuZhonghuiNew.legal.total, liuZhonghuiOld.total, 2.0)
})

test('缴费基数一致', () => {
  assertNear(liuZhonghuiNew.legal.baseRetire, liuZhonghuiOld.baseRetire, 0.01)
  assertNear(liuZhonghuiNew.legal.baseProv, liuZhonghuiOld.baseProv, 0.01)
})

console.log('\n========================================')
console.log('📋 用户输入个人账户余额测试')
console.log('========================================\n')

// 用户输入个人账户余额时，新旧引擎应一致
const inputAcc = 50000

const accNew = newEngine.calculate(jilinConfig, {
  name: '输入余额', gender: 'male', birthYear: 1964, birthMonth: 1,
  workYear: 2000, workMonth: 1, cityType: 'cc', avgIndex: 1.0, personalAcc: inputAcc
})

const accOld = oldCalc.calculatePension({
  birthYear: 1964, birthMonth: 1,
  workYear: 2000, workMonth: 1,
  avgIndex: 1.0, city: 'cc', genderType: 'male',
  personalAcc: inputAcc
})

test('个人账户养老金一致', () => {
  const expected = Math.round(inputAcc / 139 * 100) / 100
  assertNear(accNew.legal.personalAccount.amount, expected, 0.01,
    `新=${accNew.legal.personalAccount.amount}, 期望=${expected}`)
  assertNear(accOld.personalPension, expected, 0.01,
    `旧=${accOld.personalPension}, 期望=${expected}`)
})

console.log('\n========================================')
console.log('📋 延迟退休计算验证')
console.log('========================================\n')

// 验证延迟月数
const male1965 = oldCalc.getDelayMonths(1965, 1, 'male')
const male1970 = oldCalc.getDelayMonths(1970, 1, 'male')
const male1990 = oldCalc.getDelayMonths(1990, 1, 'male')
const male2000 = oldCalc.getDelayMonths(2000, 1, 'male')

test('延迟月数 — 1965男', () => {
  assertNear(newEngine.getDelayMonths(1965, 1, 'male'), male1965, 0.1)
})
test('延迟月数 — 1970男', () => {
  assertNear(newEngine.getDelayMonths(1970, 1, 'male'), male1970, 0.1)
})
test('延迟月数 — 1990男', () => {
  assertNear(newEngine.getDelayMonths(1990, 1, 'male'), male1990, 0.1)
})
test('延迟月数 — 1990+封顶36', () => {
  const d = newEngine.getDelayMonths(2000, 1, 'male')
  if (d > 36) throw new Error(`2000年男性延迟${d}超过封顶36`)
})

// 验证计发月数
test('计发月数 — 50岁', () => {
  assertNear(newEngine.getRetireMonths(50, jilinConfig), 195, 0.1)
})
test('计发月数 — 55岁', () => {
  assertNear(newEngine.getRetireMonths(55, jilinConfig), 170, 0.1)
})
test('计发月数 — 60岁', () => {
  assertNear(newEngine.getRetireMonths(60, jilinConfig), 139, 0.1)
})

console.log('\n========================================')
console.log('📋 跨平台一致性验证')
console.log('========================================\n')

const input1 = {
  name: '一致性', gender: 'male', birthYear: 1976, birthMonth: 6,
  workYear: 2005, workMonth: 1, cityType: 'cc', avgIndex: 0.85
}

const r1 = newEngine.calculate(jilinConfig, input1)
const r2 = newEngine.calculate(jilinConfig, { ...input1, avgIndex: '0.85' }) // 字符串类型

test('字符串 vs 数字输入一致', () => {
  assertNear(r1.legal.total, r2.legal.total, 0.01)
  assertNear(r1.legal.basicPension.amount, r2.legal.basicPension.amount, 0.01)
})

test('多次调用结果一致', () => {
  const r3 = newEngine.calculate(jilinConfig, input1)
  assertNear(r1.legal.total, r3.legal.total, 0.01)
})

console.log('\n========================================')
console.log('📋 基础数据查询验证')
console.log('========================================\n')

test('全省基数 — 2024', () => {
  assertNear(newEngine.getBase('prov', 2024, jilinConfig), 7178.50, 0.01)
})
test('长春基数 — 2025', () => {
  assertNear(newEngine.getBase('cc', 2025, jilinConfig), 7978.25, 0.01)
})
test('后向匹配 — 2026', () => {
  assertNear(newEngine.getBase('prov', 2026, jilinConfig), 7322.08, 0.01)
})
test('记账利率 — 2024', () => {
  assertNear(newEngine.getAccRate(2024, jilinConfig), 0.0262, 0.0001)
})
test('记账利率 — 缺失回退', () => {
  assertNear(newEngine.getAccRate(2050, jilinConfig), 0.015, 0.0001)
})

console.log('\n========================================')
console.log('📊 交叉验证结果汇总')
console.log('========================================')
console.log(`  通过: ${passCount}`)
console.log(`  失败: ${failCount}`)
console.log(`  总计: ${passCount + failCount}`)
console.log(`  通过率: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`)
console.log('========================================')

if (failCount > 0) {
  console.log('\n⚠️ 存在失败的交叉验证用例')
  process.exit(1)
} else {
  console.log('\n✅ 所有交叉验证通过！新旧引擎结果一致')
  process.exit(0)
}

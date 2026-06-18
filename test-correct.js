// 本地测试：模拟云函数调用（用正确的驼峰字段名）
const path = require('path')
const fs = require('fs')

// 加载引擎和配置
const engine = require('./engine/pension-engine.js')
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'provinces/jilin.json'), 'utf-8'))

// 正确的输入格式（驼峰，和 verify.js 一致）
const input = {
  gender: 'male',
  identity: 'employee',
  birthYear: 1965,
  birthMonth: 8,
  workYear: 1985,
  workMonth: 7,
  avgIndex: 1.2,
  personalAccInput: 85000,
  skipDelay: true
}

console.log('📋 输入参数:', input)
console.log('\n🧮 开始计算...')

try {
  const result = engine.calculate(config, input)
  const d = result.legal
  console.log('\n✅ 计算成功！')
  console.log('  月基本养老金:', d.total, '元')
  console.log('  基础养老金:', d.basicPension?.amount, '元')
  console.log('  个人账户养老金:', d.personalAccountPension?.amount, '元')
  console.log('  过渡性养老金:', d.transitionalPension?.amount, '元')
  console.log('  法定退休年龄:', d.ageStr)
  console.log('  累计缴费年限:', d.totalYears, '年')
} catch (e) {
  console.error('❌ 失败:', e.message, e.stack)
}

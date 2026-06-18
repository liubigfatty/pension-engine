// 本地测试云函数
const path = require('path')
const fs = require('fs')

// 加载云函数
const cloudFunctionPath = path.join(__dirname, 'cloudfunctions/calculate/index.js')

// 模拟 event 参数（和小程序调用时传的一样）
const testEvent = {
  province: 'jilin',
  city: '',
  gender: 'male',
  identity: 'employee',
  birthDate: '1965-08',
  workStartDate: '1985-07',
  averageIndex: 1.2,
  personalAccount: 85000,
  extras: {}
}

console.log('📋 测试参数:')
console.log(JSON.stringify(testEvent, null, 2))

// 直接调用云函数逻辑
async function test() {
  try {
    // 加载引擎
    const engine = require('./cloudfunctions/calculate/pension-engine')
    console.log('\n✅ 引擎加载成功, 导出函数:', Object.keys(engine))
    
    // 加载省份配置
    const configPath = path.join(__dirname, 'cloudfunctions/calculate/provinces/jilin.json')
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
    console.log('✅ 省份配置加载成功:', config.provinceName)
    
    // 构造输入参数（和云函数里一样）
    const input = {
      gender: testEvent.gender,
      identity: testEvent.identity,
      birthDate: testEvent.birthDate,
      workStartDate: testEvent.workStartDate,
      averageIndex: parseFloat(testEvent.averageIndex),
      personalAccount: parseFloat(testEvent.personalAccount),
      extras: testEvent.extras || {}
    }
    
    // 调用计算
    console.log('\n🧮 开始计算...')
    const result = engine.calculate(config, input)
    
    console.log('\n✅ 计算成功！')
    console.log('\n📊 计算结果:')
    console.log('  月基本养老金:', result.legal.total, '元')
    console.log('  基础养老金:', result.legal.basicPension, '元')
    console.log('  个人账户养老金:', result.legal.personalAccountPension, '元')
    console.log('  过渡性养老金:', result.legal.transitionalPension?.amount || 0, '元')
    console.log('  法定退休年龄:', result.legal.ageStr)
    console.log('  法定退休日期:', result.legal.date?.join('-'))
    
  } catch (err) {
    console.error('\n❌ 测试失败:', err.message)
    console.error(err.stack)
  }
}

test()

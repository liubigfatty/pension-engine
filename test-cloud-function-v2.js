// 本地测试云函数 - 正确版本
const path = require('path')
const fs = require('fs')

// 加载云函数模块
const cloudFunction = require('./cloudfunctions/calculate/index.js')

// 测试参数（模拟小程序调用）
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

// 调用云函数
async function test() {
  try {
    console.log('\n🚀 调用云函数...')
    const result = await cloudFunction.main(testEvent)
    
    console.log('\n📊 云函数返回:')
    console.log(JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('\n✅ 计算成功！')
      const data = result.data
      console.log('\n📈 详细结果:')
      console.log('  月基本养老金:', data.legal?.total, '元')
      console.log('  基础养老金:', data.legal?.basicPension?.amount, '元')
      console.log('  个人账户养老金:', data.legal?.personalAccountPension?.amount, '元')
      console.log('  过渡性养老金:', data.legal?.transitionalPension?.amount, '元')
      console.log('  法定退休年龄:', data.legal?.ageStr)
      console.log('  法定退休日期:', data.legal?.date?.join('-'))
    } else {
      console.log('\n❌ 计算失败:', result.message)
    }
    
  } catch (err) {
    console.error('\n❌ 测试失败:', err.message)
    console.error(err.stack)
  }
}

test()

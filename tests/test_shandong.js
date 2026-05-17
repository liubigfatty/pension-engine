/**
 * 山东省养老金配置测试
 * 验证山东配置数据完整性和引擎兼容性
 */

const fs = require('fs');
const path = require('path');

const engine = require('../engine/pension-engine');
const config = require('../provinces/shandong.json');

console.log('📋 山东省养老金配置测试');
console.log('='.repeat(50));

// 测试用例
const testCases = [
  {
    name: '山东男职工（普通档）',
    input: {
      name: '刘伟',
      gender: 'male',
      birthYear: 1975,
      birthMonth: 6,
      workYear: 1996,
      workMonth: 1,
      cityType: 'prov',
      avgIndex: 0.8,
      retireType: 'standard',
      personalAccInput: ''
    }
  },
  {
    name: '山东女工人（灵活就业）',
    input: {
      name: '王芳',
      gender: 'female',
      birthYear: 1978,
      birthMonth: 3,
      workYear: 1998,
      workMonth: 6,
      cityType: 'prov',
      avgIndex: 0.6,
      retireType: 'flexible',
      retireAge: 'fw',
      personalAccInput: ''
    }
  },
  {
    name: '山东老职工（含视同缴费）',
    input: {
      name: '张建国',
      gender: 'male',
      birthYear: 1965,
      birthMonth: 1,
      workYear: 1985,
      workMonth: 3,
      cityType: 'prov',
      avgIndex: 1.0,
      sightYears: 11,
      retireType: 'standard',
      personalAccInput: ''
    }
  },
  {
    name: '青岛职工（特殊基数）',
    input: {
      name: '李娜',
      gender: 'female',
      birthYear: 1980,
      birthMonth: 9,
      workYear: 2002,
      workMonth: 5,
      cityType: 'qd',
      avgIndex: 1.2,
      retireType: 'standard',
      personalAccInput: ''
    }
  }
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  try {
    const result = engine.calculate(config, tc.input);
    const legal = result.legal;
    const flex = result.flex;
    
    console.log(`\n📋 ${tc.name}`);
    console.log(`  退休日期: ${legal.date.year}年${legal.date.month}月`);
    console.log(`  退休年龄: ${legal.ageStr}`);
    console.log(`  缴费年限: ${legal.totalYears.toFixed(2)}年`);
    console.log(`  基础养老金: ${legal.basicPension.amount.toFixed(2)}元`);
    console.log(`  个人账户养老金: ${legal.personalAccount.amount.toFixed(2)}元`);
    console.log(`  过渡性养老金: ${legal.transitionalPension.amount.toFixed(2)}元`);
    console.log(`  月养老金总额: ${legal.total.toFixed(2)}元`);
    
    if (legal.total && legal.total > 0) {
      console.log(`  ✅ 通过`);
      passed++;
    } else {
      console.log(`  ❌ 结果为0，失败`);
      failed++;
    }
    
    // 弹性提前退休
    if (flex && flex.date) {
      console.log(`  弹性提前退休: ${flex.date.year}年${flex.date.month}月, 月领: ${flex.total.toFixed(2)}元`);
    }
  } catch (e) {
    console.log(`\n❌ ${tc.name} - 异常: ${e.message}`);
    failed++;
  }
}

console.log('\n' + '='.repeat(50));
console.log(`📊 测试结果: ${passed}通过, ${failed}失败, ${passed + failed}总计`);
console.log(`通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

process.exit(failed > 0 ? 1 : 0);

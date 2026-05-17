/**
 * 河北省养老金测算测试
 */

const fs = require('fs');
const path = require('path');
const engine = require('../engine/pension-engine');

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../provinces/hebei.json'), 'utf8'));

const testCases = [
  {
    name: '河北男职工（1997年入职，普通档）',
    input: {
      name: '赵哥',
      gender: 'male',
      birthYear: 1975,
      birthMonth: 6,
      workYear: 1997,
      workMonth: 1,
      avgIndex: 1.0,
      cityType: 'prov',
      retireType: 'standard',
      personalAccInput: null,
      sightYears: 0
    }
  },
  {
    name: '河北女工人（1998年灵活就业）',
    input: {
      name: '刘阿姨',
      gender: 'female',
      birthYear: 1978,
      birthMonth: 3,
      workYear: 1998,
      workMonth: 1,
      avgIndex: 0.6,
      cityType: 'prov',
      retireType: 'flexible',
      personalAccInput: null,
      sightYears: 0
    }
  },
  {
    name: '河北老职工（含视同缴费12年）',
    input: {
      name: '王师傅',
      gender: 'male',
      birthYear: 1965,
      birthMonth: 3,
      workYear: 1985,
      workMonth: 1,
      avgIndex: 0.9,
      cityType: 'prov',
      retireType: 'standard',
      personalAccInput: null,
      sightYears: 12
    }
  }
];

let passed = 0;
let failed = 0;

console.log('========== 河北省养老金测算测试 ==========\n');

testCases.forEach((tc, i) => {
  try {
    const result = engine.calculate(config, tc.input);
    const legal = result.legal;
    
    let success = true;
    let msg = '';
    
    if (!legal || !legal.total) {
      success = false;
      msg = '计算结果为空';
    }
    
    if (success) {
      passed++;
      console.log(`✅ 测试 ${i + 1}: ${tc.name}`);
      console.log(`   月领养老金: ${legal.total?.toFixed(2) || 0} 元`);
      console.log(`   基础养老金: ${legal.basicPension?.amount?.toFixed(2) || 0} 元`);
      console.log(`   个人账户养老金: ${legal.personalAccount?.amount?.toFixed(2) || 0} 元`);
      console.log(`   过渡性养老金: ${legal.transitionalPension?.amount?.toFixed(2) || 0} 元`);
      console.log(`   退休日期: ${legal.date?.year}年${legal.date?.month}月`);
    } else {
      failed++;
      console.log(`❌ 测试 ${i + 1}: ${tc.name}`);
      console.log(`   失败原因: ${msg}`);
    }
    console.log('');
  } catch (e) {
    failed++;
    console.log(`❌ 测试 ${i + 1}: ${tc.name}`);
    console.log(`   异常: ${e.message}`);
    console.log('');
  }
});

console.log(`\n========== 测试结果 ==========`);
console.log(`通过: ${passed}, 失败: ${failed}, 总计: ${testCases.length}, 通过率: ${(passed / testCases.length * 100).toFixed(1)}%`);

process.exit(failed > 0 ? 1 : 0);
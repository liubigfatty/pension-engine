/**
 * 快速交叉验证：4个全新案例，每个只跑一次
 * 黑龙江/湖南/辽宁/北京 — 从未验证过的案例
 */

const path = require('path');
const engine = require(path.join(__dirname, '..', 'engine', 'pension-engine.js'));
const fs = require('fs');

// 省份映射
const provinceConfigs = {
  'heilongjiang': require(path.join(__dirname, '..', 'provinces', 'heilongjiang.json')),
  'hunan': null,  // 湖南暂无配置，用吉林近似
  'liaoning': require(path.join(__dirname, '..', 'provinces', 'liaoning.json')),
  'beijing': null,  // 北京暂无配置，用吉林近似
};

// 4个案例
const cases = [
  {
    name: '黑龙江-灵活就业女',
    province: 'heilongjiang',
    config: provinceConfigs['heilongjiang'],
    input: {
      name: '黑龙江灵活就业女',
      gender: 'female',
      retireType: 'standard',
      cityType: 'prov',
      birthYear: 1970,
      birthMonth: 9,
      workYear: 2010,
      workMonth: 5,
      avgIndex: 0.758,
      personalAcc: 69743.68
    },
    expected: {
      total: 1436.09,
      basic: 1025.83,
      personal: 410.26,
      transitional: 0.0
    },
    notes: '纯实际缴费，无视同年限，提前退休'
  },
  {
    name: '湖南-企退女(低指数)',
    province: 'hunan',
    config: provinceConfigs['hunan'],  // 用吉林近似
    input: {
      name: '湖南企退女',
      gender: 'female',
      retireType: 'standard',
      cityType: 'prov',
      birthYear: 1973,  // 2024-50=1974, 但计发月数195→50岁
      birthMonth: 1,
      workYear: 1992,  // 1995-2.83≈1992.17
      workMonth: 5,
      avgIndex: 0.6444,
      personalAcc: 70341.99
    },
    expected: {
      total: 2427.02,
      basic: 1890.46,
      personal: 360.73,
      transitional: 175.84
    },
    notes: '31年缴费，视同2.83年，低指数0.6444，计发月数195'
  },
  {
    name: '辽宁-大连男(高指数)',
    province: 'liaoning',
    config: provinceConfigs['liaoning'],
    input: {
      name: '辽宁大连男',
      gender: 'male',
      retireType: 'standard',
      cityType: 'prov',
      birthYear: 1965,
      birthMonth: 1,
      workYear: 1989,
      workMonth: 8,
      avgIndex: 3.42,  // 实际平均缴费工资指数
      personalAcc: 140586.46
    },
    expected: {
      total: 4521.0,
      basic: 2999.67,
      personal: 1011.41,
      transitional: 509.03
    },
    notes: '视同3.42年，实际29.58年，高指数3.42'
  },
  {
    name: '北京大兴-企退女(低指数+高基数)',
    province: 'beijing',
    config: provinceConfigs['beijing'],  // 用吉林近似
    input: {
      name: '北京大兴女',
      gender: 'female',
      retireType: 'standard',
      cityType: 'cc',  // 大兴区用市区
      birthYear: 1975,  // 2025-50=1975
      birthMonth: 1,
      workYear: 1997,
      workMonth: 7,
      avgIndex: 0.4349,
      personalAcc: 112880.41
    },
    expected: {
      total: 2981.87,
      basic: 2351.32,
      personal: 578.87,
      transitional: 51.68
    },
    notes: '纯实际缴费27年，极低指数0.4349，极高基数11883'
  }
];

console.log('='.repeat(80));
console.log('快速交叉验证 — 4个全新案例');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

for (const c of cases) {
  console.log('\n' + '-'.repeat(70));
  console.log(`案例: ${c.name}`);
  console.log(`说明: ${c.notes}`);
  console.log(`预期总额: ¥${c.expected.total}`);

  let result;
  try {
    result = engine.calculate(c.config, c.input);
  } catch (e) {
    console.log(`❌ 引擎报错: ${e.message}`);
    failCount++;
    continue;
  }

  const actual = result.legal;
  const totalDiff = Math.abs(actual.total - c.expected.total);
  const basicDiff = Math.abs(actual.basicPension.amount - c.expected.basic);
  const personalDiff = Math.abs(actual.personalAccount.amount - c.expected.personal);
  const transDiff = Math.abs(actual.transitionalPension.amount - c.expected.transitional);

  console.log(`引擎总额: ¥${actual.total}`);
  console.log(`总额误差: ${totalDiff.toFixed(2)}元 (${(totalDiff/c.expected.total*100).toFixed(1)}%)`);
  console.log(`  基础养老金: 预期${c.expected.basic} 引擎${actual.basicPension.amount} 误差${basicDiff.toFixed(2)}`);
  console.log(`  个人账户:   预期${c.expected.personal} 引擎${actual.personalAccount.amount} 误差${personalDiff.toFixed(2)}`);
  console.log(`  过渡性养老金: 预期${c.expected.transitional} 引擎${actual.transitionalPension.amount} 误差${transDiff.toFixed(2)}`);

  if (totalDiff <= 5) {
    console.log('✅ 通过 (误差 ≤ 5元)');
    passCount++;
  } else if (totalDiff <= 20) {
    console.log('⚠️ 基本通过 (误差 5-20元)');
    passCount++;
  } else {
    console.log(`❌ 失败 (误差 ${totalDiff.toFixed(2)}元 > 20元)`);
    failCount++;
    // 打印更多调试信息
    console.log(`  退休日期: ${actual.date.year}.${actual.date.month}`);
    console.log(`  退休年龄: ${actual.ageStr}`);
    console.log(`  累计年限: ${actual.totalYears.toFixed(2)}`);
    console.log(`  实际年限: ${actual.actualYears.toFixed(2)}`);
    console.log(`  视同年: ${actual.sightYears.toFixed(2)}`);
    console.log(`  计发月数: ${actual.months}`);
    console.log(`  退休地基数: ${actual.baseRetire}`);
    console.log(`  全省基数: ${actual.baseProv}`);
    console.log(`  基础公式: ${actual.basicPension.description}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log(`验证完成: ✅${passCount} 通过  ❌${failCount} 失败`);
console.log('='.repeat(80));

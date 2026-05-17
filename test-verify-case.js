const engine = require('./engine/pension-engine');
const config = require('./provinces/jilin.json');

// 核定表数据（2025年基数）
const input = {
  gender: 'male',
  birthYear: 1965,
  birthMonth: 6,
  workYear: 1984,
  workMonth: 10,
  avgIndex: 1.74,
  personalAccInput: 241504.89,
  totalYears: 40.75,      // 累计缴费年限（官方精确值）
  sightYears: 10.75,      // 过渡性养老金用的视同年限（官方公式中10.75年）
  cityType: 'prov',       // 市/省基数相同=7322.08，用全省基数
  skipDelay: true         // 2025年退休不受延迟退休影响
};

const result = engine.calculate(config, input);
const legal = result.legal;

console.log('=== 引擎计算结果 ===');
console.log('');

// 基础养老金
console.log('【基础养老金】');
console.log(`  引擎: ¥${legal.basicPension.amount.toFixed(2)}`);
console.log(`  官方: ¥4087.73`);
console.log(`  公式: ${legal.basicPension.description}`);
console.log(`  状态: ${Math.abs(legal.basicPension.amount - 4087.73) < 0.01 ? '✅ 匹配' : '❌ 差异'}`);
console.log('');

// 增发养老金
console.log('【增发基础养老金】');
console.log(`  引擎: ¥${legal.extraPension.amount.toFixed(2)}`);
console.log(`  官方: ¥445.13`);
console.log(`  公式: ${legal.extraPension.description}`);
console.log(`  状态: ${Math.abs(legal.extraPension.amount - 445.13) < 0.01 ? '✅ 匹配' : '❌ 差异'}`);
console.log('');

// 个人账户养老金
console.log('【个人账户养老金】');
console.log(`  引擎: ¥${legal.personalAccount.amount.toFixed(2)}`);
console.log(`  官方: ¥1737.45`);
console.log(`  公式: ${legal.personalAccount.description}`);
console.log(`  状态: ${Math.abs(legal.personalAccount.amount - 1737.45) < 0.01 ? '✅ 匹配' : '❌ 差异'}`);
console.log('');

// 过渡性养老金
console.log('【过渡性养老金】');
console.log(`  引擎: ¥${legal.transitionalPension.amount.toFixed(2)}`);
console.log(`  官方: ¥1917.43`);
console.log(`  公式: ${legal.transitionalPension.description}`);
console.log(`  状态: ${Math.abs(legal.transitionalPension.amount - 1917.43) < 0.01 ? '✅ 匹配' : '❌ 差异'}`);
console.log('');

// 合计
console.log('【月基本养老金合计】');
console.log(`  引擎: ¥${legal.total.toFixed(2)}`);
console.log(`  官方: ¥8187.74`);
console.log(`  状态: ${Math.abs(legal.total - 8187.74) < 0.01 ? '✅ 匹配' : '❌ 差异'}`);
console.log('');

// 调试信息
console.log('=== 调试信息 ===');
console.log(`  退休日期: ${legal.date.year}-${legal.date.month}`);
console.log(`  退休年龄: ${legal.ageStr}`);
console.log(`  计发月数: ${legal.months}`);
console.log(`  退休地基数: ${legal.baseRetire}`);
console.log(`  全省基数: ${legal.baseProv}`);
console.log(`  累计缴费年限: ${legal.totalYears}`);
console.log(`  视同缴费年限: ${legal.sightYears}`);
console.log(`  实际缴费年限: ${legal.actualYears}`);
console.log(`  平均缴费指数: ${legal.avgIndex}`);
console.log(`  养老金替代率: ${legal.rate.toFixed(2)}%`);

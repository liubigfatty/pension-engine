const engine = require('./engine/pension-engine');
const config = require('./provinces/jilin.json');

// 预核定表数据 — 用2024年基数（预核定的特征）
const input = {
  gender: 'male',
  birthYear: 1965,
  birthMonth: 3,
  workYear: 1982,
  workMonth: 12,
  avgIndex: 0.6,
  personalAccInput: 84719.28,
  totalYears: 42.33,       // 累计缴费年限
  sightYears: 12.58,      // 视同缴费年限（公式中直接用12.58）
  cityType: 'cc',         // 长春市
  baseRetireInput: 7852.58, // 长春市2024年基数（预核定用上年）
  baseProvInput: 7178.5,   // 全省2024年基数（预核定用上年）
  skipDelay: true          // 跳过延迟退休
};

const result = engine.calculate(config, input);
const legal = result.legal;

console.log('=== 引擎计算结果 vs 官方预核定表 ===');
console.log('');

// 基础养老金
console.log('【① 基础养老金】');
console.log(`  引擎: ¥${legal.basicPension.amount.toFixed(2)}`);
console.log(`  官方: ¥2573.60`);
console.log(`  公式: ${legal.basicPension.description}`);
console.log(`  差额: ${Math.abs(legal.basicPension.amount - 2573.6).toFixed(2)} 元`);
console.log(`  状态: ${Math.abs(legal.basicPension.amount - 2573.6) < 0.01 ? '✅ 匹配' : Math.abs(legal.basicPension.amount - 2573.6) < 0.05 ? '⚠️ 接近' : '❌ 差异'}`);
console.log('');

// 增发养老金
console.log('【② 增发养老金】');
console.log(`  引擎: ¥${legal.extraPension.amount.toFixed(2)}`);
console.log(`  官方: ¥293.61`);
console.log(`  分段详情:`);
if (legal.extraPension.bracketDetails) {
  for (const b of legal.extraPension.bracketDetails) {
    console.log(`    ${b.range}段: ${b.years}年×${b.rate*100}%=${b.amount}元`);
  }
}
console.log(`  差额: ${Math.abs(legal.extraPension.amount - 293.61).toFixed(2)} 元`);
console.log(`  状态: ${Math.abs(legal.extraPension.amount - 293.61) < 0.01 ? '✅ 匹配' : Math.abs(legal.extraPension.amount - 293.61) < 0.1 ? '⚠️ 接近' : '❌ 差异'}`);
console.log('');

// 个人账户养老金
console.log('【③ 个人账户养老金】');
console.log(`  引擎: ¥${legal.personalAccount.amount.toFixed(2)}`);
console.log(`  官方: ¥609.49`);
console.log(`  公式: ${legal.personalAccount.description}`);
console.log(`  差额: ${Math.abs(legal.personalAccount.amount - 609.49).toFixed(2)} 元`);
console.log(`  状态: ${Math.abs(legal.personalAccount.amount - 609.49) < 0.01 ? '✅ 匹配' : '❌ 差异'}`);
console.log('');

// 过渡性养老金
console.log('【④ 过渡性养老金】');
console.log(`  引擎: ¥${legal.transitionalPension.amount.toFixed(2)}`);
console.log(`  官方: ¥758.57`);
console.log(`  公式: ${legal.transitionalPension.description}`);
console.log(`  差额: ${Math.abs(legal.transitionalPension.amount - 758.57).toFixed(2)} 元`);
console.log(`  状态: ${Math.abs(legal.transitionalPension.amount - 758.57) < 0.01 ? '✅ 匹配' : '❌ 差异'}`);
console.log('');

// 合计
console.log('【月基本养老金合计】');
console.log(`  引擎: ¥${legal.total.toFixed(2)}`);
console.log(`  官方: ¥4235.47`);
console.log(`  差额: ${Math.abs(legal.total - 4235.47).toFixed(2)} 元`);
console.log(`  状态: ${Math.abs(legal.total - 4235.47) < 0.01 ? '✅ 匹配' : Math.abs(legal.total - 4235.47) < 0.1 ? '⚠️ 接近' : '❌ 差异'}`);
console.log('');

// 调试信息
console.log('=== 调试信息 ===');
console.log(`  退休日期: ${legal.date.year}-${legal.date.month}`);
console.log(`  退休年龄: ${legal.ageStr}`);
console.log(`  计发月数: ${legal.months}`);
console.log(`  退休地基数(长春): ${legal.baseRetire}`);
console.log(`  全省基数: ${legal.baseProv}`);
console.log(`  累计缴费年限: ${legal.totalYears}`);
console.log(`  视同缴费年限: ${legal.sightYears}`);
console.log(`  实际缴费年限: ${legal.actualYears}`);
console.log(`  养老金替代率: ${legal.rate?.toFixed(2) || 'N/A'}%`);

// 各项差异汇总
console.log('');
console.log('=== 差异汇总 ===');
const diffs = [
  ['基础养老金', legal.basicPension.amount, 2573.6],
  ['增发养老金', legal.extraPension.amount, 293.61],
  ['个人账户', legal.personalAccount.amount, 609.49],
  ['过渡性养老金', legal.transitionalPension.amount, 758.57],
  ['合计', legal.total, 4235.47],
];
for (const [name, eng, off] of diffs) {
  const diff = (eng - off).toFixed(2);
  console.log(`  ${name}: ${diff > 0 ? '+' : ''}${diff}元`);
}

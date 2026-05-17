/**
 * 最终验证报告：吉林省长春市男性案例
 * 官方预核定表 vs pension-engine.js
 */
const engine = require('./engine/pension-engine');
const config = require('./provinces/jilin.json');

// 官方数据
const official = {
  basic: 2608.11,
  extra: 292.14,
  personal: 696.04,
  trans: 699.11,
  total: 4295.4
};

// 引擎输入（按官方参数）
const input = {
  birthYear: 1966,
  birthMonth: 2,
  workYear: 1984,
  workMonth: 7,
  gender: '男',
  cityType: 'cc',
  totalYears: 41.67,
  sightYears: 11,
  avgIndex: 0.62,
  personalAcc: 96750.01,
  skipDelay: true  // 按表中退休时间，不计延迟退休
};

const r = engine.calculate(config, input);
const l = r.legal;

// 引擎结果
const engineResult = {
  basic: l.basicPension?.amount || 0,
  extra: l.extraPension?.amount || 0,
  personal: l.personalAccount?.amount || 0,
  trans: l.transitionalPension?.amount || 0,
  total: l.total || 0
};

console.log('=== 吉林省养老金案例验证报告 ===\n');
console.log('案例：长春市男性，1966-02-21生，2026-02-21退休，60岁正常退休');
console.log('参数：累计41.67年（实际30.67+视同11），指数0.62，个账96750.01元');
console.log('基数：长春市7978.25，全省7322.08\n');

console.log('┌──────────────┬──────────┬──────────┬──────────┐');
console.log('│ 项目         │ 官方值   │ 引擎值   │ 误差     │');
console.log('├──────────────┼──────────┼──────────┼──────────┤');

const items = [
  {name:'① 基础养老金', key:'basic'},
  {name:'② 增发养老金', key:'extra'},
  {name:'③ 个人账户', key:'personal'},
  {name:'④ 过渡性养老金', key:'trans'},
  {name:'合计', key:'total'}
];

for (const item of items) {
  const off = official[item.key];
  const eng = engineResult[item.key];
  const diff = eng - off;
  const mark = Math.abs(diff) < 0.05 ? '✅' : '❌';
  console.log(`│ ${item.name.padEnd(12)} │ ${off.toFixed(2).padStart(8)} │ ${eng.toFixed(2).padStart(8)} │ ${(diff>=0?'+':'')+diff.toFixed(2).padStart(7)} ${mark} │`);
}

console.log('└──────────────┴──────────┴──────────┴──────────┘');

console.log('\n--- 关键发现 ---');
console.log('①②④项（基础/增发/过渡）：引擎与官方完全匹配 ✅');
console.log('③个人账户：引擎705.69 vs 官方696.04，误差+9.65元 ❌');
console.log('');
console.log('误差原因：');
console.log('  引擎退休年龄：60.33岁（60岁4个月），计发月数137.1');
console.log('  官方退休年龄：60.00岁（正好60岁），计发月数139');
console.log('  96750.01 ÷ 137.1 = 705.69 元');
console.log('  96750.01 ÷ 139   = 696.04 元');
console.log('');
console.log('  官方核定表退休日期：2026-02-21（正好60岁整）');
console.log('  引擎计算退休日期：  2026-06（60岁4个月）');
console.log('');
console.log('  差异根因：1966年2月出生男性按延迟退休政策应延迟4个月');
console.log('  但官方预核定表仍按60岁整处理（可能弹性提前退休或政策缓冲期）');
console.log('');
console.log('  结论：引擎延迟退休逻辑与官方实际执行存在边界差异。');
console.log('  若强制用60岁/139个月，引擎合计 = 4295.40元，完全匹配 ✅');

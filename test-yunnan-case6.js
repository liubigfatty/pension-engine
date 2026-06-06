const engine = require('./engine/pension-engine');
const config = require('./provinces/yunnan.json');

// 精确反推：
// 基础：2123.45 = (7767 + 7767*I)/2 * 30.6667 * 0.01
// 过渡：243.77 = 7767 * 3.0833 * I * 0.013
// 联立得：P=7767, I=0.7830
const input = {
  birthYear: 1973,
  birthMonth: 4,
  workYear: 1992,
  workMonth: 9,
  genderType: 'fw',
  userType: 'standard',
  cityType: 'prov',
  sightYears: 0,
  totalYears: 30.6667,
  personalAccInput: 87022.27,
  avgIndex: 0.7830,
  baseRetireInput: 7767,
  baseProvInput: 7767,
  monthsInput: 195,
  preAccountYearsInput: 3.0833,
  skipDelay: true
};

console.log('========== 云南案例6 引擎验证（精确指数）==========');

const result = engine.calculate(config, input);
const legal = result.legal;

const oneChildSubsidy = Math.round(3158 * 0.05 * 100) / 100;

console.log('--- 对比 ---');
const compare = [
  { item: '基础养老金', engine: legal.basicPension.amount, official: 2123.45 },
  { item: '个人账户养老金', engine: legal.personalAccount.amount, official: 446.27 },
  { item: '过渡性养老金', engine: legal.transitionalPension.amount, official: 243.77 },
  { item: '小计', engine: legal.total, official: 2813.49 },
  { item: '独生子女补贴', engine: oneChildSubsidy, official: 157.9 },
  { item: '合计', engine: legal.total + oneChildSubsidy, official: 2971.39 }
];

let allPass = true;
for (const c of compare) {
  const diff = Math.abs(c.engine - c.official);
  const pass = diff < 0.02;
  if (!pass) allPass = false;
  console.log(`${c.item}: 引擎=${c.engine.toFixed(2)} 官方=${c.official.toFixed(2)} 差=${diff.toFixed(2)} ${pass ? '✅' : '❌'}`);
}

console.log(allPass ? '\n✅ 全部通过！' : '\n❌ 存在差异');
console.log(`\n指数=${input.avgIndex}, 基数=${input.baseRetireInput}, 建账前=${input.preAccountYearsInput}年`);

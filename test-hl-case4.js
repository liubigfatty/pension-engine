const engine = require('./engine/pension-engine.js');

const config = require('./provinces/heilongjiang.json');

const input = {
  birthYear: 1976,
  birthMonth: 1,
  workYear: 1992,
  workMonth: 9,
  retireYear: 2026,
  retireMonth: 1,
  gender: 'female',
  cityType: 'prov',
  avgIndex: 0.6519,
  personalAcc: 76556.96,
  totalYears: 401 / 12,
  sightYears: 40 / 12,
  baseRetire: 7705,
  baseProv: 7705,
  months: 195,
};

const result = engine.calculate(config, input);
const legal = result.legal;

console.log('=== 黑龙江案例4 验证 ===');
console.log('案例：1976年1月女/1992年9月参工/2026年1月退休');
console.log('视同40个月/实际361个月/合计401个月/平均指数0.6519');
console.log('个人账户76556.96/基数7705/计发月数195');
console.log();

const official = {
  basic: 2126.62,
  personal: 392.60,
  transitional: 200.92,
  total: 2720.14,
};

const diff = {
  basic: (legal.basicPension.amount - official.basic).toFixed(2),
  personal: (legal.personalAccount.amount - official.personal).toFixed(2),
  transitional: (legal.transitionalPension.amount - official.transitional).toFixed(2),
  total: (legal.total - official.total).toFixed(2),
};

console.log(`基础养老金：引擎=${legal.basicPension.amount} 官方=${official.basic} 差异=${diff.basic}`);
console.log(`个人账户：引擎=${legal.personalAccount.amount} 官方=${official.personal} 差异=${diff.personal}`);
console.log(`过渡性：引擎=${legal.transitionalPension.amount} 官方=${official.transitional} 差异=${diff.transitional}`);
console.log(`合计：引擎=${legal.total} 官方=${official.total} 差异=${diff.total}`);
console.log();

if (Math.abs(parseFloat(diff.total)) < 0.01) {
  console.log('✅ 全部吻合，差异0.00元');
} else {
  console.log('❌ 有差异，需排查');
}

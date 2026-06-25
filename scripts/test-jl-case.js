const engine = require('../engine/pension-engine');
const configModule = require('../data/provinces/jilin.js');
const config = configModule.getEngineConfig();

const input = {
  birthYear: 1976,
  birthMonth: 2,
  workYear: 1998,
  workMonth: 7,
  genderType: 'fw',   // 女性工人50岁退休
  avgIndex: 1.0,
  cityType: 'prov',  // 吉林只有全省统一数据，无分城市
  city: '长春',
  sightYears: 0,
};

console.log('=== 吉林（长春）案例 ===');
console.log('出生: 1976-02');
console.log('工作: 1998-07');
console.log('性别: 女性工人（50岁退休）');
console.log('缴费指数: 1.0');
console.log('城市: 长春');
console.log('');

// 检查数据
console.log('=== 数据检查 ===');
console.log('has avg_salary_history:', !!config.avg_salary_history);
if (config.avg_salary_history) {
  const ks = Object.keys(config.avg_salary_history).sort((a,b)=>a-b);
  console.log('avg_salary_history 年份:', ks[0], '~', ks[ks.length-1]);
} else {
  console.log('⚠️ 无 avg_salary_history，将用 base_rates（计发基数）代替');
  if (config.base_rates && config.base_rates.city) {
    const ck = Object.keys(config.base_rates.city).sort((a,b)=>a-b);
    console.log('base_rates.city 年份:', ck[0], '~', ck[ck.length-1]);
  }
}
console.log('');

const result = engine.calculate(config, input);

console.log('=== 计算结果 ===');
console.log('退休时间:', result.retireDate ? result.retireDate.year+'-'+result.retireDate.month : 'NULL');
console.log('缴费年限:', result.contribMonths, '月,', (result.contribMonths/12).toFixed(2), '年');
console.log('');
console.log('个人账户余额:', Math.round(result.personalAccountBalance).toLocaleString(), '元');
console.log('计发月数:', result.personalAccountPension ? result.personalAccountPension.months : '?');
console.log('个人账户养老金（月领）:', result.personalAccountPension ? result.personalAccountPension.amount.toFixed(2) : 'NULL');
console.log('');
console.log('基础养老金（月领）:', result.basicPension ? result.basicPension.amount.toFixed(2) : 'NULL');
console.log('过渡性养老金（月领）:', result.transitionalPension ? result.transitionalPension.amount.toFixed(2) : 'NULL');
console.log('');
const total = result.legal ? result.legal.total : result.total;
console.log('总养老金（月领）:', total ? total.toFixed(2) : 'NULL');

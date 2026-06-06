import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const engine = require('./engine/pension-engine.js');

// 吉林1976女 预核定表案例（官方核定值）
const input = {
  birthYear: 1976,
  birthMonth: 2,
  workYear: 1995,
  workMonth: 3,
  retireYear: 2026,
  retireMonth: 2,
  cityType: 'prov',
  personType: 'fw',
  avgIndex: 0.75,
  personalAccInput: 112406.89,
  totalYears: 31,
  sightYears: 0.33,
  baseRetireInput: 7322.08,
  baseProvInput: 7322.08,
  monthsInput: 195,
  skipDelay: true
};

const result = engine.calculate(input);

const official = {
  basic: 1986.11,
  extra: 128.14,
  personal: 576.45,
  transitional: 25.37,
  total: 2716.07
};

const calc = {
  basic: result.legal.basicPension.amount,
  extra: result.legal.basicPension.extraAmount,
  personal: result.legal.personalAccount.amount,
  transitional: result.legal.transPension.amount,
  total: result.legal.total
};

console.log('=== 吉林1976女 预核定表 验证 ===');
console.log('');
console.log('数据项          | 引擎值    | 官方值    | 差异');
console.log('----------------|------------|------------|--------');
console.log(`基础养老金      | ${calc.basic.toFixed(2).padStart(10)} | ${official.basic.toFixed(2).padStart(10)} | ${(calc.basic - official.basic).toFixed(2).padStart(8)}`);
console.log(`增发养老金      | ${calc.extra.toFixed(2).padStart(10)} | ${official.extra.toFixed(2).padStart(10)} | ${(calc.extra - official.extra).toFixed(2).padStart(8)}`);
console.log(`个人账户养老金  | ${calc.personal.toFixed(2).padStart(10)} | ${official.personal.toFixed(2).padStart(10)} | ${(calc.personal - official.personal).toFixed(2).padStart(8)}`);
console.log(`过渡性养老金    | ${calc.transitional.toFixed(2).padStart(10)} | ${official.transitional.toFixed(2).padStart(10)} | ${(calc.transitional - official.transitional).toFixed(2).padStart(8)}`);
console.log(`合计              | ${calc.total.toFixed(2).padStart(10)} | ${official.total.toFixed(2).padStart(10)} | ${(calc.total - official.total).toFixed(2).padStart(8)}`);
console.log('');
console.log('个人账户余额(输入):', input.personalAccInput);
console.log('个人账户余额(引擎):', result.metaData.personalAccBalance);
console.log('');
// 判断
const maxDiff = Math.max(
  Math.abs(calc.basic - official.basic),
  Math.abs(calc.extra - official.extra),
  Math.abs(calc.personal - official.personal),
  Math.abs(calc.transitional - official.transitional),
  Math.abs(calc.total - official.total)
);
if (maxDiff < 0.01) {
  console.log('✅ 全部通过，无偏移');
} else {
  console.log(`⚠️ 最大差异: ${maxDiff.toFixed(2)} 元`);
}

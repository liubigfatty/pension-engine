/**
 * 黑龙江省养老金测算专项测试
 */
const path = require('path');
const config = require(path.join(__dirname, '..', 'provinces', 'heilongjiang.json'));
const engine = require(path.join(__dirname, '..', 'engine', 'pension-engine'));

console.log('\n========== 黑龙江省养老金测算测试 ==========');

// 测试1：男职工 - 1975.6出生，2000.1参保，企业职工，100%档
console.log('\n📋 测试1: 男职工（1975.6，企业职工）');
const test1 = {
  name: '职工1',
  gender: 'male',
  birthYear: 1975,
  birthMonth: 6,
  workYear: 2000,
  workMonth: 1,
  avgIndex: 1.0,
  cityType: 'prov',
  retireType: 'standard',
  personalAccInput: null,
  sightYears: 0
};
const result1 = engine.calculate(config, test1);
console.log('  月领养老金:', result1.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', result1.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', result1.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', result1.legal.date ? `${result1.legal.date.year}年${result1.legal.date.month}月` : '-');
console.log('  退休年龄:', result1.legal.ageStr || '-');

let pass1 = true;
if (result1.legal.total <= 0) { console.log('  ❌ 总额为零'); pass1 = false; }
if (result1.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass1 = false; }
if (!result1.legal.date) { console.log('  ❌ 无退休日期'); pass1 = false; }
if (pass1) console.log('  ✅ 通过');

// 测试2：女工人 - 1972.8出生，1995.7参保，灵活就业，80%档
console.log('\n📋 测试2: 女工人（1972.8，灵活就业）');
const test2 = {
  name: '职工2',
  gender: 'female',
  birthYear: 1972,
  birthMonth: 8,
  workYear: 1995,
  workMonth: 7,
  avgIndex: 0.8,
  cityType: 'prov',
  retireType: 'flexible',
  personalAccInput: null,
  sightYears: 0
};
const result2 = engine.calculate(config, test2);
console.log('  月领养老金:', result2.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', result2.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', result2.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', result2.legal.date ? `${result2.legal.date.year}年${result2.legal.date.month}月` : '-');
console.log('  退休年龄:', result2.legal.ageStr || '-');

let pass2 = true;
if (result2.legal.total <= 0) { console.log('  ❌ 总额为零'); pass2 = false; }
if (result2.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass2 = false; }
if (!result2.legal.date) { console.log('  ❌ 无退休日期'); pass2 = false; }
if (pass2) console.log('  ✅ 通过');

// 测试3：老职工 - 1968.3出生，1990.1参保，含视同缴费10年
console.log('\n📋 测试3: 老职工（1968.3，含视同缴费10年）');
const test3 = {
  name: '职工3',
  gender: 'male',
  birthYear: 1968,
  birthMonth: 3,
  workYear: 1990,
  workMonth: 1,
  avgIndex: 0.85,
  cityType: 'prov',
  retireType: 'standard',
  personalAccInput: null,
  sightYears: 10
};
const result3 = engine.calculate(config, test3);
console.log('  月领养老金:', result3.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', result3.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', result3.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  过渡性养老金:', result3.legal.transitionalPension?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', result3.legal.date ? `${result3.legal.date.year}年${result3.legal.date.month}月` : '-');
console.log('  退休年龄:', result3.legal.ageStr || '-');

let pass3 = true;
if (result3.legal.total <= 0) { console.log('  ❌ 总额为零'); pass3 = false; }
if (result3.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass3 = false; }
if (result3.legal.personalAccount.amount <= 0) { console.log('  ❌ 个人账户养老金为零'); pass3 = false; }
if (result3.legal.transitionalPension.amount <= 0) { console.log('  ❌ 过渡性养老金为零（应有视同缴费）'); pass3 = false; }
if (!result3.legal.date) { console.log('  ❌ 无退休日期'); pass3 = false; }
if (pass3) console.log('  ✅ 通过');

console.log('\n========== 测试结果 ==========');
const total = 3;
const passCount = [pass1, pass2, pass3].filter(Boolean).length;
console.log(`通过: ${passCount}, 失败: ${total - passCount}, 总计: ${total}, 通过率: ${(passCount / total * 100).toFixed(1)}%`);

process.exit(passCount === total ? 0 : 1);

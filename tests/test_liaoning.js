/**
 * 辽宁省养老金测算专项测试
 */
const path = require('path');
const config = require(path.join(__dirname, '..', 'provinces', 'liaoning.json'));
const engine = require(path.join(__dirname, '..', 'engine', 'pension-engine'));

console.log('\n========== 辽宁省养老金测算测试 ==========');

// 测试1：赵哥 - 1975.6出生，2000.1参保，企业职工，100%档，沈阳
console.log('\n📋 测试1: 赵哥（男，1975.6，沈阳）');
const zhao = {
  name: '赵哥',
  gender: 'male',
  birthYear: 1975,
  birthMonth: 6,
  workYear: 2000,
  workMonth: 1,
  avgIndex: 1.0,
  cityType: 'sy',
  retireType: 'standard',
  personalAccInput: null,
  sightYears: 0
};
const zhaoResult = engine.calculate(config, zhao);
console.log('  月领养老金:', zhaoResult.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', zhaoResult.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', zhaoResult.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', zhaoResult.legal.date ? `${zhaoResult.legal.date.year}年${zhaoResult.legal.date.month}月` : '-');
console.log('  退休年龄:', zhaoResult.legal.ageStr || '-');
console.log('  退休地计发基数:', zhaoResult.legal.baseRetire?.toLocaleString() || '-');

let pass1 = true;
if (zhaoResult.legal.total <= 0) { console.log('  ❌ 总额为零'); pass1 = false; }
if (zhaoResult.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass1 = false; }
if (zhaoResult.legal.personalAccount.amount <= 0) { console.log('  ❌ 个人账户养老金为零'); pass1 = false; }
if (!zhaoResult.legal.date) { console.log('  ❌ 无退休日期'); pass1 = false; }
if (pass1) console.log('  ✅ 通过');

// 测试2：刘阿姨 - 1972.8出生，1995.7参保，灵活就业，80%档，全省
console.log('\n📋 测试2: 刘阿姨（女，1972.8，灵活就业）');
const liu = {
  name: '刘阿姨',
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
const liuResult = engine.calculate(config, liu);
console.log('  月领养老金:', liuResult.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', liuResult.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', liuResult.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', liuResult.legal.date ? `${liuResult.legal.date.year}年${liuResult.legal.date.month}月` : '-');
console.log('  退休年龄:', liuResult.legal.ageStr || '-');

let pass2 = true;
if (liuResult.legal.total <= 0) { console.log('  ❌ 总额为零'); pass2 = false; }
if (liuResult.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass2 = false; }
if (!liuResult.legal.date) { console.log('  ❌ 无退休日期'); pass2 = false; }
if (pass2) console.log('  ✅ 通过');

// 测试3：王哥 - 1968.3出生，1990.1参保，企业职工，85%档，含视同缴费10年，大连
console.log('\n📋 测试3: 王哥（男，1968.3，大连）');
const wang = {
  name: '王哥',
  gender: 'male',
  birthYear: 1968,
  birthMonth: 3,
  workYear: 1990,
  workMonth: 1,
  avgIndex: 0.85,
  cityType: 'dl',
  retireType: 'standard',
  personalAccInput: null,
  sightYears: 10
};
const wangResult = engine.calculate(config, wang);
console.log('  月领养老金:', wangResult.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', wangResult.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', wangResult.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  过渡性养老金:', wangResult.legal.transitionalPension?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', wangResult.legal.date ? `${wangResult.legal.date.year}年${wangResult.legal.date.month}月` : '-');
console.log('  退休年龄:', wangResult.legal.ageStr || '-');

let pass3 = true;
if (wangResult.legal.total <= 0) { console.log('  ❌ 总额为零'); pass3 = false; }
if (wangResult.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass3 = false; }
if (wangResult.legal.personalAccount.amount <= 0) { console.log('  ❌ 个人账户养老金为零'); pass3 = false; }
if (wangResult.legal.transitionalPension.amount <= 0) { console.log('  ❌ 过渡性养老金为零（应有视同缴费）'); pass3 = false; }
if (!wangResult.legal.date) { console.log('  ❌ 无退休日期'); pass3 = false; }
if (pass3) console.log('  ✅ 通过');

console.log('\n========== 测试结果 ==========');
const total = 3;
const passCount = [pass1, pass2, pass3].filter(Boolean).length;
console.log(`通过: ${passCount}, 失败: ${total - passCount}, 总计: ${total}, 通过率: ${(passCount / total * 100).toFixed(1)}%`);

process.exit(passCount === total ? 0 : 1);

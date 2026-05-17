/**
 * 吉林省养老金测算专项测试
 */
const path = require('path');
const config = require(path.join(__dirname, '..', 'provinces', 'jilin.json'));
const engine = require(path.join(__dirname, '..', 'engine', 'pension-engine'));

console.log('\n========== 吉林省养老金测算测试 ==========');

// 测试1：刘阿姨 - 1972.8出生，2001.4参保，灵活就业，60%→80%→60%混档
console.log('\n📋 测试1: 刘阿姨（女，1972.8，灵活就业）');
const liu = {
  name: '刘阿姨',
  gender: 'female',
  birthYear: 1972,
  birthMonth: 8,
  workYear: 2001,
  workMonth: 4,
  avgIndex: 0.6,
  cityType: 'cc',
  retireType: 'flexible',
  personalAccInput: null,
  sightYears: 0
};
const liuResult = engine.calculate(config, liu);
console.log('  月领养老金:', liuResult.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', liuResult.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  增发养老金:', liuResult.legal.extraPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', liuResult.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  过渡性养老金:', liuResult.legal.transitionalPension?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', liuResult.legal.date ? `${liuResult.legal.date.year}年${liuResult.legal.date.month}月` : '-');
console.log('  退休年龄:', liuResult.legal.ageStr || '-');

// 验证
let pass1 = true;
if (liuResult.legal.total <= 0) { console.log('  ❌ 总额为零'); pass1 = false; }
if (liuResult.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass1 = false; }
if (liuResult.legal.personalAccount.amount <= 0) { console.log('  ❌ 个人账户养老金为零'); pass1 = false; }
if (!liuResult.legal.date) { console.log('  ❌ 无退休日期'); pass1 = false; }
if (pass1) console.log('  ✅ 通过');

// 测试2：赵哥 - 1976.6出生，2005.1参保，企业职工，85%档，长春
console.log('\n📋 测试2: 赵哥（男，1976.6，企业职工）');
const zhao = {
  name: '赵哥',
  gender: 'male',
  birthYear: 1976,
  birthMonth: 6,
  workYear: 2005,
  workMonth: 1,
  avgIndex: 0.85,
  cityType: 'cc',
  retireType: 'standard',
  personalAccInput: null,
  sightYears: 0
};
const zhaoResult = engine.calculate(config, zhao);
console.log('  月领养老金:', zhaoResult.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', zhaoResult.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  增发养老金:', zhaoResult.legal.extraPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', zhaoResult.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', zhaoResult.legal.date ? `${zhaoResult.legal.date.year}年${zhaoResult.legal.date.month}月` : '-');
console.log('  退休年龄:', zhaoResult.legal.ageStr || '-');

let pass2 = true;
if (zhaoResult.legal.total <= 0) { console.log('  ❌ 总额为零'); pass2 = false; }
if (zhaoResult.legal.extraPension.amount <= 0) { console.log('  ❌ 增发养老金为零（吉林应有增发）'); pass2 = false; }
if (!zhaoResult.legal.date) { console.log('  ❌ 无退休日期'); pass2 = false; }
if (pass2) console.log('  ✅ 通过');

// 测试3：孙姐 - 1978.3出生，2000.1参保，灵活就业，100%档，全省
console.log('\n📋 测试3: 孙姐（女，1978.3，灵活就业）');
const sun = {
  name: '孙姐',
  gender: 'female',
  birthYear: 1978,
  birthMonth: 3,
  workYear: 2000,
  workMonth: 1,
  avgIndex: 1.0,
  cityType: 'prov',
  retireType: 'flexible',
  personalAccInput: null,
  sightYears: 0
};
const sunResult = engine.calculate(config, sun);
console.log('  月领养老金:', sunResult.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', sunResult.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', sunResult.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', sunResult.legal.date ? `${sunResult.legal.date.year}年${sunResult.legal.date.month}月` : '-');
console.log('  退休年龄:', sunResult.legal.ageStr || '-');

let pass3 = true;
if (sunResult.legal.total <= 0) { console.log('  ❌ 总额为零'); pass3 = false; }
if (sunResult.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass3 = false; }
if (!sunResult.legal.date) { console.log('  ❌ 无退休日期'); pass3 = false; }
if (pass3) console.log('  ✅ 通过');

// 测试4：王哥 - 1968.3出生，1995.1参保，企业职工，85%档，含视同缴费10年
console.log('\n📋 测试4: 王哥（男，1968.3，老职工）');
const wang = {
  name: '王哥',
  gender: 'male',
  birthYear: 1968,
  birthMonth: 3,
  workYear: 1995,
  workMonth: 1,
  avgIndex: 0.85,
  cityType: 'cc',
  retireType: 'standard',
  personalAccInput: null,
  sightYears: 10
};
const wangResult = engine.calculate(config, wang);
console.log('  月领养老金:', wangResult.legal.total?.toFixed(2) || '0', '元');
console.log('  基础养老金:', wangResult.legal.basicPension?.amount?.toFixed(2) || '0', '元');
console.log('  增发养老金:', wangResult.legal.extraPension?.amount?.toFixed(2) || '0', '元');
console.log('  个人账户养老金:', wangResult.legal.personalAccount?.amount?.toFixed(2) || '0', '元');
console.log('  过渡性养老金:', wangResult.legal.transitionalPension?.amount?.toFixed(2) || '0', '元');
console.log('  退休日期:', wangResult.legal.date ? `${wangResult.legal.date.year}年${wangResult.legal.date.month}月` : '-');
console.log('  退休年龄:', wangResult.legal.ageStr || '-');

let pass4 = true;
if (wangResult.legal.total <= 0) { console.log('  ❌ 总额为零'); pass4 = false; }
if (wangResult.legal.basicPension.amount <= 0) { console.log('  ❌ 基础养老金为零'); pass4 = false; }
if (wangResult.legal.personalAccount.amount <= 0) { console.log('  ❌ 个人账户养老金为零'); pass4 = false; }
if (wangResult.legal.transitionalPension.amount <= 0) { console.log('  ❌ 过渡性养老金为零（应有视同缴费）'); pass4 = false; }
if (wangResult.legal.extraPension.amount <= 0) { console.log('  ❌ 增发养老金为零（吉林应有增发）'); pass4 = false; }
if (!wangResult.legal.date) { console.log('  ❌ 无退休日期'); pass4 = false; }
if (pass4) console.log('  ✅ 通过');

console.log('\n========== 测试结果 ==========');
const total = 4;
const passCount = [pass1, pass2, pass3, pass4].filter(Boolean).length;
console.log(`通过: ${passCount}, 失败: ${total - passCount}, 总计: ${total}, 通过率: ${(passCount / total * 100).toFixed(1)}%`);

process.exit(passCount === total ? 0 : 1);

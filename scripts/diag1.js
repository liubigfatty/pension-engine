/**
 * 严格验证：只对有配置的省份跑，逐个诊断
 * 黑龙江（有配置但退休日期错）、辽宁（有配置但指数错）
 */

const path = require('path');
const engine = require(path.join(__dirname, '..', 'engine', 'pension-engine.js'));

// ===== 诊断1: 黑龙江灵活就业女 =====
console.log('='.repeat(70));
console.log('【诊断1】黑龙江灵活就业女 — 退休日期为什么错？');
console.log('='.repeat(70));

const hljConfig = require(path.join(__dirname, '..', 'provinces', 'heilongjiang.json'));

// 55岁退休的女性，1970年9月出生
// 法定退休年龄 = 55岁 = 660个月
// 延迟退休：女性灵活就业人员从1975年出生开始延迟
// 1970 < 1975，所以延迟=0
// 退休日期 = 1970 + 55 = 2025年9月
// 但引擎算出2020年9月 → 50岁退休

// 检查延迟退休函数
const delay55 = engine.getDelayMonths(1970, 9, 'fw');  // 灵活就业女
const delay50 = engine.getDelayMonths(1970, 9, 'fw50'); // 女工人
console.log('1970年9月出生, type=fw(灵活就业女) → 延迟', delay55, '个月');
console.log('1970年9月出生, type=fw50(女工人) → 延迟', delay50, '个月');

// 检查退休年龄
const total55 = engine.getRetireTotalMonths(1970, 9, 'fw');
const total50 = engine.getRetireTotalMonths(1970, 9, 'fw50');
console.log('1970年9月出生, type=fw → 退休总月数', total55, '月 =', total55/12, '岁');
console.log('1970年9月出生, type=fw50 → 退休总月数', total50, '月 =', total50/12, '岁');

// 正确计算应该是660个月（55岁）
console.log('预期退休日期: 2025年9月');

// ===== 诊断2: 辽宁大连男 =====
console.log('\n' + '='.repeat(70));
console.log('【诊断2】辽宁大连男 — 为什么指数3.42导致结果差4684元？');
console.log('='.repeat(70));

const lnConfig = require(path.join(__dirname, '..', 'provinces', 'liaoning.json'));

const lnInput = {
  name: '辽宁大连男',
  gender: 'male',
  retireType: 'standard',
  cityType: 'prov',
  birthYear: 1965,
  birthMonth: 1,
  workYear: 1989,
  workMonth: 8,
  avgIndex: 3.42,  // 案例中的平均指数
  personalAcc: 140586.46
};

// 分析问题：辽宁案例中3.42是前5年超高指数把整体平均拉高的
// 但真实场景中，平均指数3.42本身就很高
// 问题在于：
// 1. 视同年限7.42年 vs 实际3.42年（计算错误）
// 2. 累计年限35.42年 vs 实际33年
// 3. 基础养老金公式：(7201 + 7201*3.42)/2 * 35.42 * 1% = 5636
//    实际应该是：(7201 + 7201*1.08)/2 * 33.0 * 1% ≈ 2500左右

// 先看看案例中的真实数据
console.log('案例数据:');
console.log('  视同年限: 3.42年');
console.log('  实际年限: 29.58年');
console.log('  累计年限: 33.0年');
console.log('  平均指数: 3.42（注意：这个3.42可能是前5年超高拉高，不真实）');
console.log('  月养老金: 4521元');

// 用案例中的指数算一下
console.log('\n用avgIndex=3.42计算:');
const result342 = engine.calculate(lnConfig, lnInput);
console.log('  引擎总额:', result342.legal.total);
console.log('  基础养老金:', result342.legal.basicPension.amount);
console.log('  累计年限:', result342.legal.totalYears);
console.log('  视同年:', result342.legal.sightYears);
console.log('  实际年:', result342.legal.actualYears);

// 如果指数用正确的值（比如1.08），结果会怎样？
console.log('\n如果avgIndex=1.08（假设修正）:');
const lnInput108 = { ...lnInput, avgIndex: 1.08 };
const result108 = engine.calculate(lnConfig, lnInput108);
console.log('  引擎总额:', result108.legal.total);
console.log('  基础养老金:', result108.legal.basicPension.amount);
console.log('  累计年限:', result108.legal.totalYears);

// ===== 诊断3: 江苏案例（有配置） =====
console.log('\n' + '='.repeat(70));
console.log('【诊断3】江苏案例 — 有配置，试试看');
console.log('='.repeat(70));

const jiangsuConfig = require(path.join(__dirname, '..', 'provinces', 'jiangsu.json'));

// 用江苏案例中的数据
const jsInput = {
  name: '江苏苏州女',
  gender: 'female',
  retireType: 'standard',
  cityType: 'prov',
  birthYear: 1974,
  birthMonth: 10,
  workYear: 1993,
  workMonth: 4,
  avgIndex: 0.88,
  personalAcc: 99189.60
};

const jsResult = engine.calculate(jiangsuConfig, jsInput);
console.log('江苏案例计算结果:');
console.log('  总额:', jsResult.legal.total);
console.log('  基础养老金:', jsResult.legal.basicPension.amount);
console.log('  个人账户:', jsResult.legal.personalAccount.amount);
console.log('  过渡性:', jsResult.legal.transitionalPension.amount);
console.log('  退休日期:', jsResult.legal.date.year + '.' + jsResult.legal.date.month);
console.log('  退休年龄:', jsResult.legal.ageStr);
console.log('  视同年:', jsResult.legal.sightYears);
console.log('  实际年:', jsResult.legal.actualYears);
console.log('  累计年:', jsResult.legal.totalYears);
console.log('  计发月数:', jsResult.legal.months);

console.log('\n' + '='.repeat(70));
console.log('诊断结束。核心问题汇总：');
console.log('='.repeat(70));
console.log('1. 灵活就业女性退休年龄需要区分50岁和55岁');
console.log('2. 黑龙江案例：fw类型应该用55岁基准，不是50岁');
console.log('3. 辽宁案例：3.42指数过高，需要确认是否为真实平均指数');
console.log('4. 湖南/北京：缺少省份配置，需要先补充');
console.log('5. 累计年限计算可能有偏差（黑龙江15.42→10.33）');

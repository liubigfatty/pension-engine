/**
 * 验证案例：吉林省长春市男性，1966-02-21出生，2026-02-21退休
 * 官方预核定表数据核对
 */

// ===== 从官方表中提取的参数 =====
const params = {
  // 基本信息
  gender: '男',
  birthDate: '1966-02-21',
  retireDate: '2026-02-21',
  retireAge: 60,

  // 缴费年限
  totalYears: 41.67,      // 累计缴费年限（实际+视同）
  actualYears: 30.67,     // 实际缴费年限
  siYears: 11,            // 视同缴费年限

  // 指数和基数
  avgIndex: 0.62,         // 本人平均缴费工资指数
  cityBase: 7978.25,      // 上年度市县计发基数（长春市）
  provBase: 7322.08,      // 上年度全省计发基数

  // 个人账户
  personalAccountBalance: 96750.01,  // 个人账户累计储存额
  payMonths: 139,                    // 计发月数（60岁男性）

  // 过渡参数
  transCoeff: 0.014,      // 过渡系数 1.4%
  siYearsForTrans: 11,    // 视同缴费年限（用于过渡养老金计算）

  // 官方结果
  officialResult: 4295.4
};

// ===== 计算过程 =====
console.log('=== 吉林省企业职工养老金验证 ===\n');
console.log(`参保地：长春市（使用长春市计发基数）`);
console.log(`性别：${params.gender}，出生：${params.birthDate}，退休：${params.retireDate}`);
console.log(`缴费年限：累计${params.totalYears}年（实际${params.actualYears}年 + 视同${params.siYears}年）`);
console.log(`平均缴费指数：${params.avgIndex}`);
console.log('');

// ① 基础养老金
// 公式：(市县计发基数 + 全省计发基数 × 指数) / 2 × 累计年限 × 1%
const basic = (params.cityBase + params.provBase * params.avgIndex) / 2 * params.totalYears * 0.01;
const basicRound = Math.round(basic * 100) / 100;

console.log('① 基础养老金：');
console.log(`  (${params.cityBase} + ${params.provBase} × ${params.avgIndex}) / 2 × ${params.totalYears} × 1%`);
console.log(`  = (${params.cityBase} + ${(params.provBase * params.avgIndex).toFixed(2)}) / 2 × ${params.totalYears} × 0.01`);
console.log(`  = ${((params.cityBase + params.provBase * params.avgIndex) / 2).toFixed(4)} × ${params.totalYears} × 0.01`);
console.log(`  = ${basicRound.toFixed(2)} 元`);
console.log(`  官方值：2608.11 元`);
console.log('');

// ② 增发基础养老金（实际缴费年限30.67年，超过20年，需计算增发）
// 分段：21-25年（5年）0.15%；26-30年（5年）0.2%；31年及以上部分 0.25%
// 实际缴费30.67年：
//   21-25年段：5年
//   26-30年段：5年  
//   31年以上段：30.67-30=0.67年（注意：此段基于累计年限还是实际年限？）
// 官方表显示：46.94 + 62.59 + 182.61 = 292.14元
// 逆推：avgBase用于增发计算

// 增发养老金计发基数 = (cityBase + provBase) / 2
const avgBase = (params.cityBase + params.provBase) / 2;
console.log('② 增发基础养老金：');
console.log(`  计发基数平均值 = (${params.cityBase} + ${params.provBase}) / 2 = ${avgBase.toFixed(4)}`);

// 触发条件：实际缴费 > 20年（30.67年 > 20年，触发）
const actualYears = params.actualYears; // 30.67
let bonus = 0;

// 21-25年段：min(25, actualYears) - 20
const seg1Years = Math.min(25, actualYears) - 20;
const seg1 = Math.max(0, seg1Years) * avgBase * 0.0015;

// 26-30年段：min(30, actualYears) - 25
const seg2Years = Math.min(30, actualYears) - 25;
const seg2 = Math.max(0, seg2Years) * avgBase * 0.002;

// 31年及以上（用总缴费年限41.67？还是实际30.67？）
// 方案A：实际缴费年限 30.67年，30-30=0.67年
const seg3A_years = Math.max(0, actualYears - 30);
const seg3A = seg3A_years * avgBase * 0.0025;

// 方案B：总缴费年限 41.67年，41.67-30=11.67年
const seg3B_years = Math.max(0, params.totalYears - 30);
const seg3B = seg3B_years * avgBase * 0.0025;

const bonusA = seg1 + seg2 + seg3A;
const bonusB = seg1 + seg2 + seg3B;

console.log(`  21-25年段（${seg1Years.toFixed(2)}年）× ${avgBase.toFixed(2)} × 0.15% = ${seg1.toFixed(2)} 元`);
console.log(`  26-30年段（${seg2Years.toFixed(2)}年）× ${avgBase.toFixed(2)} × 0.20% = ${seg2.toFixed(2)} 元`);
console.log(`  [方案A-实际年限] 31+年段（${seg3A_years.toFixed(2)}年）× ${avgBase.toFixed(2)} × 0.25% = ${seg3A.toFixed(2)} 元`);
console.log(`  [方案B-总年限]  31+年段（${seg3B_years.toFixed(2)}年）× ${avgBase.toFixed(2)} × 0.25% = ${seg3B.toFixed(2)} 元`);
console.log(`  增发合计 方案A = ${bonusA.toFixed(2)} 元`);
console.log(`  增发合计 方案B = ${bonusB.toFixed(2)} 元`);
console.log(`  官方值：292.14 元`);
console.log('');

// 逆推：官方46.94 / (avgBase * 0.0015) 应该 = 5年
const officialSeg1Check = 46.94 / (avgBase * 0.0015);
const officialSeg2Check = 62.59 / (avgBase * 0.0020);
const officialSeg3Check = 182.61 / (avgBase * 0.0025);
console.log(`  逆推验证：`);
console.log(`    46.94 / (${avgBase.toFixed(2)} × 0.15%) = ${officialSeg1Check.toFixed(4)} 年`);
console.log(`    62.59 / (${avgBase.toFixed(2)} × 0.20%) = ${officialSeg2Check.toFixed(4)} 年`);
console.log(`    182.61 / (${avgBase.toFixed(2)} × 0.25%) = ${officialSeg3Check.toFixed(4)} 年`);
console.log('');

// ③ 个人账户养老金
const personal = params.personalAccountBalance / params.payMonths;
const personalRound = Math.round(personal * 100) / 100;
console.log('③ 个人账户养老金：');
console.log(`  ${params.personalAccountBalance} ÷ ${params.payMonths} = ${personalRound.toFixed(2)} 元`);
console.log(`  官方值：696.04 元`);
console.log('');

// ④ 过渡性养老金
// 公式：全省计发基数 × 指数 × 视同年限 × 过渡系数
const transition = params.provBase * params.avgIndex * params.siYearsForTrans * params.transCoeff;
const transitionRound = Math.round(transition * 100) / 100;
console.log('④ 过渡性养老金：');
console.log(`  ${params.provBase} × ${params.avgIndex} × ${params.siYearsForTrans}年 × ${(params.transCoeff * 100).toFixed(1)}%`);
console.log(`  = ${transitionRound.toFixed(2)} 元`);
console.log(`  官方值：699.11 元`);
console.log('');

// ⑤ 其他加发金额
const extra = 0;

// 汇总
const total_A = basicRound + bonusA + personalRound + transitionRound + extra;
const total_B = basicRound + bonusB + personalRound + transitionRound + extra;

console.log('===== 汇总 =====');
console.log(`  ① 基础养老金：${basicRound.toFixed(2)}`);
console.log(`  ② 增发（方案A）：${bonusA.toFixed(2)}`);
console.log(`  ② 增发（方案B）：${bonusB.toFixed(2)}`);
console.log(`  ③ 个人账户：${personalRound.toFixed(2)}`);
console.log(`  ④ 过渡性：${transitionRound.toFixed(2)}`);
console.log(`  ⑤ 其他：${extra}`);
console.log('');
console.log(`  合计（方案A实际年限）：${total_A.toFixed(2)} 元`);
console.log(`  合计（方案B总年限）：${total_B.toFixed(2)} 元`);
console.log(`  官方预核定：${params.officialResult} 元`);
console.log('');
console.log(`  方案A误差：${(total_A - params.officialResult).toFixed(2)} 元`);
console.log(`  方案B误差：${(total_B - params.officialResult).toFixed(2)} 元`);

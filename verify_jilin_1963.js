const engine = require('./engine/pension-engine.js');
const jilinConfig = require('./provinces/jilin.json');

// 案例数据
const caseData = {
  case_id: "jilin-man-1963-case",
  gender: "男",
  birth_date: "1963-01-15",
  work_start_date: "1980-11-01",
  retirement_date: "2023-01-15",
  retirement_type: "正常退休",
  avgIndex: 0.99,
  personalAcc: 112694.1,
  totalYears: 42.25,
  sightYears: 14.67,
  cityType: "prov"  // 非长春
};

const input = {
  name: caseData.case_id,
  gender: "male",
  birthYear: 1963,
  birthMonth: 1,
  workYear: 1980,
  workMonth: 11,
  avgIndex: caseData.avgIndex,
  personalAccInput: caseData.personalAcc,
  totalYears: caseData.totalYears,
  sightYears: caseData.sightYears,
  cityType: caseData.cityType
};

console.log("=== 吉林案例 #71 验证 ===\n");
console.log(`输入: sightYears=${input.sightYears} avgIndex=${input.avgIndex} personalAcc=${input.personalAccInput} totalYears=${input.totalYears} city=${input.cityType}\n`);

try {
  const result = engine.calculate(jilinConfig, input);
  const trueTotal = 5559.13;
  
  console.log(`基础养老金: ${result.legal.basicPension.amount.toFixed(2)} (真实: 3035.54)`);
  console.log(`增发养老金: ${result.legal.extraPension.amount.toFixed(2)} (真实: 345.77)`);
  console.log(`个人账户养老金: ${result.legal.personalAccount.amount.toFixed(2)} (真实: 810.75)`);
  console.log(`过渡性养老金: ${result.legal.transitionalPension.amount.toFixed(2)} (真实: 1367.07)`);
  console.log(`\n引擎合计: ${result.legal.total.toFixed(2)}`);
  console.log(`真实合计: ${trueTotal.toFixed(2)}`);
  
  const diff = Math.abs(result.legal.total - trueTotal);
  const diffPct = (diff / trueTotal * 100).toFixed(2);
  console.log(`差距: ${diff.toFixed(2)}元 (${diffPct}%)`);
  
  console.log(`\n基础说明: ${result.legal.basicPension.description}`);
  console.log(`过渡说明: ${result.legal.transitionalPension.description}`);
  
} catch (e) {
  console.log(`ERROR: ${e.message}`);
  console.log(e.stack);
}

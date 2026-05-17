const engine = require('./engine/pension-engine.js');
const jilinConfig = require('./provinces/jilin.json');
const fs = require('fs');
const path = require('path');

const casesDir = path.join(__dirname, 'cases', 'jilin');
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));

console.log('=== 吉林验证：排除特殊工种+2026退休 ===\n');

let pass = 0, skip = 0, fail = 0;

for (const file of files) {
  const caseData = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8'));
  
  // 跳过特殊工种
  if ((caseData.retirement_type || '').includes('特殊')) {
    console.log(`SKIP 特殊工种: ${file} - ${caseData.retirement_type}`);
    skip++;
    continue;
  }
  
  // 跳过2026退休
  const rd = caseData.retirement_date || caseData.retire_date || '';
  if (rd.includes('2026')) {
    console.log(`SKIP 2026退休: ${file} - ${rd}`);
    skip++;
    continue;
  }
  
  console.log(`\n--- ${file} ---`);
  console.log(`  ${caseData.gender} | 出生: ${caseData.birth_date || caseData.birth} | 退休: ${rd}`);
  console.log(`  退休类型: ${caseData.retirement_type || caseData.retireType}`);
  
  // 构建输入
  const birthStr = caseData.birth_date || caseData.birth || '2000-01';
  const workStr = caseData.work_start_date || caseData.work_start || '2000-01';
  
  const input = {
    name: caseData.case_id || file,
    gender: caseData.gender === '女' ? 'female' : 'male',
    birthYear: parseInt(birthStr.split(/[-年]/)[0]),
    birthMonth: parseInt(birthStr.split(/[-年]/)[1] || '1'),
    workYear: parseInt(workStr.split(/[-年]/)[0]),
    workMonth: parseInt(workStr.split(/[-年]/)[1] || '1'),
    avgIndex: parseFloat(caseData.calculation_parameters?.average_wage_index || caseData.average_wage_index || 1.0),
    personalAccInput: parseFloat(caseData.calculation_parameters?.personal_account_balance || caseData.personal_account_balance || null),
    totalYears: parseFloat(caseData.contribution_years?.total_years || caseData.total_years || null),
    sightYears: parseFloat(caseData.contribution_years?.deemed_years || caseData.deemed_years || 0),
    cityType: (caseData.city || '').includes('长春') ? 'cc' : 'prov'
  };
  
  try {
    const result = engine.calculate(jilinConfig, input);
    const trueTotal = caseData.pension_breakdown?.monthly_basic_pension_total || caseData.total || caseData.total_pension;
    
    if (trueTotal == null || trueTotal <= 0) {
      console.log(`  SKIP 无真实值，引擎算: ${result.legal.total.toFixed(2)}`);
      skip++;
      continue;
    }
    
    const diff = Math.abs(result.legal.total - trueTotal);
    const diffPct = (diff / trueTotal * 100).toFixed(2);
    const status = diff < 100 ? 'PASS' : diff < 500 ? 'WARN' : 'FAIL';
    
    if (status === 'PASS') pass++;
    else if (status === 'WARN') pass++;
    else fail++;
    
    console.log(`  ${status} 真实: ${trueTotal.toFixed(2)} | 引擎: ${result.legal.total.toFixed(2)} | 差: ${diff.toFixed(2)}元 (${diffPct}%)`);
    console.log(`     引擎: 基础=${result.legal.basicPension.amount.toFixed(2)} 增发=${result.legal.extraPension.amount.toFixed(2)} 个人=${result.legal.personalAccount.amount.toFixed(2)} 过渡=${result.legal.transitionalPension.amount.toFixed(2)}`);
    console.log(`     过渡说明: ${result.legal.transitionalPension.description}`);
    console.log(`     基础说明: ${result.legal.basicPension.description}`);
    const pb = caseData.pension_breakdown || {};
    console.log(`     真实: 基础=${pb.basic_pension || 0} 增发=${pb.basic_pension_increase_by_tenure?.total || pb.basic_pension_increment || 0} 个人=${pb.personal_account_pension || 0} 过渡=${pb.transitional_pension || 0}`);
    
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
    fail++;
  }
}

console.log(`\n=== 汇总: PASS=${pass} SKIP=${skip} FAIL=${fail} ===`);

const engine = require('./engine/pension-engine.js');
const jilinConfig = require('./provinces/jilin.json');
const fs = require('fs');
const path = require('path');

const casesDir = path.join(__dirname, 'cases', 'jilin');
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));

console.log('=== 吉林案例验证（排除特殊工种 + 2026退休）===\n');

for (const file of files) {
  const caseData = JSON.parse(fs.readFileSync(path.join(casesDir, file), 'utf8'));
  
  // 跳过特殊工种
  if (caseData.retirement_type && caseData.retirement_type.includes('特殊')) {
    console.log(`⏭️  跳过(特殊工种): ${file} - ${caseData.retirement_type}`);
    continue;
  }
  
  // 跳过2026年退休
  const retireDate = caseData.retirement_date || caseData.retire_date || '';
  if (typeof retireDate === 'string' && retireDate.includes('2026')) {
    console.log(`⏭️  跳过(2026退休): ${file} - 退休日期 ${retireDate}`);
    continue;
  }
  
  console.log(`\n--- ${file} ---`);
  console.log(`  人员: ${caseData.gender || 'N/A'} | 出生: ${caseData.birth_date || caseData.birth || 'N/A'}`);
  console.log(`  退休: ${retireDate} | 类型: ${caseData.retirement_type || 'N/A'}`);
  console.log(`  累计年限: ${caseData.contribution_years?.total_years || caseData.total_years || 'N/A'}`);
  console.log(`  指数: ${caseData.calculation_params?.avg_wage_index || caseData.avg_index || 'N/A'}`);
  console.log(`  个人账户: ${caseData.calculation_params?.personal_account_balance || caseData.personal_account || 'N/A'}`);
  
  // 构建输入
  const input = {
    name: caseData.case_id || file,
    gender: caseData.gender === '女' ? 'female' : 'male',
    birthYear: parseInt((caseData.birth_date || caseData.birth || '2000-01').split(/[-年]/)[0]),
    birthMonth: parseInt((caseData.birth_date || caseData.birth || '2000-01').split(/[-年]/)[1] || '1'),
    workYear: parseInt((caseData.work_start_date || caseData.work_start || '2000-01').split(/[-年]/)[0]),
    workMonth: parseInt((caseData.work_start_date || caseData.work_start || '2000-01').split(/[-年]/)[1] || '1'),
    avgIndex: parseFloat(caseData.calculation_params?.avg_wage_index || caseData.avg_index || caseData.average_index || 1.0),
    personalAccInput: parseFloat(caseData.calculation_params?.personal_account_balance || caseData.personal_account || caseData.personalAcc || null),
    totalYearsInput: parseFloat(caseData.contribution_years?.total_years || caseData.total_years || null),
    sightYearsInput: parseFloat(caseData.contribution_years?.deemed_years || caseData.deemed_years || 0),
    cityType: (caseData.city || '').includes('长春') ? 'cc' : 'prov'
  };
  
  try {
    const result = engine.calculate(jilinConfig, input);
    
    const trueTotal = caseData.pension_breakdown?.total_pension || caseData.total || caseData.total_pension || null;
    
    if (trueTotal == null || trueTotal <= 0) {
      console.log(`  ⏭️  无真实值，引擎算: ${result.legal.total.toFixed(2)}`);
      continue;
    }
    
    const diff = Math.abs(result.legal.total - trueTotal);
    const diffPct = (diff / trueTotal * 100).toFixed(2);
    const status = diff < 100 ? '✅' : diff < 500 ? '⚠️' : '❌';
    
    console.log(`  ${status} 真实: ${trueTotal.toFixed(2)} | 引擎: ${result.legal.total.toFixed(2)} | 差: ${diff.toFixed(2)}元 (${diffPct}%)`);
    console.log(`     基础: ${result.legal.basicPension.amount.toFixed(2)} | 增发: ${result.legal.extraPension.amount.toFixed(2)} | 个人: ${result.legal.personalAccount.amount.toFixed(2)} | 过渡: ${result.legal.transitionalPension.amount.toFixed(2)}`);
    console.log(`     真实分解: 基础=${caseData.pension_breakdown?.basic_pension} 增发=${caseData.pension_breakdown?.basic_pension_increment} 个人=${caseData.pension_breakdown?.personal_account_pension} 过渡=${caseData.pension_breakdown?.transitional_pension}`);
    
  } catch (e) {
    console.log(`  ❌ 计算错误: ${e.message}`);
  }
}

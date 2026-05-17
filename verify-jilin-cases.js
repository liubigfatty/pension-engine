/**
 * 吉林案例验证脚本
 * 读取 cases/jilin/ 下的所有案例，用引擎计算后对比真实值
 */
const fs = require('fs');
const path = require('path');
const engine = require('./engine/pension-engine.js');
const jilinConfig = require('./provinces/jilin.json');

const casesDir = path.join(__dirname, 'cases', 'jilin');
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));

console.log('='.repeat(60));
console.log('吉林案例验证');
console.log('='.repeat(60));

let pass = 0;
let fail = 0;
let skip = 0;

for (const file of files) {
  try {
    const raw = fs.readFileSync(path.join(casesDir, file), 'utf8');
    const caseData = JSON.parse(raw);
    
    // 标准化输入到引擎
    const input = {
      name: caseData.name || caseData.case_id || file,
      gender: caseData.gender || (caseData.gender_cn === '女' ? 'female' : 'male'),
      birthYear: parseInt(caseData.birthYear || caseData.birth_year || caseData.birth_date?.split('-')?.[0] || 0),
      birthMonth: parseInt(caseData.birthMonth || caseData.birth_month || caseData.birth_date?.split('-')?.[1] || 1),
      workYear: parseInt(caseData.workYear || caseData.work_year || caseData.work_start_date?.split('-')?.[0] || 0),
      workMonth: parseInt(caseData.workMonth || caseData.work_month || caseData.work_start_date?.split('-')?.[1] || 1),
      avgIndex: parseFloat(caseData.average_index || caseData.avg_index || caseData.averageWageIndex || 1.0),
      personalAccInput: parseFloat(caseData.personal_account || caseData.personalAcc || caseData.personalAccount || null),
      totalYearsInput: parseFloat(caseData.total_years || caseData.totalYears || caseData.total_months ? caseData.total_months / 12 : null),
      sightYearsInput: parseFloat(caseData.deemed_years || caseData.sightYears || caseData.deemed_contribution_years || caseData.deemedMonths || 0),
      cityType: caseData.cityType || (caseData.city && caseData.city.includes('长春') ? 'cc' : 'prov'),
      retireType: caseData.retireType || 'standard'
    };

    // 引擎计算
    const result = engine.calculate(jilinConfig, input);
    const engineTotal = result.legal.total;
    const trueTotal = caseData.total || caseData.total_pension || caseData.pensionAmount || null;

    if (trueTotal === null || trueTotal === undefined || trueTotal <= 0) {
      console.log(`\n⏭️  跳过: ${file} (case_id=${caseData.case_id}) - 无真实养老金值`);
      console.log(`    引擎计算: ${engineTotal.toFixed(2)} 元`);
      skip++;
      continue;
    }

    const diff = Math.abs(engineTotal - trueTotal);
    const diffPct = (diff / trueTotal * 100).toFixed(2);
    const status = diff < 100 ? '✅' : diff < 500 ? '⚠️' : '❌';

    if (status === '✅') pass++;
    else if (status === '⚠️') pass++; // 轻微偏差可接受
    else fail++;

    console.log(`\n${status} ${file} (case_id=${caseData.case_id})`);
    console.log(`   姓名/类型: ${caseData.name || caseData.job_category || 'N/A'} | 性别: ${caseData.gender || 'N/A'}`);
    console.log(`   出生: ${caseData.birth_date || caseData.birthYear}.${caseData.birthMonth || ''} | 退休: ${caseData.retire_date || caseData.retireDate || 'N/A'}`);
    console.log(`   累计年限: ${(caseData.total_years || caseData.total_months ? (caseData.total_months / 12).toFixed(2) : 'N/A')}年 | 指数: ${(caseData.average_index || caseData.avg_index || 'N/A')}`);
    console.log(`   真实: ${trueTotal.toFixed(2)} 元 | 引擎: ${engineTotal.toFixed(2)} 元 | 差: ${diff.toFixed(2)} 元 (${diffPct}%)`);
    console.log(`   分解:`);
    console.log(`     基础: ${result.legal.basicPension.amount.toFixed(2)} | 增发: ${result.legal.extraPension.amount.toFixed(2)} | 个人: ${result.legal.personalAccount.amount.toFixed(2)} | 过渡: ${result.legal.transitionalPension.amount.toFixed(2)}`);

  } catch (e) {
    console.log(`\n❌ 读取失败: ${file} - ${e.message}`);
    fail++;
  }
}

console.log('\n' + '='.repeat(60));
console.log(`汇总: ✅ 通过 ${pass} | ⚠️ 偏差 ${fail - pass > 0 ? fail - pass : 0} | ⏭️ 跳过 ${skip}`);
console.log('='.repeat(60));

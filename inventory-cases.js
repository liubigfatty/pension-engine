const fs = require('fs');

console.log('========== 案例库盘点 ==========');

// 1. 统计所有案例
const casesDir = 'cases/other';
const files = fs.readdirSync(casesDir).filter(f => f.endsWith('.json'));
console.log(`\n案例文件总数: ${files.length}`);

// 2. 按省份统计
const byProvince = {};
for (const f of files) {
  const filePath = `${casesDir}/${f}`;
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const province = data.region || data.province || '未知';
    if (!byProvince[province]) byProvince[province] = [];
    byProvince[province].push({ file: f, data });
  } catch(e) {}
}

console.log('\n=== 按省份统计 ===');
for (const [prov, cases] of Object.entries(byProvince)) {
  console.log(`  ${prov}: ${cases.length} 个`);
}

// 3. 详细分析云南案例
console.log('\n=== 云南案例详细分析 ===');
const yunnanCases = byProvince['云南'] || [];

// 也从 yunnan.json 读取配置的案例列表
let configCases = [];
try {
  const yunnanConfig = JSON.parse(fs.readFileSync('provinces/yunnan.json', 'utf8'));
  configCases = yunnanConfig.verification_cases || [];
} catch(e) {}

console.log(`  cases/other/ 中云南案例: ${yunnanCases.length} 个`);
console.log(`  yunnan.json 配置案例: ${configCases.length} 个`);

// 分析配置中的案例
const retireYears = new Set();
const genders = new Set();
const ages = new Set();
const hasPreApproval = [];
const sightYearsList = [];

for (let i = 0; i < configCases.length; i++) {
  const c = configCases[i];
  console.log(`\n  案例${i+1}: ${c.name}`);
  console.log(`    出生: ${c.birthYear}-${String(c.birthMonth).padStart(2,'0')}`);
  console.log(`    退休: ${c.retireYear}-${String(c.retireMonth).padStart(2,'0')}`);
  console.log(`    视同: ${c.sightYears}年, 建账前: ${c.preAccountYears || 'N/A'}年`);
  console.log(`    指数: ${c.avgIndex}, 账户: ${c.personalAcc}`);
  console.log(`    合计: ${c.results?.finalPension || c.results?.totalPension}`);
  console.log(`    预核定: ${c.isPreApproval ? '是' : '否'}`);
  
  retireYears.add(c.retireYear);
  ages.add(c.retireYear - c.birthYear);
  sightYearsList.push(c.sightYears);
  if (c.isPreApproval) hasPreApproval.push(i+1);
}

console.log('\n=== 覆盖性分析 ===');
console.log(`  退休年份: [${[...retireYears].sort().join(', ')}]`);
console.log(`  退休年龄: [${[...ages].sort().join(', ')}] 岁`);
console.log(`  视同年限范围: ${Math.min(...sightYearsList)} ~ ${Math.max(...sightYearsList)} 年`);
console.log(`  预核定表案例: ${hasPreApproval.length > 0 ? `案例${hasPreApproval.join(', ')}` : '无'}`);

console.log('\n=== 建议补充 ===');
const suggestions = [];

// 检查退休年份
if (!retireYears.has(2024)) suggestions.push('1. 2024年退休案例（目前只有2023和2025）');

// 检查退休年龄
if (!ages.has(55)) suggestions.push('2. 55岁退休案例（女干部/灵活就业女，目前只有50和60岁）');

// 检查视同年限
if (sightYearsList.every(s => s > 0)) suggestions.push('3. 无视同年限案例（建账后参工，过渡性养老金=0）');

// 检查提前退休
suggestions.push('4. 提前退休案例（弹性退休，非50/60整岁）');

// 检查边界情况
suggestions.push('5. 账户余额极高/极低案例（测试边界值）');
suggestions.push('6. 平均缴费指数极高/极低案例（测试边界值）');

for (const s of suggestions) {
  console.log(`  ${s}`);
}

console.log('\n========== 盘点完成 ==========');

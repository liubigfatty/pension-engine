const fs = require('fs');
const path = require('path');

// ===== 配置 =====
const CASES_DIR = './cases';
const ENGINE_PATH = './cloudfunctions/calculate/pension-engine.js';

// 31省列表
const ALL_PROVINCES = [
  'beijing','tianjin','hebei','shanxi','neimenggu',
  'liaoning','jilin','heilongjiang','shanghai','jiangsu',
  'zhejiang','anhui','fujian','jiangxi','shandong',
  'henan','hubei','hunan','guangdong','guangxi',
  'hainan','chongqing','sichuan','guizhou','yunnan',
  'xizang','shaanxi','gansu','qinghai','ningxia','xinjiang'
];

// ===== 工具函数 =====

// 统一读取性别（兼容中英文）
function getGender(caseData) {
  const g = caseData.gender;
  if (g === '男' || g === 'male') return 'male';
  if (g === '女' || g === 'female') return 'female';
  return null;
}

// 根据 months 判断场景
function getScenario(caseData) {
  const gender = getGender(caseData);
  const months = caseData.months;
  if (gender === 'male') return 'male';
  if (gender === 'female') {
    if (months === 195) return 'fw50';   // 女工人 50岁
    if (months === 170) return 'fc';      // 女干部/灵活就业 55岁
    if (months === 139) return 'fw55?';   // 可能是灵活就业
  }
  return 'unknown';
}

// 读取某省所有案例
function readProvinceCases(prov) {
  const provDir = path.join(CASES_DIR, prov);
  if (!fs.existsSync(provDir)) return [];
  const files = fs.readdirSync(provDir).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(provDir, f), 'utf8'));
      return { ...c, _file: f };
    } catch(e) { return null; }
  }).filter(c => c);
}

// 检查某省是否已有某场景
function hasScenario(cases, scenario) {
  return cases.some(c => getScenario(c) === scenario);
}

// ===== 主分析 =====

console.log('=== 31省测试覆盖分析（修复后）===\n');

const gaps = []; // { prov, scenario }
let totalCases = 0;

for (const prov of ALL_PROVINCES) {
  const cases = readProvinceCases(prov);
  totalCases += cases.length;
  
  const has = {
    male: hasScenario(cases, 'male'),
    fw50: hasScenario(cases, 'fw50'),
    fc: hasScenario(cases, 'fc'),
  };
  
  const missing = [];
  if (!has.male) missing.push('male');
  if (!has.fw50) missing.push('fw50');
  if (!has.fc) missing.push('fc');
  
  if (missing.length > 0) {
    gaps.push({ prov, missing, caseCount: cases.length });
    const missingStr = missing.join(', ');
    console.log(`  ⚠️  ${prov.padEnd(14)} 案例:${String(cases.length).padEnd(3)} 缺: ${missingStr}`);
  }
}

console.log(`\n总案例数: ${totalCases}`);
console.log(`缺失场景的省: ${gaps.length}/31`);

console.log('\n=== 缺失明细 ===');
for (const g of gaps) {
  console.log(`  ${g.prov}: 缺 ${g.missing.join(', ')} (现有 ${g.caseCount} 个案例)`);
}

// 输出为 JSON 供生成脚本使用
fs.writeFileSync(
  'scripts/_gaps.json',
  JSON.stringify(gaps, null, 2)
);
console.log('\n✅ 缺口分析已写入 scripts/_gaps.json');

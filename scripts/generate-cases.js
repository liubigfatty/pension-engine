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

function getGender(caseData) {
  const g = caseData.gender;
  if (g === '男' || g === 'male') return 'male';
  if (g === '女' || g === 'female') return 'female';
  return null;
}

function getScenario(caseData) {
  const gender = getGender(caseData);
  const months = caseData.months;
  if (gender === 'male') return 'male';
  if (gender === 'female') {
    if (months === 195) return 'fw50';
    if (months === 170) return 'fc';
  }
  return 'unknown';
}

function readProvinceCases(prov) {
  const provDir = path.join(CASES_DIR, prov);
  if (!fs.existsSync(provDir)) return [];
  const files = fs.readdirSync(provDir).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      const c = JSON.parse(fs.readFileSync(path.join(provDir, f), 'utf8'));
      return { ...c, _file: f, _prov: prov };
    } catch(e) { return null; }
  }).filter(c => c);
}

function hasScenario(cases, scenario) {
  return cases.some(c => getScenario(c) === scenario);
}

// 获取某省的配置
function getProvinceConfig(prov) {
  try {
    // 尝试加载省份配置
    const configPath = `./cloudfunctions/calculate/provinces/${prov}.js`;
    if (fs.existsSync(configPath)) {
      // 动态加载
      delete require.cache[require.resolve(configPath)];
      return require(configPath);
    }
  } catch(e) {}
  return null;
}

// ===== 主逻辑 =====

console.log('=== 生成缺失测试案例 ===\n');

// 读取缺口
const gaps = JSON.parse(fs.readFileSync('scripts/_gaps.json', 'utf8'));
console.log(`需补全省数: ${gaps.length}`);

let generated = 0;
const errors = [];

for (const gap of gaps) {
  const { prov, missing } = gap;
  const existingCases = readProvinceCases(prov);
  
  console.log(`\n-- ${prov} --`);
  console.log(`  现有案例: ${existingCases.length}, 缺: ${missing.join(', ')}`);
  
  // 找一个模板案例（优先用女案例，没有就用男案例）
  let template = existingCases.find(c => getGender(c) === 'female');
  if (!template) template = existingCases[0];
  
  if (!template) {
    console.log(`  ❌ 无模板案例，跳过`);
    errors.push({ prov, reason: '无模板案例' });
    continue;
  }
  
  // 为每种缺失场景生成案例
  for (const scenario of missing) {
    try {
      const newCase = generateCase(template, prov, scenario);
      
      // 写入文件
      const fileName = `${prov}_${scenario}_generated.json`;
      const filePath = path.join(CASES_DIR, prov, fileName);
      
      // 如果文件已存在，跳过
      if (fs.existsSync(filePath)) {
        console.log(`  ⚠️  ${scenario}: 文件已存在，跳过`);
        continue;
      }
      
      fs.writeFileSync(filePath, JSON.stringify(newCase, null, 2));
      console.log(`  ✅ ${scenario}: 已生成 ${fileName}`);
      generated++;
    } catch(e) {
      console.log(`  ❌ ${scenario}: 生成失败 - ${e.message}`);
      errors.push({ prov, scenario, reason: e.message });
    }
  }
}

console.log(`\n=== 生成完成 ===`);
console.log(`成功: ${generated} 个案例`);
console.log(`失败: ${errors.length} 个`);
if (errors.length > 0) {
  console.log('\n失败明细:');
  for (const e of errors) {
    console.log(`  ${e.prov} ${e.scenario || ''}: ${e.reason}`);
  }
}

// ===== 生成单个案例 =====

function generateCase(template, prov, scenario) {
  // 复制模板案例的基本信息
  const c = { ...template };
  
  // 修改性别和退休年龄
  if (scenario === 'fc') {
    // 女干部 55岁退休
    c.gender = '女';
    c.genderType = 'fc';
    // 调整出生日期使退休年龄=55
    const retireYear = 2026; // 假设2026年退休
    const birthYear = retireYear - 55;
    c.birth_year = birthYear;
    c.birth_month = c.birth_month || 6;
    c.retire_year = retireYear;
    c.retire_month = c.birth_month;
    c.months = 170; // 55岁退休计发月数
    c.case_id = String(Number(c.case_id || '0') + 100);
    c.notes = `生成案例: ${prov} 女干部55岁退休`;
  }
  
  if (scenario === 'fw50') {
    // 女工人 50岁退休
    c.gender = '女';
    c.genderType = 'fw50';
    const retireYear = 2026;
    const birthYear = retireYear - 50;
    c.birth_year = birthYear;
    c.birth_month = c.birth_month || 6;
    c.retire_year = retireYear;
    c.retire_month = c.birth_month;
    c.months = 195; // 50岁退休计发月数
    c.case_id = String(Number(c.case_id || '0') + 200);
    c.notes = `生成案例: ${prov} 女工人50岁退休`;
  }
  
  // 重新计算预期值（这里需要调用引擎，暂时留空）
  c.expected = {
    basic_pension: 0,
    personal_pension: 0,
    transitional_pension: 0,
    total: 0
  };
  c.generated = true;
  c.needs_calculation = true;
  
  return c;
}

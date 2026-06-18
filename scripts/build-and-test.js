/**
 * 补全缺失测试案例 + 跑测试
 * 用法: node scripts/build-and-test.js
 */
const fs = require('fs');
const path = require('path');

const CASES_DIR = './cases';

// 31省
const ALL = [
  'beijing','tianjin','hebei','shanxi','neimenggu',
  'liaoning','jilin','heilongjiang','shanghai','jiangsu',
  'zhejiang','anhui','fujian','jiangxi','shandong',
  'henan','hubei','hunan','guangdong','guangxi',
  'hainan','chongqing','sichuan','guizhou','yunnan',
  'xizang','shaanxi','gansu','qinghai','ningxia','xinjiang'
];

// ===== 工具 =====

function readCases(prov) {
  const dir = path.join(CASES_DIR, prov);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.json')).map(f => {
    try { return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
    catch(e) { return null; }
  }).filter(Boolean);
}

// 判断案例场景
function getScenario(c) {
  const g = c.gender;
  const isFemale = (g === '女' || g === 'female');
  const isMale = (g === '男' || g === 'male');
  if (isMale) return 'male';
  if (isFemale) {
    if (c.months === 195) return 'fw50';
    if (c.months === 170) return 'fc';
  }
  return 'unknown';
}

// ===== Step 1: 分析缺口 =====

console.log('=== Step 1: 分析缺口 ===\n');

const gaps = []; // { prov, scenarios[] }
let totalCases = 0;

for (const prov of ALL) {
  const cases = readCases(prov);
  totalCases += cases.length;
  const has = { male: false, fw50: false, fc: false };
  for (const c of cases) {
    const s = getScenario(c);
    if (s === 'male') has.male = true;
    if (s === 'fw50') has.fw50 = true;
    if (s === 'fc') has.fc = true;
  }
  const missing = [];
  if (!has.male) missing.push('male');
  if (!has.fw50) missing.push('fw50');
  if (!has.fc) missing.push('fc');
  if (missing.length > 0) {
    gaps.push({ prov, missing });
  }
}

console.log(`总案例数: ${totalCases}`);
console.log(`有缺口的省: ${gaps.length}/31\n`);

// ===== Step 2: 生成缺失案例 =====
// 策略：每省缺什么场景，就从该省现有案例复制一个，改性别/出生年/months，
// 然后用引擎算出正确的 expected 值

console.log('=== Step 2: 生成缺失案例 ===\n');

// 尝试加载引擎
let engine = null;
try {
  // 先试 pension-engine 仓库
  const enginePath = 'C:/Users/14041/WorkBuddy/pension-engine/miniprogram/cloud-functions/calculate/pension-engine.js';
  if (fs.existsSync(enginePath)) {
    delete require.cache[require.resolve(enginePath)];
    engine = require(enginePath);
    console.log('✅ 已加载 pension-engine\n');
  } else {
    console.log('⚠️ 未找到 pension-engine，期望值将留空\n');
  }
} catch(e) {
  console.log('⚠️ 加载引擎失败:', e.message, '\n');
}

let generated = 0;

for (const { prov, missing } of gaps) {
  const cases = readCases(prov);
  // 选一个模板（优先女案例，没有就用第一个）
  let template = cases.find(c => getScenario(c) !== 'unknown') || cases[0];
  if (!template) { console.log(`  ${prov}: 无模板，跳过`); continue; }

  for (const scenario of missing) {
    const fileName = `${prov}_${scenario}_generated.json`;
    const filePath = path.join(CASES_DIR, prov, fileName);
    if (fs.existsSync(filePath)) { console.log(`  ${prov}/${scenario}: 已存在，跳过`); continue; }

    // 构造新案例
    const nc = JSON.parse(JSON.stringify(template));

    if (scenario === 'fc') {
      // 女干部 55岁 → months=170
      nc.gender = '女';
      nc.genderType = 'fc';
      nc.months = 170;
      // 出生年 = 退休年 - 55；用模板的 retire_year
      const retireYear = nc.retire_year || 2026;
      nc.birth_year = retireYear - 55;
      nc.case_id = String(Number(nc.case_id || '0') + 1000);
      nc.notes = `${prov} 女干部55岁退休（自动生成）`;
    }

    if (scenario === 'fw50') {
      nc.gender = '女';
      nc.genderType = 'fw50';
      nc.months = 195;
      const retireYear = nc.retire_year || 2026;
      nc.birth_year = retireYear - 50;
      nc.case_id = String(Number(nc.case_id || '0') + 2000);
      nc.notes = `${prov} 女工人50岁退休（自动生成）`;
    }

    if (scenario === 'male') {
      nc.gender = '男';
      nc.genderType = 'male';
      nc.months = 139;
      const retireYear = nc.retire_year || 2026;
      nc.birth_year = retireYear - 60;
      nc.case_id = String(Number(nc.case_id || '0') + 3000);
      nc.notes = `${prov} 男性60岁退休（自动生成）`;
    }

    // 用引擎算期望值
    if (engine && engine.calculatePension) {
      try {
        const input = mapToEngineInput(nc, prov);
        const result = engine.calculatePension(input);
        nc.expected = {
          basic_pension: round(result.basicPension),
          personal_pension: round(result.personalAccountPension),
          transitional_pension: round(result.transitionalPension || 0),
          total: round(result.totalPension)
        };
        nc.months = result.months || nc.months;
        nc.total_years = result.totalYears || nc.total_years;
        nc.generated = true;
        console.log(`  ✅ ${prov}/${scenario}: 期望值已计算`);
      } catch(e) {
        console.log(`  ⚠️ ${prov}/${scenario}: 引擎计算失败 - ${e.message}`);
        nc.expected = { basic_pension: 0, personal_pension: 0, transitional_pension: 0, total: 0 };
        nc.generated = true;
        nc.needs_review = true;
      }
    } else {
      nc.expected = { basic_pension: 0, personal_pension: 0, transitional_pension: 0, total: 0 };
      nc.generated = true;
      nc.needs_review = true;
      console.log(`  ⚠️ ${prov}/${scenario}: 无引擎，期望值待填`);
    }

    fs.writeFileSync(filePath, JSON.stringify(nc, null, 2));
    generated++;
  }
}

console.log(`\n生成完成: ${generated} 个案例\n`);

// ===== Step 3: 跑测试 =====

console.log('=== Step 3: 跑测试 ===\n');

// 动态加载并运行 run-cases.js 的逻辑
// 这里直接 child_process 调用，避免模块缓存问题
const { execSync } = require('child_process');
try {
  const output = execSync('node scripts/run-cases.js', {
    cwd: path.resolve('.'),
    encoding: 'utf8',
    timeout: 120000
  });
  console.log(output);
} catch(e) {
  console.log(e.stdout || '');
  console.log('测试执行出错:', e.message);
}

// ===== 辅助函数 =====

function round(v) {
  return Math.round((v || 0) * 100) / 100;
}

function mapToEngineInput(c, prov) {
  // 将案例格式映射为引擎输入格式
  // 这是关键：需要根据实际引擎接口来写
  return {
    province: prov,
    gender: c.gender === '男' ? 'male' : 'female',
    genderType: c.genderType || (c.gender === '男' ? 'male' : 'fw50'),
    birthYear: c.birth_year,
    birthMonth: c.birth_month,
    workYear: c.work_year,
    workMonth: c.work_month,
    retireYear: c.retire_year,
    retireMonth: c.retire_month,
    avgIndex: c.avg_index,
    personalAccount: c.personal_account,
    totalYears: c.total_years,
    preAccountYears: c.pre_account_years,
    sightYears: c.sight_years,
    actualYears: c.actual_years,
  };
}

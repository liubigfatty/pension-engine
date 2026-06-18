/**
 * 补全缺失场景的案例 + 用引擎算期望值 + 跑测试
 * 用法: node scripts/build-and-test-v2.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CASES_DIR = './cases';
const ENGINE_PATH = './cloudfunctions/calculate/pension-engine.js';

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

function getScenario(c) {
  const g = c.gender;
  const isF = (g === '女' || g === 'female');
  const isM = (g === '男' || g === 'male');
  if (isM) return 'male';
  if (isF) {
    if (c.months === 195) return 'fw50';
    if (c.months === 170) return 'fc';
  }
  return 'unknown';
}

// ===== Step 1: 分析缺口 =====

console.log('=== Step 1: 分析缺口 ===\n');

const gaps = [];
for (const prov of ALL) {
  const cases = readCases(prov);
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
  if (missing.length > 0) gaps.push({ prov, missing });
}

console.log(`有缺口的省: ${gaps.length}/31\n`);
if (gaps.length === 0) {
  console.log('✅ 无缺口，直接跑测试\n');
} else {
  for (const { prov, missing } of gaps) {
    console.log(`  ${prov}: 缺 ${missing.join(', ')}`);
  }
  console.log('');
}

// ===== Step 2: 生成缺失案例 =====

if (gaps.length > 0) {
  console.log('\n=== Step 2: 生成缺失案例 ===\n');

  // 加载引擎
  let engine, getConfig;
  try {
    engine = require(ENGINE_PATH);
    getConfig = (prov) => {
      const provPath = `./cloudfunctions/calculate/provinces/${prov}.js`;
      if (!fs.existsSync(provPath)) return null;
      delete require.cache[require.resolve(provPath)];
      return require(provPath);
    };
    console.log('✅ 引擎已加载\n');
  } catch(e) {
    console.log('❌ 引擎加载失败:', e.message);
    process.exit(1);
  }

  let generated = 0;

  for (const { prov, missing } of gaps) {
    const cases = readCases(prov);
    // 选模板：优先同性，没有就用第一个
    let template = null;
    for (const s of missing) {
      if (s === 'male') { template = cases.find(c => getScenario(c) === 'male') || cases[0]; break; }
      if (s === 'fw50' || s === 'fc') { template = cases.find(c => getScenario(c) !== 'unknown') || cases[0]; break; }
    }
    if (!template) { console.log(`  ${prov}: 无模板，跳过`); continue; }

    for (const scenario of missing) {
      const fileName = `${prov}_${scenario}_generated.json`;
      const filePath = path.join(CASES_DIR, prov, fileName);
      if (fs.existsSync(filePath)) { console.log(`  ${prov}/${scenario}: 已存在，跳过`); continue; }

      // 构造新案例
      const nc = JSON.parse(JSON.stringify(template));

      // 基础修改
      nc.case_id = String(Number(nc.case_id || '0') + (scenario === 'fc' ? 1000 : scenario === 'fw50' ? 2000 : 3000));
      nc.notes = `${prov} ${scenario}（自动生成）`;
      nc.generated = true;

      // 根据场景调整参数
      if (scenario === 'fc') {
        // 女干部 55岁 → months=170, 出生年=退休年-55
        nc.gender = '女';
        nc.genderType = 'fc';
        nc.months = 170;
        const retireYear = nc.retire_year || 2026;
        nc.birth_year = retireYear - 55;
        // 如果有 work_year，也相应调整（参工年龄约20岁）
        if (nc.work_year) nc.work_year = nc.birth_year + 20;
      }

      if (scenario === 'fw50') {
        nc.gender = '女';
        nc.genderType = 'fw50';
        nc.months = 195;
        const retireYear = nc.retire_year || 2026;
        nc.birth_year = retireYear - 50;
        if (nc.work_year) nc.work_year = nc.birth_year + 20;
      }

      if (scenario === 'male') {
        nc.gender = '男';
        nc.genderType = 'male';
        nc.months = 139;
        const retireYear = nc.retire_year || 2026;
        nc.birth_year = retireYear - 60;
        if (nc.work_year) nc.work_year = nc.birth_year + 18;
      }

      // 用引擎算期望值
      try {
        const config = getConfig(prov);
        if (!config) throw new Error('无省份配置');

        // 映射为引擎输入格式
        const inputData = {
          name: nc.case_id || prov,
          gender: nc.gender === '男' ? 'male' : 'female',
          genderType: nc.genderType || (nc.gender === '男' ? 'male' : 'fw50'),
          birthYear: nc.birth_year,
          birthMonth: nc.birth_month,
          workYear: nc.work_year,
          workMonth: nc.work_month,
          retireType: nc.retire_type || 'standard',
          cityType: nc.city_type || 'prov',
          avgIndex: nc.avg_index,
          personalAcc: nc.personal_account,
          totalYears: nc.total_years,
          sightYears: nc.sight_years,
          preAccountYears: nc.pre_account_years,
          actualYears: nc.actual_years,
          months: nc.months,
        };

        const result = engine.calculate(config, inputData);
        const legal = result.legal || result;

        nc.expected = {
          basic_pension: round(legal.basicPension?.amount || legal.basicPension || 0),
          personal_pension: round(legal.personalAccount?.amount || legal.personalAccountPension || 0),
          transitional_pension: round(legal.transitionalPension?.amount || legal.transitionalPension || 0),
          total: round(legal.total || 0)
        };
        nc.months = legal.months || nc.months;

        console.log(`  ✅ ${prov}/${scenario}: 期望已算 (个人=${nc.expected.personal_pension})`);
      } catch(e) {
        console.log(`  ❌ ${prov}/${scenario}: 引擎失败 - ${e.message}`);
        nc.expected = { basic_pension: 0, personal_pension: 0, transitional_pension: 0, total: 0 };
        nc.needs_review = true;
      }

      fs.writeFileSync(filePath, JSON.stringify(nc, null, 2));
      generated++;
    }
  }

  console.log(`\n生成完成: ${generated} 个案例\n`);
}

// ===== Step 3: 跑测试 =====

console.log('=== Step 3: 跑全量测试 ===\n');

try {
  const output = execSync('node scripts/run-cases.js', {
    cwd: path.resolve('.'),
    encoding: 'utf8',
    timeout: 180000
  });
  console.log(output);
} catch(e) {
  console.log(e.stdout || '');
  if (e.stderr) console.log('错误:', e.stderr);
}

// ===== 辅助 =====

function round(v) {
  return Math.round((v || 0) * 100) / 100;
}

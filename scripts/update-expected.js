/**
 * 用当前引擎重新算所有案例的期望值，更新案例库
 * 用法：node scripts/update-expected.js
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

// ===== 加载引擎 =====
let engine;
const ENGINE_PATHS = [
  path.join(PROJECT_ROOT, 'cloudfunctions', 'calculate', 'pension-engine.js'),
  'C:/Users/14041/WorkBuddy/pension-engine/miniprogram/cloud-functions/calculate/pension-engine.js',
];
for (const p of ENGINE_PATHS) {
  if (fs.existsSync(p)) { engine = require(p); break; }
}
if (!engine) { console.error('❌ 找不到引擎'); process.exit(1); }
const { calculate } = engine;
console.log('✅ 引擎已加载\n');

// ===== 加载省份配置 =====
function loadConfig(prov) {
  const configPaths = [
    path.join(PROJECT_ROOT, 'cloudfunctions', 'calculate', 'provinces', prov + '.js'),
    path.join('C:/Users/14041/WorkBuddy/pension-engine/miniprogram/cloud-functions/calculate/provinces', prov + '.js'),
  ];
  for (const p of configPaths) {
    if (fs.existsSync(p)) {
      delete require.cache[require.resolve(p)];
      return require(p);
    }
  }
  return null;
}

// ===== 映射：案例文件 → 引擎 inputData =====
function mapInput(c, config) {
  const isFemale = (c.gender === '女' || c.gender === 'female');
  const gender = isFemale ? 'female' : 'male';

  let genderType = c.genderType || '';
  if (!genderType && isFemale) {
    const m = c.months || 195;
    if (m === 170) {
      genderType = (c.notes && c.notes.includes('女干部')) ? 'fc' : 'fw55';
    } else {
      genderType = 'fw50';
    }
  }
  if (!genderType) genderType = 'male';

  return {
    name:           c.case_id || '测试',
    province:       c.province || config.provinceKey || 'beijing',
    gender,
    genderType,
    birthYear:      c.birth_year,
    birthMonth:     c.birth_month,
    workYear:       c.work_year,
    workMonth:      c.work_month,
    retireYear:      c.retire_year || null,
    retireMonth:     c.retire_month || null,
    avgIndex:       c.avg_index ?? 1.0,
    personalAcc:    c.personal_account ?? 0,
    sightYears:      c.sight_years   ?? null,
    totalYears:      c.total_years    ?? null,
    preAccountYears: c.pre_account_years ?? null,
    actualYears:     c.actual_years     ?? null,
    months:         c.months         ?? null,
    retireType:      c.retire_type    || 'standard',
    cityType:        c.city_type      || 'prov',
    transIndex:      c.trans_index     ?? null,
  };
}

// ===== 主流程 =====
const casesDir = path.join(PROJECT_ROOT, 'cases');
const provinces = fs.readdirSync(casesDir)
  .filter(f => fs.statSync(path.join(casesDir, f)).isDirectory());

let updated = 0, skipped = 0, errors = 0;

console.log('=== 更新期望值 ===\n');

for (const prov of provinces) {
  const provDir = path.join(casesDir, prov);
  const files = fs.readdirSync(provDir).filter(f => f.endsWith('.json'));

  for (const f of files) {
    const filePath = path.join(provDir, f);
    let c;
    try { c = JSON.parse(fs.readFileSync(filePath, 'utf8')); }
    catch(e) { console.log(`  ❌ ${prov}/${f}: 读取失败`); errors++; continue; }

    const config = loadConfig(prov);
    if (!config) { console.log(`  ⚠️ ${prov}/${f}: 无省份配置，跳过`); skipped++; continue; }

    const input = mapInput(c, config);
    let result;
    try { result = calculate(config, input); }
    catch(e) { console.log(`  ❌ ${prov}/${f}: 引擎报错 - ${e.message}`); errors++; continue; }

    const legal = result.legal || result;
    const newExpected = {
      basic_pension:       Math.round((legal.basicPension?.amount       ?? legal.basicPension       ?? 0) * 100) / 100,
      personal_pension:     Math.round((legal.personalAccount?.amount   ?? legal.personalAccountPension ?? 0) * 100) / 100,
      transitional_pension: Math.round((legal.transitionalPension?.amount ?? legal.transitionalPension ?? 0) * 100) / 100,
      total:               Math.round((legal.total                    ?? 0) * 100) / 100,
    };

    // 对比旧期望值
    const old = c.expected || {};
    const hasChange = ['basic_pension','personal_pension','transitional_pension','total']
      .some(k => Math.abs((newExpected[k] || 0) - (old[k] || 0)) > 1);

    if (hasChange || c.generated) {
      c.expected = newExpected;
      delete c.needs_review;
      fs.writeFileSync(filePath, JSON.stringify(c, null, 2));
      updated++;
      const label = c.generated ? '新生成' : '已更新';
      console.log(`  ✅ ${prov}/${f}: 期望值${label}`);
    } else {
      skipped++;
    }
  }
}

console.log(`\n=== 完成 ===`);
console.log(`更新: ${updated}`);
console.log(`跳过（无变化）: ${skipped}`);
console.log(`错误: ${errors}`);

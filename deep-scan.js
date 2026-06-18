// deep-scan.js - 深度扫描31省配置
const fs = require('fs');
const path = require('path');
const provDir = path.join(__dirname, 'data/provinces');
const files = fs.readdirSync(provDir).filter(f => f.endsWith('.js')).sort();

const results = [];
let ok = 0, fail = 0;

files.forEach(f => {
  try {
    const m = require(path.join(provDir, f));
    ok++;
    const code = f.replace('.js', '');
    const name = m.name || code;
    const config = m.getEngineConfig();
    const mods = config.modules ? Object.keys(config.modules).filter(k => config.modules[k] && config.modules[k].enabled) : [];
    const extras = m.EXTRA_PARAMS || {};
    const extraKeys = Object.keys(extras);
    const baseKeys = config.base_rates ? Object.keys(config.base_rates) : ['prov'];
    const cityTypes = baseKeys.filter(k => k !== 'prov');
    results.push({ code, name, cityTypes, mods, extraKeys });
  } catch(e) {
    fail++;
    console.log('❌', f, e.message.substring(0, 80));
  }
});

console.log(`\n✅ 成功: ${ok}  ❌ 失败: ${fail}  (共 ${ok+fail})`);

console.log('\n📋 有增发/加发模块的省份：');
results.forEach(p => {
  const has = p.mods.some(m => m.includes('extra') || m.includes('special') || m.includes('other'));
  if (has) console.log(`  ${p.name} → modules: ${p.mods.join(', ')}`);
});

console.log('\n📋 多基数省份（base_rates 多键）：');
results.forEach(p => {
  if (p.cityTypes.length > 0) console.log(`  ${p.name} → cityTypes: ${p.cityTypes.join(', ')}`);
});

console.log('\n📋 全部31省 modules 汇总：');
results.forEach(p => {
  console.log(`  ${p.name} → ${p.mods.join(', ') || '(无)'}`);
});

// 输出 JSON
fs.writeFileSync(
  path.join(__dirname, 'miniprogram/assets/province-meta.json'),
  JSON.stringify(results, null, 2),
  'utf-8'
);
console.log('\n✅ province-meta.json 已写入 miniprogram/assets/');

// scan-provinces-v2.js - 正确扫描31省的城市类型和加发项
const fs = require('fs');
const path = require('path');

const provDir = path.join(__dirname, 'data/provinces');
const files = fs.readdirSync(provDir).filter(f => f.endsWith('.js')).sort();

const results = [];

files.forEach(f => {
  try {
    const m = require(path.join(provDir, f));
    const code = f.replace('.js', '');
    const name = m.name || code;

    // 调用 getEngineConfig() 获取引擎配置
    const config = m.getEngineConfig();

    // base_rates 的键名 = 城市类型
    const baseRateKeys = config.base_rates ? Object.keys(config.base_rates) : ['prov'];
    const cityTypes = baseRateKeys.map(k => {
      // k 可能是 'prov', 'cc', 'sz', 'dl', 'sy', 'dl' 等
      return k;
    }).filter(k => k !== 'prov'); // prov 是默认，不需要单独选

    // 城市标签映射（用于前端显示）
    const cityTypeLabels = {};
    baseRateKeys.forEach(k => {
      if (k === 'prov') cityTypeLabels[k] = '全省统一基数';
      else if (k === 'cc') cityTypeLabels[k] = '省直/省会独立基数';
      else if (k === 'sz') cityTypeLabels[k] = '深圳市独立基数';
      else if (k === 'zz') cityTypeLabels[k] = '郑州市独立基数';
      else if (k === 'dl') cityTypeLabels[k] = '大连市独立基数';
      else if (k === 'sy') cityTypeLabels[k] = '沈阳市独立基数';
      else if (k === 'xining') cityTypeLabels[k] = '西宁市独立基数';
      else cityTypeLabels[k] = k + '独立基数';
    });

    // 加发项：从 EXTRA_PARAMS 读取
    const extras = m.EXTRA_PARAMS || {};
    const extraKeys = Object.keys(extras);
    const extrasDetail = {};
    extraKeys.forEach(k => {
      const item = extras[k];
      extrasDetail[k] = {
        label: item.label || k,
        default: item.default || 0,
        unit: item.unit || '元',
        desc: item.desc || ''
      };
    });

    // 模块配置（判断是否包含 extra/other 模块）
    const modules = config.modules || {};
    const hasExtra = !!(modules.extra_pension && modules.extra_pension.enabled) ||
                   !!(modules.special_addition && modules.special_addition.enabled) ||
                   !!(modules.other && modules.other.enabled);

    results.push({
      code,
      name: config.province || name,
      cityList: config.cities || [],
      baseRateKeys,
      cityTypeLabels,
      hasMultipleBaseRates: cityTypes.length > 0,
      extrasDetail,
      hasExtra,
      transCoef: m.TRANS_COEF || (modules.transitional_pension && modules.transitional_pension.coefficient) || null
    });
  } catch (e) {
    results.push({ code: f, error: e.message.substring(0, 200) });
  }
});

// 写入 JSON
const outPath = path.join(__dirname, 'miniprogram/assets/province-meta.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf-8');

console.log('✅ 扫描完成，共', results.length, '个省');
console.log('📄 结果已写入', outPath);

// 打印汇总
console.log('\n📊 多基数省份（base_rates 有多个键）：');
results.forEach(p => {
  if (p.baseRateKeys && p.baseRateKeys.length > 1) {
    console.log(`  ${p.name}：base_rates 键=${p.baseRateKeys.join(', ')}`);
  }
});

console.log('\n📊 有加发项的省份：');
results.forEach(p => {
  if (p.extraKeys && p.extraKeys.length > 0) {
    console.log(`  ${p.name}：加发项=${p.extraKeys.join(', ')}`);
    p.extrasDetail && console.log(`    详情：${JSON.stringify(p.extrasDetail)}`);
  }
});

console.log('\n📊 仅有全省统一基数的省份（base_rates 只有 prov）：');
results.forEach(p => {
  if (!p.error && (!p.baseRateKeys || p.baseRateKeys.length <= 1)) {
    console.log(`  ${p.name}`);
  }
});

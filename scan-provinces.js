// scan-provinces.js - 扫描31省配置，提取城市类型和加发项
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

    // 城市列表
    const cities = m.CITY_LIST || [];

    // BASE_PARAMS 里有哪些 key（决定有哪些城市类型）
    const baseKeys = m.BASE_PARAMS ? Object.keys(m.BASE_PARAMS) : [];
    const cityTypes = baseKeys.filter(k => k !== 'prov');

    // 加发项
    const extras = m.EXTRA_PARAMS || {};
    const extraKeys = Object.keys(extras);
    const extrasDetail = {};
    extraKeys.forEach(k => {
      const item = extras[k];
      extrasDetail[k] = {
        label: item.label || k,
        default: item.default || 0,
        unit: item.unit || '元'
      };
    });

    // 过渡性系数
    const transCoef = m.TRANS_COEF || null;

    results.push({
      code,
      name,
      cityCount: cities.length,
      cities,
      cityTypes,
      extraKeys,
      extrasDetail,
      transCoef
    });
  } catch (e) {
    results.push({ code: f, error: e.message.substring(0, 150) });
  }
});

// 输出为 JSON，供前端使用
fs.writeFileSync(
  path.join(__dirname, 'miniprogram/assets/province-meta.json'),
  JSON.stringify(results, null, 2),
  'utf-8'
);

console.log('✅ 扫描完成，共', results.length, '个省');
console.log('📄 结果已写入 miniprogram/assets/province-meta.json');

// 打印汇总
console.log('\n📊 城市类型汇总（非全省统一基数的省份）：');
results.forEach(p => {
  if (p.cityTypes.length > 0) {
    console.log(`  ${p.name}：${p.cityTypes.join('、')}`);
  }
});

console.log('\n📊 有加发项的省份：');
results.forEach(p => {
  if (p.extraKeys.length > 0) {
    console.log(`  ${p.name}：${p.extraKeys.join('、')} → ${JSON.stringify(p.extrasDetail)}`);
  }
});

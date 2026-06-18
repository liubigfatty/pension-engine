/**
 * 2024年计发基数补全脚本
 * 数据来源：2025年各省基本养老金计发基数一览表（官方）
 * 
 * 表中数据为 月均值(元/月)，需要 ×12 转为 年总额(元/年) 写入 avg_salary_history
 * 同时更新 base_rates.prov 的 2024 年值
 */

const fs = require('fs');
const path = require('path');

// 官方一览表：2024年计发基数 (元/月)
// 省份key -> 月均值
const base2024Monthly = {
  shanghai:   12307,
  beijing:    11883,
  xizang:     11546,
  guangdong:  9307,    // 全省统一; 深圳=11293
  tianjin:    9232,
  hubei:      9022,    // 武汉; 荆州7210,神农架7215等
  qinghai:    8878,
  jiangsu:    8785,
  sichuan:    8332,
  xinjiang:   8321,
  zhejiang:   8310,
  ningxia:    8202,
  yunnan:     8183,
  chongqing:  8160,
  hainan:     8131,
  neimenggu:  8105,
  anhui:      7842,
  fujian:     7776,
  shaanxi:    7727,
  shandong:   7678,
  gansu:      7594,
  hunan:      7618,
  heilongjiang:7010,
  hebei:      7265,
  liaoning:   7201,
  guizhou:    7272,
  jilin:      7178.5,  // 注意: 有小数
  shanxi:     7111,
  jiangxi:    6916,
  guangxi:    6847,
  henan:      6606,
};

// 月均值 → 年总额 (四舍五入取整)
function monthlyToAnnual(monthly) {
  return Math.round(monthly * 12);
}

const PROV_DIR = path.join(__dirname, 'provinces');
const files = fs.readdirSync(PROV_DIR).filter(f => f.endsWith('.json'));

let updated = 0;
let skipped = 0;
let errors = 0;

for (const f of files) {
  const filePath = path.join(PROV_DIR, f);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  const provKey = f.replace('.json', '');
  const monthly = base2024Monthly[provKey];
  
  if (!monthly) {
    console.log(`⚠️  ${provKey} (${raw.name || '?'}): 无2024数据，跳过`);
    skipped++;
    continue;
  }
  
  const annual = monthlyToAnnual(monthly);
  
  // 1. 更新 avg_salary_history 2024
  if (!raw.avg_salary_history) raw.avg_salary_history = {};
  const oldAvg = raw.avg_salary_history['2024'];
  raw.avg_salary_history['2024'] = annual;
  
  // 2. 更新 base_rates.prov 2024
  if (!raw.base_rates) raw.base_rates = {};
  if (!raw.base_rates.prov) raw.base_rates.prov = {};
  const oldBase = raw.base_rates.prov['2024'];
  raw.base_rates.prov['2024'] = monthly;
  
  // 写回文件
  try {
    fs.writeFileSync(filePath, JSON.stringify(raw, null, 2) + '\n');
    
    const avgChange = oldAvg ? `${oldAvg}→${annual}` : `新增${annual}`;
    const baseChange = oldBase ? `${oldBase}→${monthly}` : `新增${monthly}`;
    console.log(`✅ ${provKey} (${raw.name || '?'}): avg=${avgChange}, base=${baseChange}`);
    updated++;
  } catch (e) {
    console.error(`❌ ${provKey}: 写入失败 - ${e.message}`);
    errors++;
  }
}

console.log(`\n===== 完成 =====`);
console.log(`更新: ${updated}, 跳过: ${skipped}, 错误: ${errors}`);

const fs = require('fs');

// 31省过渡系数分组（基于多源交叉验证）
// 优先级：与吉林政策相近度 + 配置完整度
const provinces = {
  // 第一梯队：过渡系数1.4% + 政策可能相近
  "1.4%": [
    { name: "吉林", code: "jilin", coeff: 1.4, accountStart: "1995-07-01", status: "✅ 完成10案例", priority: 1 },
    { name: "辽宁", code: "liaoning", coeff: 1.4, accountStart: "?", status: "❌ 配置不完整", priority: 2 },
    { name: "浙江", code: "zhejiang", coeff: 1.4, accountStart: "?", status: "❌ 未启动", priority: 3 },
    { name: "广西", code: "guangxi", coeff: 1.4, accountStart: "?", status: "❌ 未启动", priority: 4 },
    { name: "重庆", code: "chongqing", coeff: 1.4, accountStart: "?", status: "❌ 未启动", priority: 5 },
    { name: "西藏", code: "tibet", coeff: 1.4, accountStart: "?", status: "⚠️ 案例2个", priority: 6 },
    { name: "青海", code: "qinghai", coeff: 1.4, accountStart: "?", status: "❌ 未启动", priority: 7 },
    { name: "海南", code: "hainan", coeff: 1.4, accountStart: "?", status: "❌ 未启动", priority: 8 },
    { name: "贵州", code: "guizhou", coeff: 1.4, accountStart: "?", status: "❌ 未启动", priority: 9 },
    { name: "新疆", code: "xinjiang", coeff: 1.4, accountStart: "?", status: "❌ 未启动", priority: 10 },
    { name: "云南", code: "yunnan", coeff: 1.4, accountStart: "1995-10-01", status: "✅ 完成6案例", priority: 11 }
  ],
  
  // 第二梯队：过渡系数1.3% + 政策可能相近
  "1.3%": [
    { name: "广东", code: "guangdong", coeff: 1.3, accountStart: "?", status: "❌ 未启动", priority: 12 },
    { name: "福建", code: "fujian", coeff: 1.3, accountStart: "?", status: "⚠️ 案例1个", priority: 13 },
    { name: "山东", code: "shandong", coeff: 1.3, accountStart: "?", status: "❌ 未启动", priority: 14 },
    { name: "河北", code: "hebei", coeff: 1.3, accountStart: "?", status: "❌ 未启动", priority: 15 },
    { name: "湖南", code: "hunan", coeff: 1.3, accountStart: "?", status: "❌ 未启动", priority: 16 },
    { name: "安徽", code: "anhui", coeff: 1.3, accountStart: "?", status: "❌ 未启动", priority: 17 },
    { name: "河南", code: "henan", coeff: 1.3, accountStart: "?", status: "❌ 未启动", priority: 18 },
    { name: "四川", code: "sichuan", coeff: 1.3, accountStart: "?", status: "⚠️ 案例1个", priority: 19 },
    { name: "江西", code: "jiangxi", coeff: 1.3, accountStart: "?", status: "⚠️ 案例2个", priority: 20 },
    { name: "宁夏", code: "ningxia", coeff: 1.3, accountStart: "?", status: "⚠️ 案例1个", priority: 21 },
    { name: "湖北", code: "hubei", coeff: 1.3, accountStart: "?", status: "⚠️ 案例2个", priority: 22 }
  ],
  
  // 第三梯队：过渡系数1.2% + 政策可能不同
  "1.2%": [
    { name: "上海", code: "shanghai", coeff: 1.2, accountStart: "?", status: "⚠️ 案例3个", priority: 23 },
    { name: "黑龙江", code: "heilongjiang", coeff: 1.2, accountStart: "1998-01-01", status: "✅ 完成6案例", priority: 24 },
    { name: "陕西", code: "shaanxi", coeff: 1.2, accountStart: "?", status: "⚠️ 案例4个", priority: 25 },
    { name: "内蒙古", code: "neimenggu", coeff: 1.2, accountStart: "?", status: "❌ 未启动", priority: 26 },
    { name: "江苏", code: "jiangsu", coeff: 1.2, accountStart: "?", status: "❌ 未启动", priority: 27, note: "2024年起改革" }
  ],
  
  // 第四梯队：过渡系数1.0% + 政策特殊
  "1.0%": [
    { name: "北京", code: "beijing", coeff: 1.0, accountStart: "?", status: "❌ 未启动", priority: 28, note: "分段计算" },
    { name: "天津", code: "tianjin", coeff: 1.0, accountStart: "?", status: "⚠️ 案例1个", priority: 29 },
    { name: "山西", code: "shanxi", coeff: 1.0, accountStart: "?", status: "⚠️ 案例2个", priority: 30 }
  ],
  
  // 第五梯队：信息缺失或特殊
  "未知": [
    { name: "甘肃", code: "gansu", coeff: "?", accountStart: "?", status: "❌ 未启动", priority: 31 }
  ]
};

// 输出分组表格
console.log('=== 31省养老金过渡系数分组排序 ===\n');

for (const [coeff, provincesList] of Object.entries(provinces)) {
  console.log(`【过渡系数 ${coeff}】`);
  provincesList.forEach((p, i) => {
    const note = p.note ? ` (${p.note})` : '';
    console.log(`  ${p.priority}. ${p.name} - ${p.status}${note}`);
  });
}

// 输出优先级排序（按与吉林相近度）
console.log('\n\n=== 推荐开发优先级（按与吉林相近度）===');
console.log('\n【P0 - 立即做】');
console.log('  1. 辽宁 - 过渡系数相同(1.4%)，但配置不完整（base_rates仅3年）');
console.log('  2. 河北 - 过渡系数相近(1.3%)，地理相近，配置空白');
console.log('\n【P1 - 近期做】');
console.log('  3. 山西 - 过渡系数1.0%，案例库有2个，可参考');
console.log('  4. 陕西 - 过渡系数1.2%，案例库有4个，可参考');
console.log('  5. 黑龙江 - ✅已完成，可作参考模板');
console.log('\n【P2 - 后期做】');
console.log('  6. 广东 - 经济大省，需求高，但政策可能不同');
console.log('  7. 江苏 - 经济大省，但2024年改革，规则复杂');
console.log('  8. 浙江 - 过渡系数1.4%，但可能有特殊规则');
console.log('\n【P3 - 最后做】');
console.log('  9. 北京 - 政策特殊（分段计算）');
console.log('  10. 上海 - 过渡系数1.2%，但可能有特殊规则');

// 统计
const total = Object.values(provinces).flat().length;
const completed = Object.values(provinces).flat().filter(p => p.status.includes('✅')).length;
const hasCases = Object.values(provinces).flat().filter(p => p.status.includes('⚠️')).length;
const notStarted = Object.values(provinces).flat().filter(p => p.status.includes('❌')).length;

console.log('\n\n=== 统计 ===');
console.log(`总省份数: ${total}`);
console.log(`✅ 已完成: ${completed}`);
console.log(`⚠️ 有案例但未验证: ${hasCases}`);
console.log(`❌ 未启动: ${notStarted}`);

// 输出说明
console.log('\n\n=== 说明 ===');
console.log('1. 过渡系数来源：多源交叉验证（百度知道、今日头条、腾讯新闻等）');
console.log('2. 分组依据：过渡系数 + 与吉林政策相近度 + 配置完整度');
console.log('3. 优先级依据：配置完整度 + 案例库覆盖度 + 用户需求');
console.log('4. 辽宁复杂度高，用户要求往后排，故排第2');
console.log('5. 河北地理相近，过渡系数相近，排第3（P0）');
console.log('6. 山西、陕西案例库有案例，可参考，排P1');
console.log('7. 广东、江苏、浙江经济大省，需求高，排P2');
console.log('8. 北京、上海政策特殊，排P3');

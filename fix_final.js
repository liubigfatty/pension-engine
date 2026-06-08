const fs = require('fs');

const jsPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.js';
let js = fs.readFileSync(jsPath, 'utf8');

console.log('[修复 JS] 在弹性增发计算后插入 flexBonus 计算...');

// 在 "flexExtraSubstitute = ..." 的结束 } 之后插入 flexBonus 计算
// 精确的搜索目标：结束的 } 加上后面的空行和 flexTotalAmountText
const searchStr = `        if (fSeg3 > 0) flexExtraSubstitute += ((fSeg1 + fSeg2) > 0 ? ' + ' : '') + fBaseProvNum + ' × ' + fSeg3.toFixed(2) + '年 × ' + avgIndexText + ' × 0.25%'
      }

      flexTotalAmountText = '¥' + ((flex.total || 0).toFixed(2))`;

const replaceStr = `        if (fSeg3 > 0) flexExtraSubstitute += ((fSeg1 + fSeg2) > 0 ? ' + ' : '') + fBaseProvNum + ' × ' + fSeg3.toFixed(2) + '年 × ' + avgIndexText + ' × 0.25%'
      }

      // 弹性其他加发（独生子女补贴等）
      const fBonusNum = flex.bonusPension || 0
      flexBonusAmountText = fBonusNum > 0 ? fBonusNum.toFixed(2) + '元/月' : ''
      flexBonusDescText = (flex.bonusDesc || '')

      flexTotalAmountText = '¥' + ((flex.total || 0).toFixed(2))`;

if (js.includes(searchStr)) {
  js = js.replace(searchStr, replaceStr);
  console.log('  [OK] 插入 flexBonus 计算成功');
} else {
  console.log('  [WARN] 未找到精确匹配');
  console.log('  [DEBUG] 搜索前100字符:', searchStr.substring(0, 100));
  
  // 尝试搜索更小的一段
  const shortSearch = "fSeg3.toFixed(2) + '年 × ' + avgIndexText + ' × 0.25%'";
  const idx = js.indexOf(shortSearch);
  if (idx > 0) {
    console.log('  [INFO] 找到 fSeg3 位置:', idx);
    // 找到这一行的结尾
    const lineEnd = js.indexOf('\n', idx);
    if (lineEnd > 0) {
      const before = js.substring(0, lineEnd + 1); // 包含换行符
      const after = js.substring(lineEnd + 1);
      const insert = `      }\n\n      // 弹性其他加发（独生子女补贴等）\n      const fBonusNum = flex.bonusPension || 0\n      flexBonusAmountText = fBonusNum > 0 ? fBonusNum.toFixed(2) + '元/月' : ''\n      flexBonusDescText = (flex.bonusDesc || '')\n\n      `;
      js = before + insert + after;
      console.log('  [OK] 手动插入成功');
    }
  }
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('  [OK] JS 已保存');

console.log('\n=== 修复完成 ===');
console.log('请重新编译并测试云南弹性退休测算！');

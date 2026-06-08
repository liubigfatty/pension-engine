const fs = require('fs');

// ===== 1. 修复 WXML =====
const wxmlPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.wxml';
let wxml = fs.readFileSync(wxmlPath, 'utf8');

console.log('[1] 修复 WXML...');

// 使用正则匹配：</view>\r\n\r\n      <!-- 弹性合计 -->
const wxmlRegex = /(<\/view>\r?\n\r?\n      <!-- 弹性合计 -->)/;
const wxmlInsert = `      </view>\n\n      <!-- 弹性其他加发 -->\n      <block wx:if="{{flexBonusAmountText}}">\n        <view class="calc-block flex-bonus-block">\n          <view class="calc-label">⑤ {{otherLabel}}(弹性)</view>\n          <view class="calc-substitute">{{flexBonusDescText}} = <text class="calc-result">¥{{flexBonusAmountText}}</text></view>\n        </view>\n      </block>\n\n      <!-- 弹性合计 -->`;

if (wxmlRegex.test(wxml)) {
  wxml = wxml.replace(wxmlRegex, wxmlInsert);
  console.log('  [OK] WXML 插入弹性其他加发区块');
} else {
  console.log('  [WARN] 正则未匹配，尝试手动查找...');
  const idx = wxml.indexOf('弹性合计');
  if (idx > 0) {
    // 找到前一个 </view> 的位置
    const viewEnd = wxml.lastIndexOf('</view>', idx);
    if (viewEnd > 0) {
      const before = wxml.substring(0, viewEnd + 7); // +7 for </view>
      const after = wxml.substring(viewEnd + 7);
      const insert = `\n\n      <!-- 弹性其他加发 -->\n      <block wx:if="{{flexBonusAmountText}}">\n        <view class="calc-block flex-bonus-block">\n          <view class="calc-label">⑤ {{otherLabel}}(弹性)</view>\n          <view class="calc-substitute">{{flexBonusDescText}} = <text class="calc-result">¥{{flexBonusAmountText}}</text></view>\n        </view>\n      </block>\n`;
      wxml = before + insert + after;
      console.log('  [OK] WXML 手动插入成功');
    }
  }
}

fs.writeFileSync(wxmlPath, wxml, 'utf8');
console.log('  [OK] WXML 已保存\n');

// ===== 2. 修复 JS =====
const jsPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.js';
let js = fs.readFileSync(jsPath, 'utf8');

console.log('[2] 修复 JS...');

// 找到 "弹性增发（分段代入）" 块，在它的结束 } 之后插入 flexBonus 计算
// 先定位这个块
const flexExtraStart = js.indexOf('// 弹性增发（分段代入）');
if (flexExtraStart > 0) {
  console.log('  [INFO] 找到弹性增发代码块，位置:', flexExtraStart);
  
  // 找到这个块的结束位置（下一个 // 注释或者 flexExtraAmountText 赋值后的几行）
  // 策略：找到 "flexExtraAmountText = fExtraNum.toFixed(2)" 后，找到它的 closing }
  // 实际代码是：
  // if (fExtraNum > 0) { ... }
  // 然后是空白行和 "// 弹性缴费年限"
  
  const afterExtra = js.indexOf('// 弹性缴费年限', flexExtraStart);
  if (afterExtra > 0) {
    console.log('  [INFO] 找到弹性缴费年限位置:', afterExtra);
    
    // 在 "// 弹性缴费年限" 前面插入 flexBonus 计算
    const before = js.substring(0, afterExtra);
    const after = js.substring(afterExtra);
    const insert = `      // 弹性其他加发（独生子女补贴等）
      const fBonusNum = flex.bonusPension || 0
      flexBonusAmountText = fBonusNum > 0 ? fBonusNum.toFixed(2) + '元/月' : ''
      flexBonusDescText = (flex.bonusDesc || '')

      `;
    
    js = before + insert + after;
    console.log('  [OK] JS 插入 flexBonus 计算');
  } else {
    console.log('  [WARN] 未找到 "// 弹性缴费年限"');
  }
} else {
  console.log('  [WARN] 未找到 "弹性增发（分段代入）"');
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('  [OK] JS 已保存\n');

console.log('=== 修复完成 ===');
console.log('请重新编译并测试！');

const fs = require('fs');

// ===== 1. 修复 WXML =====
const wxmlPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.wxml';
let wxml = fs.readFileSync(wxmlPath, 'utf8');

console.log('[1] 修复 WXML...');

// 在弹性增发块结束后、弹性合计前插入弹性其他加发块
const wxmlSearch = `      </view>\n\n      <!-- 弹性合计 -->`;
const wxmlInsert = `      </view>\n\n      <!-- 弹性其他加发 -->\n      <block wx:if="{{flexBonusAmountText}}">\n        <view class="calc-block flex-bonus-block">\n          <view class="calc-label">⑤ {{otherLabel}}(弹性)</view>\n          <view class="calc-substitute">{{flexBonusDescText}} = <text class="calc-result">¥{{flexBonusAmountText}}</text></view>\n        </view>\n      </block>\n\n      <!-- 弹性合计 -->`;

if (wxml.includes(wxmlSearch)) {
  wxml = wxml.replace(wxmlSearch, wxmlInsert);
  console.log('  [OK] WXML 插入弹性其他加发区块');
} else {
  console.log('  [WARN] 未找到匹配的文本');
  // 打印实际内容
  const idx = wxml.indexOf('弹性合计');
  if (idx > 0) {
    console.log('  [DEBUG] 实际内容:', JSON.stringify(wxml.substring(idx - 50, idx + 30)));
  }
}

fs.writeFileSync(wxmlPath, wxml, 'utf8');
console.log('  [OK] WXML 已保存\n');

// ===== 2. 修复 JS - 插入 flexBonus 计算 =====
const jsPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.js';
let js = fs.readFileSync(jsPath, 'utf8');

console.log('[2] 修复 JS - 插入 flexBonus 计算...');

// 搜索 flexExtra 计算后的位置，插入 flexBonus 计算
// 先找到 "flexExtraSubstitute  = ..." 这一行，然后在它后面插入
const jsSearch = "flexExtraSubstitute  = '基础养老金 × (0.15%×' + fSeg1 + ' + 0.20%×' + fRest + ')'";
const jsInsert = `flexExtraSubstitute  = '基础养老金 × (0.15%×' + fSeg1 + ' + 0.20%×' + fRest + ')'
      }

      // 弹性其他加发（独生子女补贴等）
      const fBonusNum = flex.bonusPension || 0
      flexBonusAmountText = fBonusNum > 0 ? fBonusNum.toFixed(2) + '元/月' : ''
      flexBonusDescText = (flex.bonusDesc || '')`;

// 注意：上面的替换会把原来的 "}" 去掉，需要调整
// 让我重新构造
const jsOld = `      // 弹性增发（分段代入）
      const fExtraNum = flex.extraPension || 0
      flexExtraAmountText = fExtraNum.toFixed(2)
      if (fExtraNum > 0) {
        const fSeg1 = Math.min(5, Math.max(0, fTotalYearsNum - 20))
        const fRest  = Math.max(0, fTotalYearsNum - 25)
        flexExtraFormulaText = '分段代入：0.15%×' + fSeg1 + '年 + 0.20%×' + fRest + '年'
        flexExtraSubstitute  = '基础养老金 × (0.15%×' + fSeg1 + ' + 0.20%×' + fRest + ')'
      }

      // 弹性缴费年限`;

const jsNew = `      // 弹性增发（分段代入）
      const fExtraNum = flex.extraPension || 0
      flexExtraAmountText = fExtraNum.toFixed(2)
      if (fExtraNum > 0) {
        const fSeg1 = Math.min(5, Math.max(0, fTotalYearsNum - 20))
        const fRest  = Math.max(0, fTotalYearsNum - 25)
        flexExtraFormulaText = '分段代入：0.15%×' + fSeg1 + '年 + 0.20%×' + fRest + '年'
        flexExtraSubstitute  = '基础养老金 × (0.15%×' + fSeg1 + ' + 0.20%×' + fRest + ')'
      }

      // 弹性其他加发（独生子女补贴等）
      const fBonusNum = flex.bonusPension || 0
      flexBonusAmountText = fBonusNum > 0 ? fBonusNum.toFixed(2) + '元/月' : ''
      flexBonusDescText = (flex.bonusDesc || '')

      // 弹性缴费年限`;

if (js.includes(jsOld)) {
  js = js.replace(jsOld, jsNew);
  console.log('  [OK] JS 插入 flexBonus 计算逻辑');
} else {
  console.log('  [WARN] 未找到匹配的代码块');
  // 尝试搜索关键行
  const idx = js.indexOf('fExtraNum = flex.extraPension');
  if (idx > 0) {
    console.log('  [INFO] 找到 fExtraNum 位置');
    console.log('  [DEBUG] 实际内容:', js.substring(idx - 100, idx + 300));
  }
}

fs.writeFileSync(jsPath, js, 'utf8');
console.log('  [OK] JS 已保存\n');

console.log('=== 修复完成 ===');
console.log('请重新编译并测试！');

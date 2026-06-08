const fs = require('fs');

// ===== 1. 修复 pages/report/index.js =====
const reportJsPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.js';
let jsContent = fs.readFileSync(reportJsPath, 'utf8');

console.log('[1] 修复 pages/report/index.js');

// --- 修改点1: 在弹性增发计算后插入 flexBonus 计算 ---
const oldExtraCalc = `      // 弹性增发（分段代入）
      const fExtraNum = flex.extraPension || 0
      flexExtraAmountText = fExtraNum.toFixed(2)
      if (fExtraNum > 0) {
        const fSeg1 = Math.min(5, Math.max(0, fTotalYearsNum - 20))
        const fRest  = Math.max(0, fTotalYearsNum - 25)
        flexExtraFormulaText = '分段代入：0.15%×' + fSeg1 + '年 + 0.20%×' + fRest + '年'
        flexExtraSubstitute  = '基础养老金 × (0.15%×' + fSeg1 + ' + 0.20%×' + fRest + ')'
      }`;

const newExtraCalc = `      // 弹性增发（分段代入）
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
      flexBonusDescText = (flex.bonusDesc || '')`;

if (jsContent.includes(oldExtraCalc)) {
  jsContent = jsContent.replace(oldExtraCalc, newExtraCalc);
  console.log('  [OK] 插入 flexBonus 计算逻辑');
} else {
  console.log('  [WARN] 未找到弹性增发计算代码块');
  // 尝试搜索关键行
  const idx = jsContent.indexOf('fExtraNum = flex.extraPension');
  if (idx > 0) {
    console.log('  [INFO] 找到 fExtraNum 位置:', idx);
  }
}

// --- 修改点2: 在 setData 中插入 flexBonusAmountText 和 flexBonusDescText ---
const oldSetData = `      flexExtraAmountText, flexExtraFormulaText, flexExtraSubstitute,
      flexTotalYearsText, flexTotalYearsCalc,`;

const newSetData = `      flexExtraAmountText, flexExtraFormulaText, flexExtraSubstitute,
      flexBonusAmountText, flexBonusDescText,
      flexTotalYearsText, flexTotalYearsCalc,`;

if (jsContent.includes(oldSetData)) {
  jsContent = jsContent.replace(oldSetData, newSetData);
  console.log('  [OK] 插入 setData flexBonus 变量');
} else {
  console.log('  [WARN] 未找到 setData 中的 flexExtraAmountText');
}

// --- 修改点3: 在 Canvas 绘制函数中插入弹性独生子女补贴绘制 ---
// 在 _drawReportImage 函数中，找到绘制 "④ 增发基础养老金（弹性）" 之后，插入绘制独生子女补贴
const oldCanvasFlex = `      if (d.showExtra && d.flexExtraAmountText !== '0.00') {
        y = this._drawReportCalcRow(ctx, W, y, '④ 增发基础养老金（弹性）', d.flexExtraAmountText || '¥0.00')
      }
      // 弹性合计`;

const newCanvasFlex = `      if (d.showExtra && d.flexExtraAmountText !== '0.00') {
        y = this._drawReportCalcRow(ctx, W, y, '④ 增发基础养老金（弹性）', d.flexExtraAmountText || '¥0.00')
      }
      if (d.flexBonusAmountText) {
        y = this._drawReportCalcRow(ctx, W, y, '⑤ ' + (d.otherLabel || '其它加发（弹性）'), '¥' + d.flexBonusAmountText)
      }
      // 弹性合计`;

if (jsContent.includes(oldCanvasFlex)) {
  jsContent = jsContent.replace(oldCanvasFlex, newCanvasFlex);
  console.log('  [OK] 插入 Canvas 弹性独生子女补贴绘制');
} else {
  console.log('  [WARN] 未找到 Canvas 弹性合计前的代码');
  const idx = jsContent.indexOf('弹性合计');
  if (idx > 0) {
    console.log('  [INFO] 找到 "弹性合计" 位置:', idx);
  }
}

// 写回 JS 文件
fs.writeFileSync(reportJsPath, jsContent, 'utf8');
console.log('  [OK] pages/report/index.js 已保存\n');

// ===== 2. 修复 pages/report/index.wxml =====
console.log('[2] 修复 pages/report/index.wxml');
const reportWxmlPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.wxml';
let wxmlContent = fs.readFileSync(reportWxmlPath, 'utf8');

// 在弹性合计块之前插入弹性其他加发区块
// 找到 </view>\n      </view>\n\n      <view class="flex-compare"> 这样的结构
const oldFlexWxml = `        <view class="total-value">¥{{flexTotalAmountText}}</view>
      </view>

      <view class="flex-compare">`;

const newFlexWxml = `        <view class="total-value">¥{{flexTotalAmountText}}</view>
      </view>

      <!-- 弹性其他加发 -->
      <block wx:if="{{flexBonusAmountText}}">
        <view class="result-row">
          <text class="result-label">其他加发(弹性)：</text>
          <text class="result-value">{{flexBonusAmountText}}</text>
          <text class="result-desc">{{flexBonusDescText}}</text>
        </view>
      </block>

      <view class="flex-compare">`;

if (wxmlContent.includes(oldFlexWxml)) {
  wxmlContent = wxmlContent.replace(oldFlexWxml, newFlexWxml);
  console.log('  [OK] 插入 WXML 弹性其他加发区块');
} else {
  console.log('  [WARN] 未找到 WXML 弹性合计区块');
  // 尝试搜索
  const idx = wxmlContent.indexOf('flexTotalAmountText');
  if (idx > 0) {
    console.log('  [INFO] 找到 flexTotalAmountText 位置');
    // 打印附近内容
    console.log('  [DEBUG]', wxmlContent.substring(idx - 100, idx + 200));
  }
}

// 写回 WXML 文件
fs.writeFileSync(reportWxmlPath, wxmlContent, 'utf8');
console.log('  [OK] pages/report/index.wxml 已保存\n');

console.log('=== 全部修复完成 ===');
console.log('请重新编译小程序并测试云南弹性退休测算！');
console.log('预期结果：弹性退休区块应显示"其他加发(弹性)：XXX元/月 独生子女补贴"');

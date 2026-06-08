const fs = require('fs');

// 修复 pages/report/index.js
const reportJsPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.js';
let content = fs.readFileSync(reportJsPath, 'utf8');

console.log('[1] 开始修复 pages/report/index.js');

// 1. 在 _doFill 的弹性部分插入 flexBonus 计算
const flexExtraLine = "var flexExtraAmount = (flex && flex.extraPension) ? flex.extraPension : 0;";
const flexBonusInsert = "          var flexExtraAmount = (flex && flex.extraPension) ? flex.extraPension : 0;\n          var flexBonusAmount = (flex && flex.bonusPension) ? flex.bonusPension : 0;\n          var flexBonusDesc = (flex && flex.bonusDesc) ? flex.bonusDesc : '';";

if (content.includes(flexExtraLine)) {
  content = content.replace(flexExtraLine, flexBonusInsert);
  console.log('[OK] 插入 flexBonus 计算逻辑');
} else {
  console.log('[WARN] 未找到 flexExtraLine');
}

// 2. 计算 flexBonusAmountText 和 flexBonusDescText
const calcMarker = "var flexExtraAmountText = flexExtraAmount > 0 ? flexExtraAmount.toFixed(2) + '元/月' : '';";
const calcInsert = "var flexBonusAmountText = flexBonusAmount > 0 ? flexBonusAmount.toFixed(2) + '元/月' : '';\n          var flexBonusDescText = flexBonusDesc || '';";

if (content.includes(calcMarker)) {
  content = content.replace(calcMarker, calcMarker + '\n          ' + calcInsert);
  console.log('[OK] 插入 flexBonus 文本计算');
} else {
  console.log('[WARN] 未找到 calcMarker');
}

// 3. 在 setData 里插入 flexBonusAmountText 和 flexBonusDescText
const setDataTarget = "            flexExtraAmountText: flexExtraAmountText,";
const setDataInsert = "\n            flexBonusAmountText: flexBonusAmountText,\n            flexBonusDescText: flexBonusDescText,";

if (content.includes(setDataTarget)) {
  content = content.replace(setDataTarget, setDataTarget + setDataInsert);
  console.log('[OK] 插入 flexBonus setData');
} else {
  console.log('[WARN] 未找到 setDataTarget');
}

// 写回文件
fs.writeFileSync(reportJsPath, content, 'utf8');
console.log('[OK] pages/report/index.js 已更新');

// 修复 pages/report/index.wxml
console.log('\n[2] 开始修复 pages/report/index.wxml');
const reportWxmlPath = 'C:/Users/14041/WorkBuddy/20260429075638/缴费指数计算器/pages/report/index.wxml';
let wxml = fs.readFileSync(reportWxmlPath, 'utf8');

// 在弹性退休的增发项后面插入独生子女补贴项
const flexExtraBlock = '<block wx:if="{{showExtra && flexExtraAmountText}}">\n            <view class="result-row">\n              <text class="result-label">增发基础养老金(弹性)：</text>\n              <text class="result-value">{{flexExtraAmountText}}</text>\n            </view>\n          </block>';
const flexBonusBlock = '\n          <block wx:if="{{flexBonusAmountText}}">\n            <view class="result-row">\n              <text class="result-label">其他加发(弹性)：</text>\n              <text class="result-value">{{flexBonusAmountText}}</text>\n              <text class="result-desc">{{flexBonusDescText}}</text>\n            </view>\n          </block>';

if (wxml.includes(flexExtraBlock)) {
  wxml = wxml.replace(flexExtraBlock, flexExtraBlock + flexBonusBlock);
  console.log('[OK] 插入弹性退休独生子女补贴区块');
} else {
  console.log('[WARN] 未找到 flexExtraBlock');
  // 尝试搜索
  const idx = wxml.indexOf('flexExtraAmountText');
  if (idx > 0) {
    console.log('[INFO] 找到 flexExtraAmountText 在位置', idx);
  }
}

fs.writeFileSync(reportWxmlPath, wxml, 'utf8');
console.log('[OK] pages/report/index.wxml 已更新');

console.log('\n=== 修复完成 ===');
console.log('请重新编译小程序并测试云南弹性退休测算！');

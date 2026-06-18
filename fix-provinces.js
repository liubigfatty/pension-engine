// fix-provinces.js
// 批量修复31省配置：在 getEngineConfig() 的 return 块里加上
// account_start 和 cutoff_date（如果缺失）

const fs = require('fs');
const path = require('path');

const provDir = './data/provinces';
const files = fs.readdirSync(provDir).filter(f => f.endsWith('.js')).sort();

let fixed = 0;
let skipped = 0;

files.forEach(f => {
  const fp = path.join(provDir, f);
  let content = fs.readFileSync(fp, 'utf8');

  // 检查 getEngineConfig 函数里是否已有 account_start:
  const fnMatch = content.match(/function getEngineConfig[\s\S]*?^}/m);
  if (!fnMatch) {
    console.log('  SKIP: 找不到函数结尾', f);
    skipped++;
    return;
  }
  const fnBody = fnMatch[0];

  if (fnBody.includes('account_start:') && /account_start:\s*ACCOUNT_START/.test(fnBody)) {
    // console.log('  OK (已有)', f);
    skipped++;
    return;
  }

  // 在 return { 块里找到 province: 的位置，在前面插入
  // 策略：直接对 content 做字符串替换
  // 找到 return { 块，解析其括号，找到 province: 那一行

  const retMatch = content.match(/return\s*\{/);
  if (!retMatch) {
    console.log('  SKIP: 找不到 return', f);
    skipped++;
    return;
  }

  const retStart = content.indexOf(retMatch[0]) + retMatch[0].length - 1; // 指向 {

  // 找到 return 块的结尾 }
  let b = 0;
  let retEnd = -1;
  for (let i = retStart; i < content.length; i++) {
    if (content[i] === '{') b++;
    if (content[i] === '}') { b--; if (b === 0) { retEnd = i; break; } }
  }

  if (retEnd === -1) {
    console.log('  SKIP: 找不到 return 块结尾', f);
    skipped++;
    return;
  }

  // 在 retStart ~ retEnd 之间找 /^    province:\s*PROV_TAG/m
  const retBlock = content.substring(retStart + 1, retEnd); // 不含外括号
  const provLineMatch = retBlock.match(/^\s*province:\s*PROV_TAG/m);
  if (!provLineMatch) {
    console.log('  SKIP: 找不到 province: 行', f);
    skipped++;
    return;
  }

  // 插入位置 = retStart + 1 + provLineMatch.index
  const insertPos = retStart + 1 + provLineMatch.index;
  const insertStr = '    account_start: ACCOUNT_START,\n    cutoff_date: CUTOFF_DATE,\n';

  const newContent = content.substring(0, insertPos) + insertStr + content.substring(insertPos);
  fs.writeFileSync(fp, newContent, 'utf8');
  console.log('  FIXED:', f);
  fixed++;
});

console.log('\n完成: 修复', fixed, '个, 跳过', skipped, '个');

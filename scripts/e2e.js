/**
 * 小程序端到端自动化测试
 * 
 * 前置步骤（只需做一次）：
 *   1. 打开微信开发者工具，加载本项目
 *   2. 设置 → 安全设置 → 开启"服务端口"（已知端口 50981）
 *   3. 工具(T) → 自动化测试(A) → 开启自动化
 *   4. 运行：node scripts/e2e.js
 *
 * 如需自定义端口，修改下方 WS_ENDPOINT 即可。
 */

const automator = require('miniprogram-automator');
const fs = require('fs');
const path = require('path');

// ===== 配置：根据机器实际情况修改 =====
const WS_ENDPOINT = 'ws://127.0.0.1:65010';
// =========================================

// ===== 工具函数 =====

async function wait(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// 通过 data-value 点击 radio 项
async function tapRadio(page, value) {
  const items = await page.$$('.radio-item');
  for (const item of items) {
    const v = await item.attribute('data-value');
    if (v === value) { await item.tap(); return true; }
  }
  return false;
}

// ===== 核心：在小程序里填表单并提交 =====

async function runCase(miniProgram, caseData) {
  // 重启到首页
  await miniProgram.reLaunch({ url: '/pages/index/index' });
  await wait(800);
  let page = await miniProgram.currentPage();

  // --- Step1：点"开始测算" ---
  const startBtn = await page.$('.btn-start');
  if (startBtn) { await startBtn.tap(); await wait(800); }
  page = await miniProgram.currentPage();

  // --- Step2：填个人信息 ---
  // 性别
  await tapRadio(page, caseData.gender === 'male' ? 'male' : 'female');
  await wait(300);

  // 参保身份
  await tapRadio(page, caseData.identity === 'employee' ? 'employee' : 'flexible');
  await wait(300);

  // 女职工退休年龄（仅女性+企业职工）
  if (caseData.gender === 'female' && caseData.identity === 'employee' && caseData.femaleEmployeeAge) {
    await tapRadio(page, caseData.femaleEmployeeAge);
    await wait(300);
  }

  // 出生年月 & 参加工作时间：用 setData 绕过 picker
  const [by, bm] = (caseData.birthDate || '1968-01').split('-').map(Number);
  const [wy, wm] = (caseData.workStartDate || '1988-01').split('-').map(Number);
  await page.setData({ birthYear: by, birthMonth: bm, workYear: wy, workMonth: wm });
  await wait(300);

  // 点"下一步"
  const nextBtn = await page.$('.btn-next');
  if (nextBtn) { await nextBtn.tap(); await wait(1000); }
  page = await miniProgram.currentPage();

  // --- Step3：填缴费信息 ---
  // 缴费指数
  if (caseData.averageIndex) {
    await page.setData({ useCustomIndex: true, customIndex: String(caseData.averageIndex) });
    await wait(300);
  }
  // 个人账户余额
  if (caseData.personalAccount) {
    await page.setData({ accountBalance: String(caseData.personalAccount) });
    await wait(200);
  }

  // 点"计算养老金"
  const calcBtn = await page.$('.btn-calculate');
  if (calcBtn) { await calcBtn.tap(); await wait(2500); }
  page = await miniProgram.currentPage();

  // --- 读取结果 ---
  const resultData = await page.data();
  return {
    total: resultData.totalPension || resultData.total || 0,
    basePension: resultData.basePension || 0,
    personalPension: resultData.personalPension || 0,
    transitionPension: resultData.transitionPension || 0,
  };
}

// ===== 主流程 =====

async function main() {
  console.log('=== 养老金计算平台 端到端自动化测试 ===\n');
  console.log(`WebSocket 端点: ${WS_ENDPOINT}\n`);

  // 连接开发者工具
  let automatorInstance;
  console.log('正在连接开发者工具...');
  for (let i = 0; i < 5; i++) {
    try {
      await wait(2000);
      automatorInstance = await automator.connect({ wsEndpoint: WS_ENDPOINT });
      console.log('✅ 已连接开发者工具\n');
      break;
    } catch (e) {
      console.log(`  重试 ${i + 1}/5 ... (${e.message})`);
    }
  }
  if (!automatorInstance) {
    console.error('\n❌ 无法连接，请确认：');
    console.error('  1. 微信开发者工具已打开，本项目已加载');
    console.error('  2. 工具(T) → 自动化测试(A) → 开启自动化');
    console.error(`  3. WS_ENDPOINT 是否正确（当前: ${WS_ENDPOINT}）`);
    process.exit(1);
  }

  const miniProgram = automatorInstance.miniProgram;

  // 加载案例
  const casesDir = path.join(__dirname, '..', 'cases');
  const allCases = [];
  if (!fs.existsSync(casesDir)) {
    console.error('❌ cases/ 目录不存在，请先运行 scripts/run-cases.js 生成案例');
    process.exit(1);
  }
  for (const province of fs.readdirSync(casesDir).filter(
    f => fs.statSync(path.join(casesDir, f)).isDirectory()
  )) {
    const dir = path.join(casesDir, province);
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.json'))) {
      const caseData = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      allCases.push({ province, file: f, data: caseData });
    }
  }

  console.log(`共 ${allCases.length} 个案例\n`);
  let pass = 0, fail = 0;

  for (const { province, file, data } of allCases) {
    process.stdout.write(`  ${province}/${file} ... `);
    try {
      const actual = await runCase(miniProgram, data);
      const expected = data.expected || {};

      let casePass = true;
      const diffs = [];
      for (const key of ['total', 'basePension', 'personalPension']) {
        if (expected[key] !== undefined) {
          const diff = Math.abs(actual[key] - expected[key]);
          if (diff > 1) {
            casePass = false;
            diffs.push(`${key}: 预期${expected[key]} vs 实际${actual[key]}`);
          }
        }
      }

      if (casePass) { pass++; console.log('✅'); }
      else { fail++; console.log(`❌ ${diffs.join('; ')}`); }
    } catch (e) {
      fail++;
      console.log(`❌ ${e.message}`);
    }
  }

  console.log(`\n=== 汇总 ===`);
  console.log(`通过: ${pass}  失败: ${fail}`);
  await automatorInstance.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('❌ 异常:', e.message);
  process.exit(1);
});

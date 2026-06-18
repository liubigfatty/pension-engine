// read-extras.js - 读取8个有加发项省份的 EXTRA_PARAMS
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const provDir = path.join(__dirname, 'data/provinces');

// 8个有 EXTRA_PARAMS 的省份
const targetCodes = ['beijing','gansu','heilongjiang','jiangsu','jilin','shanghai','sichuan','yunnan'];

const results = {};

targetCodes.forEach(code => {
  try {
    const filePath = path.join(provDir, code + '.js');
    const codeText = fs.readFileSync(filePath, 'utf-8');
    
    // 用 vm 执行，获取 EXTRA_PARAMS
    const sandbox = { module: { exports: {} }, exports: {}, require, console };
    vm.createContext(sandbox);
    vm.runInContext(codeText, sandbox);
    
    const m = sandbox.module.exports;
    const extras = m.EXTRA_PARAMS || null;
    
    results[code] = {
      name: m.name || code,
      extras: extras,
      MODULES: m.MODULES || null
    };
    
    if (extras) {
      console.log(`✅ ${m.name || code}:`);
      console.log(JSON.stringify(extras, null, 2));
      console.log('');
    } else {
      console.log(`⚠️  ${m.name || code}: EXTRA_PARAMS = null`);
      console.log('  MODULES:', m.MODULES);
      console.log('');
    }
  } catch(e) {
    console.log(`❌ ${code}:`, e.message);
  }
});

fs.writeFileSync(
  path.join(__dirname, 'miniprogram/assets/extras-detail.json'),
  JSON.stringify(results, null, 2),
  'utf-8'
);
console.log('\n✅ 详情已写入 miniprogram/assets/extras-detail.json');

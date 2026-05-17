/**
 * 用pension-engine.js真实运行新案例验证
 * 吉林省长春市男性，1966-02-21出生，2026-02-21退休
 */
const engine = require('./engine/pension-engine');
const config = require('./provinces/jilin.json');

const input = {
  gender: '男',
  birthDate: '1966-02-21',
  retireDate: '2026-02-21',
  city: '长春市',
  
  // 缴费信息
  workStartDate: '1984-07-24',    // 参加工作时间
  actualStart: '1995-01-01',       // 假设建立个人账户时间（视同11年=1984到1995）
  accountStart: '1995-01-01',
  
  // 核心计算参数（直接指定，跳过内部估算）
  totalYears: 41.67,
  actualYears: 30.67,
  sightYears: 11,
  
  avgIndex: 0.62,
  
  // 个人账户
  personalAccInput: {
    type: 'balance',
    balance: 96750.01
  }
};

try {
  const result = engine.calculate(config, input);
  console.log('=== pension-engine.js 计算结果 ===\n');
  
  const legal = result.legal;
  if (legal) {
    console.log('① 基础养老金：', legal.basicPension?.amount?.toFixed(2) || 'N/A');
    console.log('② 增发养老金：', legal.extraPension?.amount?.toFixed(2) || 'N/A');
    console.log('③ 个人账户：  ', legal.personalAccount?.amount?.toFixed(2) || 'N/A');
    console.log('④ 过渡性养老金：', legal.transPension?.amount?.toFixed(2) || 'N/A');
    console.log('');
    console.log('合计：', legal.total?.toFixed(2) || 'N/A');
    console.log('官方：4295.4');
    console.log('误差：', ((legal.total || 0) - 4295.4).toFixed(2));
  } else {
    console.log('完整结果：', JSON.stringify(result, null, 2));
  }
} catch (e) {
  console.error('引擎运行错误：', e.message);
  console.error(e.stack);
}

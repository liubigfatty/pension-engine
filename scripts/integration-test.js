/**
 * 集成测试：模拟完整链路（UI参数 → 云函数 → 引擎）
 * 重点：女干部（fc）场景 + 个人账户余额传递
 */

const engine = require('./cloudfunctions/calculate/pension-engine.js');

// 模拟云函数 index.js 的参数处理逻辑
function simulateCloudFunction(params) {
  const { province, cityType, gender, identity, genderType, birthDate, workStartDate, averageIndex, personalAccount, extras } = params;

  // 加载省份配置
  const provModule = require(`./cloudfunctions/calculate/provinces/${province}.js`);
  const config = provModule.getEngineConfig();

  // 构造引擎输入（和 index.js 完全一致）
  const input = {
    gender,
    identity,
    genderType: genderType || (gender === 'male' ? 'male' : 'fw50'),
    birthYear: parseInt(birthDate.split('-')[0]),
    birthMonth: parseInt(birthDate.split('-')[1]),
    workYear: parseInt(workStartDate.split('-')[0]),
    workMonth: parseInt(workStartDate.split('-')[1]),
    avgIndex: parseFloat(averageIndex),
    personalAccInput: parseFloat(personalAccount) || 0,
    extras: extras || {},
    cityType: cityType || 'prov',
  };

  // 调用引擎
  const result = engine.calculate(config, input);
  return { input, result };
}

console.log('=== 测试1：女干部（fc），有个人账户余额 ===\n');

let { input: inp1, result: res1 } = simulateCloudFunction({
  province: 'beijing',
  cityType: 'prov',
  gender: 'female',
  identity: '',
  genderType: 'fc',  // 女干部
  birthDate: '1969-06',  // 2024年满55岁
  workStartDate: '1995-07',
  averageIndex: '1.0',
  personalAccount: '120000',  // 个人账户余额 12万
});

console.log('输入 genderType:', inp1.genderType);
console.log('输入 personalAccInput:', inp1.personalAccInput);
console.log('退休年龄:', res1.retireAge);
console.log('计发月数:', res1.months);
console.log('个人账户余额（引擎返回）:', res1.accountBalance);
console.log('个人账户养老金:', res1.personalAccountPension);
console.log('基础养老金:', res1.basicPension);
console.log('总养老金:', res1.totalPension);
console.log('');

if (!res1.personalAccountPension || res1.personalAccountPension === 0) {
  console.log('❌ 问题确认：个人账户养老金为0！');
  console.log('   accountBalance:', res1.accountBalance);
  console.log('   months:', res1.months);
} else {
  console.log('✅ 个人账户养老金正常：', res1.personalAccountPension);
}

console.log('\n=== 测试2：女工人（fw50），对比 ===\n');

let { input: inp2, result: res2 } = simulateCloudFunction({
  province: 'beijing',
  cityType: 'prov',
  gender: 'female',
  identity: '',
  genderType: 'fw50',  // 女工人
  birthDate: '1974-06',  // 2024年满50岁
  workStartDate: '1995-07',
  averageIndex: '1.0',
  personalAccount: '120000',
});

console.log('输入 genderType:', inp2.genderType);
console.log('退休年龄:', res2.retireAge);
console.log('计发月数:', res2.months);
console.log('个人账户养老金:', res2.personalAccountPension);
console.log('');

console.log('\n=== 测试3：personalAccount 为 0（不填）时，引擎是否自动估算 ===\n');

let { input: inp3, result: res3 } = simulateCloudFunction({
  province: 'beijing',
  cityType: 'prov',
  gender: 'female',
  identity: '',
  genderType: 'fc',
  birthDate: '1969-06',
  workStartDate: '1995-07',
  averageIndex: '1.0',
  personalAccount: '0',  // 不填余额
});

console.log('输入 personalAccInput:', inp3.personalAccInput);
console.log('引擎估算的账户余额:', res3.accountBalance);
console.log('个人账户养老金（估算）:', res3.personalAccountPension);
console.log('');

if (!res3.accountBalance || res3.accountBalance === 0) {
  console.log('❌ 问题：不填余额时，引擎也没有估算！');
} else {
  console.log('✅ 引擎自动估算正常');
}

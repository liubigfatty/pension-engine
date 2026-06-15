// website/js/app.js - 网页端应用逻辑

// 省份配置列表
const PROVINCES = {
  'jilin': { name: '吉林省' },
  'liaoning': { name: '辽宁省' },
  'heilongjiang': { name: '黑龙江省' },
  'beijing': { name: '北京市' },
  'tianjin': { name: '天津市' },
  'shanghai': { name: '上海市' },
  'chongqing': { name: '重庆市' },
  'hebei': { name: '河北省' },
  'shanxi': { name: '山西省' },
  'neimenggu': { name: '内蒙古' },
  'shandong': { name: '山东省' },
  'henan': { name: '河南省' },
  'jiangsu': { name: '江苏省' },
  'zhejiang': { name: '浙江省' },
  'anhui': { name: '安徽省' },
  'fujian': { name: '福建省' },
  'jiangxi': { name: '江西省' },
  'hubei': { name: '湖北省' },
  'hunan': { name: '湖南省' },
  'guangdong': { name: '广东省' },
  'guangxi': { name: '广西' },
  'hainan': { name: '海南省' },
  'sichuan': { name: '四川省' },
  'guizhou': { name: '贵州省' },
  'yunnan': { name: '云南省' },
  'shaanxi': { name: '陕西省' },
  'gansu': { name: '甘肃省' },
  'qinghai': { name: '青海省' },
  'ningxia': { name: '宁夏' },
  'xinjiang': { name: '新疆' },
  'xizang': { name: '西藏' }
};

// 表单字段配置
const FIELD_CONFIG = {
  birthDate: {
    label: '出生年月',
    validate: (v) => {
      if (!v) return '请选择出生年月';
      const [y, m] = v.split('-').map(Number);
      const now = new Date();
      if (y < 1960 || y > now.getFullYear() - 18) return '出生年份应在1960年至今';
      return null;
    }
  },
  workDate: {
    label: '参保时间',
    validate: (v, all) => {
      if (!v) return '请选择参保时间';
      const birth = all.birthDate;
      if (birth) {
        const [wy, wm] = v.split('-').map(Number);
        const [by] = birth.split('-').map(Number);
        if (wy < by + 16) return '参保时间不能早于16岁';
      }
      return null;
    }
  },
  avgIndex: {
    label: '平均缴费指数',
    validate: (v) => {
      const num = parseFloat(v);
      if (!v || isNaN(num)) return '请输入平均缴费指数';
      if (num < 0.6 || num > 3) return '缴费指数应在0.6~3.0之间';
      return null;
    }
  },
  personalAcc: {
    label: '个人账户余额',
    validate: (v) => {
      if (!v) return null; // 可为空，自动估算
      const num = parseFloat(v);
      if (isNaN(num) || num < 0) return '个人账户余额不能为负数';
      if (num > 200000) return '个人账户余额一般不超过20万';
      return null;
    }
  },
  monthlyIncome: {
    label: '月收入',
    validate: (v) => {
      if (!v) return null; // 可为空
      const num = parseFloat(v);
      if (isNaN(num) || num < 0) return '月收入不能为负数';
      return null;
    }
  }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  initProvinceSelect();
  initGenderWatch();
  initFormValidation();
  initFromUrlParams();
});

// 从 URL 参数填充表单（首页跳转过来时自动带入月收入和省份）
function initFromUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const monthlyIncome = params.get('monthlyIncome');
  const province = params.get('province');
  const avgIndex = params.get('avgIndex');

  if (monthlyIncome) {
    const el = document.getElementById('monthlyIncome');
    if (el) el.value = monthlyIncome;
  }
  if (province) {
    const el = document.getElementById('province');
    if (el) {
      el.value = province;
      el.dispatchEvent(new Event('change')); // 触发省份变更事件
    }
  }
  if (avgIndex) {
    const el = document.getElementById('avgIndex');
    if (el) el.value = avgIndex;
  }

  // 清除 URL 参数（不影响浏览器历史）
  if (monthlyIncome || province || avgIndex) {
    const cleanUrl = window.location.pathname;
    history.replaceState(null, '', cleanUrl);
  }
}

// 初始化表单实时校验
function initFormValidation() {
  Object.keys(FIELD_CONFIG).forEach(fieldId => {
    const el = document.getElementById(fieldId);
    if (!el) return;
    
    // 添加错误提示元素
    const parent = el.closest('.form-group');
    if (parent && !parent.querySelector('.form-error')) {
      const errorEl = document.createElement('div');
      errorEl.className = 'form-error';
      parent.appendChild(errorEl);
    }
    
    // 实时校验
    el.addEventListener('blur', () => validateField(fieldId));
    el.addEventListener('input', () => {
      const parent = el.closest('.form-group');
      if (parent?.classList.contains('error')) {
        validateField(fieldId);
      }
    });
  });
}

// 校验单个字段
function validateField(fieldId) {
  const config = FIELD_CONFIG[fieldId];
  if (!config) return true;
  
  const el = document.getElementById(fieldId);
  const parent = el.closest('.form-group');
  const errorEl = parent?.querySelector('.form-error');
  const value = el.value;
  
  // 收集其他字段值（用于交叉校验）
  const allValues = {};
  Object.keys(FIELD_CONFIG).forEach(id => {
    const el = document.getElementById(id);
    if (el) allValues[id] = el.value;
  });
  
  const error = config.validate(value, allValues);
  
  if (parent) {
    parent.classList.remove('error', 'success');
    if (error) {
      parent.classList.add('error');
      if (errorEl) errorEl.textContent = error;
    } else if (value) {
      parent.classList.add('success');
    }
  }
  
  return !error;
}

// 校验所有必填字段
function validateForm() {
  let isValid = true;
  const values = {};
  
  // 收集所有字段值
  Object.keys(FIELD_CONFIG).forEach(id => {
    const el = document.getElementById(id);
    if (el) values[id] = el.value;
  });
  
  // 校验每个字段
  Object.keys(FIELD_CONFIG).forEach(fieldId => {
    if (!validateField(fieldId)) {
      isValid = false;
    }
  });
  
  // 省份必选
  const provinceEl = document.getElementById('province');
  if (!provinceEl?.value) {
    isValid = false;
    alert('请选择参保地区');
  }
  
  return isValid;
}

// 初始化省份下拉框
function initProvinceSelect() {
  const select = document.getElementById('province');
  if (!select) return;
  
  Object.entries(PROVINCES).forEach(([code, config]) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = config.name;
    select.appendChild(option);
  });
}

// 监听人员类型变化（灵活就业无视同缴费年限，由引擎自动处理）

// 省份变化时更新城市列表
function onProvinceChange() {
  const select = document.getElementById('province');
  const cityGroup = document.getElementById('cityGroup');
  const citySelect = document.getElementById('city');
  const code = select.value;

  // 有城市子选项的省份显示城市下拉
  cityGroup.style.display = 'block';
  citySelect.innerHTML = '<option value="prov">全省默认</option>';

  // 从省份配置加载城市列表
  fetch(`js/provinces/${code}.json`)
    .then(r => r.json())
    .then(config => {
      if (config.cities && config.cities.length > 1) {
        citySelect.innerHTML = config.cities.map(c =>
          `<option value="${c.code}">${c.name}</option>`
        ).join('');
      }
    })
    .catch(() => {});
}

// 计算养老金
function calculate() {
  // 校验表单
  if (!validateForm()) return;

  // 人员类型
  const personType = document.getElementById('personType').value;
  if (!personType) {
    alert('请选择人员类型');
    return;
  }

  const province = document.getElementById('province').value;
  const birthDate = document.getElementById('birthDate').value;
  const workDate = document.getElementById('workDate').value;
  const [birthY, birthM] = birthDate.split('-').map(Number);
  const [workY, workM] = workDate.split('-').map(Number);
  
  // 缴费指数：优先使用手动填写的指数，否则从月收入计算
  const avgIndexInput = document.getElementById('avgIndex').value;
  const monthlyIncome = document.getElementById('monthlyIncome').value ? 
    parseFloat(document.getElementById('monthlyIncome').value) : null;
  const personalAcc = document.getElementById('personalAcc').value ? 
    parseFloat(document.getElementById('personalAcc').value) : null;
  const cityType = document.getElementById('city').value || 'prov';

  // personType → 引擎参数映射
  const PERSON_TYPE_MAP = {
    'male':       { gender: 'male',   type: 'standard', genderType: 'male' },
    'fw':         { gender: 'female', type: 'standard', genderType: 'fw'   },
    'fc':         { gender: 'female', type: 'standard', genderType: 'fc'   },
    'eco_male':   { gender: 'male',   type: 'flexible', genderType: 'male' },
    'eco_female': { gender: 'female', type: 'flexible', genderType: 'fw55' },
  };
  const typeMap = PERSON_TYPE_MAP[personType] || PERSON_TYPE_MAP['male'];

  // 视同缴费改为由引擎根据省份配置自动计算，不手动传值
  const sightYears = undefined;

  // 原始数据传给 loadAndCalculate，在获取省份配置后计算缴费指数
  loadAndCalculate(province, {
    birthYear: birthY, birthMonth: birthM,
    workYear: workY, workMonth: workM,
    cityType,
    userType: typeMap.type,
    gender: typeMap.gender,
    genderType: typeMap.genderType,
    sightYears,
    avgIndexInput,       // 可能是空字符串，由引擎决定默认值
    monthlyIncome,
    personalAccInput: personalAcc
  }, typeMap.type);
}

async function loadAndCalculate(provinceCode, formData, userType) {
  const btn = document.getElementById('calcBtn');
  btn.disabled = true;
  btn.innerHTML = '<span>计算中...</span>';
  
  try {
    const response = await fetch(`js/provinces/${provinceCode}.json`);
    if (!response.ok) throw new Error('省份配置加载失败');
    const config = await response.json();
    
    // 缴费指数计算：优先使用手动填写的指数，否则从月收入计算
    let avgIndex = parseFloat(formData.avgIndexInput);
    if (isNaN(avgIndex) && formData.monthlyIncome) {
      // 月收入 → 缴费基数（受社平60%~300%上下限约束）→ 缴费指数
      const avgWage = config.base_salary_2025 || 8000; // 默认值
      const minBase = avgWage * 0.6;
      const maxBase = avgWage * 3.0;
      const contribBase = Math.min(Math.max(formData.monthlyIncome, minBase), maxBase);
      avgIndex = contribBase / avgWage;
    }
    if (isNaN(avgIndex)) avgIndex = 1.0; // 默认指数

    const input = {
      gender: formData.gender,
      genderType: formData.genderType,
      birthYear: formData.birthYear, birthMonth: formData.birthMonth,
      workYear: formData.workYear, workMonth: formData.workMonth,
      cityType: formData.cityType,
      retireType: formData.userType === 'flexible' ? 'economic' : 'standard',
      sightYears: formData.sightYears,
      avgIndex,
      personalAccInput: formData.personalAccInput
    };
    
    // 调用引擎计算
    const result = window.PensionEngine.calculate(config, input);
    displayResult(result);
  } catch(e) {
    console.error('计算失败:', e);
    alert('计算失败：' + (e.message || '请稍后重试'));
  } finally {
    btn.disabled = false;
    btn.textContent = '重新测算';
  }
}

function displayResult(r) {
  const L = r.legal;
  
  // 主结果
  document.getElementById('totalAmount').textContent = L.total?.toFixed(2) || '0';
  document.getElementById('basicPension').textContent = L.basicPension?.amount?.toFixed(2) || '0';
  document.getElementById('extraPension').textContent = L.extraPension?.amount?.toFixed(2) || '0';
  document.getElementById('personalPension').textContent = L.personalAccount?.amount?.toFixed(2) || '0';
  document.getElementById('transPension').textContent = L.transitionalPension?.amount?.toFixed(2) || '0';
  
  // 关键参数
  document.getElementById('retireDate').textContent = L.date ? `${L.date.year}年${L.date.month}月` : '-';
  document.getElementById('retireAge').textContent = L.ageStr || '-';
  document.getElementById('totalYears').textContent = L.totalYears ? `${L.totalYears.toFixed(2)}年` : '-';
  document.getElementById('rate').textContent = L.rate ? `${L.rate.toFixed(1)}%` : '-';
  
  // 弹性提前退休
  if (r.comparison?.canFlex) {
    document.getElementById('flexSection').style.display = 'block';
    document.getElementById('legalDate').textContent = `${L.date.year}年${L.date.month}月`;
    document.getElementById('legalTotal').textContent = L.total?.toFixed(2) || '0';
    const F = r.flex;
    document.getElementById('flexDate').textContent = `${F.date.year}年${F.date.month}月`;
    document.getElementById('flexTotal').textContent = F.total?.toFixed(2) || '0';
    document.getElementById('flexNote').textContent = 
      `提前 ${r.comparison.flexAdvance} 个月，每月少领约 ${Math.round(r.comparison.amountDiff / (F.totalYears || 1) * 100) / 100} 元`;
  } else {
    document.getElementById('flexSection').style.display = 'none';
  }
  
  // 保存结果供报告导出使用
  window._lastResult = r;
  
  // 显示结果区域
  document.getElementById('resultArea').style.display = 'block';
  document.getElementById('resultArea').scrollIntoView({ behavior: 'smooth' });
}

// 折叠面板
function toggleAccordion(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('.accordion-arrow');
  
  if (body.classList.contains('open')) {
    body.classList.remove('open');
    arrow.classList.remove('open');
  } else {
    body.classList.add('open');
    arrow.classList.add('open');
  }
}

// 导出详细报告
function exportReport() {
  const totalAmount = document.getElementById('totalAmount').textContent;
  if (totalAmount === '0' || totalAmount === '-') {
    alert('请先进行测算');
    return;
  }
  
  // 模拟付费墙 - 实际部署时对接支付
  const confirmed = confirm('导出详细报告需支付 ¥3\n\n包含：\n• 完整参数明细\n• 退休规划建议\n• 缴费优化方案\n\n确认支付并导出？');
  if (!confirmed) return;
  
  // 生成报告内容
  const L = window._lastResult?.legal || {};
  const F = window._lastResult?.flex || {};
  const C = window._lastResult?.comparison || {};
  
  const report = `
========================================
  养老金测算详细报告
  生成时间：${new Date().toLocaleDateString('zh-CN')}
========================================

一、基本信息
  参保地区：${window._lastResult?.metaData?.city || '全省'}
  平均缴费指数：${window._lastResult?.metaData?.avgIndex || '-'}

二、法定退休信息
  退休日期：${L.date ? L.date.year + '年' + L.date.month + '月' : '-'}
  退休年龄：${L.ageStr || '-'}
  总缴费年限：${L.totalYears ? L.totalYears.toFixed(2) + '年' : '-'}
  实际缴费：${L.actualYears ? L.actualYears.toFixed(2) + '年' : '-'}
  视同缴费：${L.sightYears ? L.sightYears.toFixed(2) + '年' : '-'}

三、养老金明细（元/月）
  基本养老金：${L.basicPension?.amount?.toFixed(2) || '0'}
  增发养老金：${L.extraPension?.amount?.toFixed(2) || '0'}
  个人账户养老金：${L.personalAccount?.amount?.toFixed(2) || '0'}
  过渡性养老金：${L.transitionalPension?.amount?.toFixed(2) || '0'}
  特殊增发：${L.specialAddition?.amount?.toFixed(2) || '0'}
  ─────────────────
  合计：${L.total?.toFixed(2) || '0'}

四、弹性提前退休对比
  法定退休：${L.date ? L.date.year + '年' + L.date.month + '月' : '-'}，${L.total?.toFixed(2) || '0'}元/月
  提前退休：${F.date ? F.date.year + '年' + F.date.month + '月' : '-'}，${F.total?.toFixed(2) || '0'}元/月
  提前月数：${C?.flexAdvance || 0}个月
  每月差额：${C?.amountDiff ? (C.amountDiff / (F.totalYears || 1)).toFixed(2) : '0'}元

五、关键参数
  计发月数：${L.months || '-'}
  退休地计发基数：${L.baseRetire?.toLocaleString() || '-'}
  全省计发基数：${L.baseProv?.toLocaleString() || '-'}
  替代率：${L.rate ? L.rate.toFixed(1) + '%' : '-'}

六、缴费优化建议
  1. 如经济条件允许，建议尽量延长缴费年限
  2. 提高缴费指数可有效提升养老金水平
  3. 灵活就业人员可在60%-300%区间自主选择缴费基数

========================================
  本报告仅供参考，实际养老金以社保部门核定为准。
========================================
`;

  // 下载报告
  const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `养老金测算报告_${new Date().toISOString().slice(0,10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  alert('报告已生成！\n\n注：此为演示版本，实际部署时将对接支付流程生成PDF报告。');
}

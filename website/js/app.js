// website/js/app.js - 网页端应用逻辑

// 省份配置列表
const PROVINCES = {
  'jilin': { name: '吉林省' },
  'liaoning': { name: '辽宁省' },
  'heilongjiang': { name: '黑龙江省' },
  'shandong': { name: '山东省' },
  'henan': { name: '河南省' },
  'hebei': { name: '河北省' },
  'jiangsu': { name: '江苏省' }
};

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  initProvinceSelect();
  initGenderWatch();
});

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

// 监听性别变化，显示/隐藏女性退休类型
function initGenderWatch() {
  const radios = document.querySelectorAll('input[name="gender"]');
  const femaleDiv = document.getElementById('femaleRetireType');
  
  radios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (femaleDiv) {
        femaleDiv.style.display = this.value === 'female' ? 'block' : 'none';
      }
    });
  });
}

// 省份变化时更新城市列表
function onProvinceChange() {
  const select = document.getElementById('province');
  const citySelect = document.getElementById('city');
  const code = select.value;
  
  if (!code || !PROVINCES[code]) {
    citySelect.innerHTML = '<option value="prov">自动识别（默认全省）</option>';
    return;
  }
  
  // 默认所有省份只显示"全省"选项
  citySelect.innerHTML = '<option value="prov">自动识别（默认全省）</option>';
}

// 计算养老金
function calculate() {
  const province = document.getElementById('province').value;
  if (!province) { alert('请选择参保地区'); return; }
  
  const birthDate = document.getElementById('birthDate').value;
  if (!birthDate) { alert('请选择出生年月'); return; }
  
  const workDate = document.getElementById('workDate').value;
  if (!workDate) { alert('请选择参加工作时间'); return; }
  
  const name = document.getElementById('name').value || '参保人员';
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const [birthY, birthM] = birthDate.split('-').map(Number);
  const [workY, workM] = workDate.split('-').map(Number);
  
  const avgIndex = parseFloat(document.getElementById('avgIndex').value) || 1.0;
  const sightYears = parseInt(document.getElementById('sightYears').value) || 0;
  const personalAcc = document.getElementById('personalAcc').value ? 
    parseFloat(document.getElementById('personalAcc').value) : null;
  
  const retireType = gender === 'female' ? 
    (document.querySelector('input[name="femaleType"]:checked')?.value || 'fc') :
    document.querySelector('input[name="type"]:checked').value;
  
  const cityType = document.getElementById('city').value || 'prov';
  
  const input = {
    name, gender,
    birthYear: birthY, birthMonth: birthM,
    workYear: workY, workMonth: workM,
    avgIndex, cityType,
    retireType,
    personalAccInput: personalAcc,
    sightYears
  };
  
  // 加载省份配置并计算
  loadAndCalculate(province, input);
}

async function loadAndCalculate(provinceCode, input) {
  const btn = document.getElementById('calcBtn');
  btn.disabled = true;
  btn.textContent = '计算中...';
  
  try {
    const response = await fetch(`js/provinces/${provinceCode}.json`);
    const config = await response.json();
    
    // 使用引擎计算（从 pension-engine.min.js 加载）
    const result = window.pensionEngine.calculate(config, input);
    displayResult(result);
  } catch(e) {
    console.error('计算失败:', e);
    alert('计算失败，请稍后重试');
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
  参保人员：${window._lastResult?.metaData?.name || '-'}
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

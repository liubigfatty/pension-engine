// pages/report/index.js
// 养老金测算报告页 — 按用户10条要求重构

const PERSON_TYPE_LABELS = {
  male:      '企业职工·男',
  fw:        '企业职工·女（原50岁）',
  fc:        '企业职工·女（原55岁）',
  eco_male:  '灵活就业·男',
  eco_female: '灵活就业·女',
}

const CITY_MAP = {
  cc:   '长春市',
  prov: '吉林省其他地区',
}

Page({
  data: {
    reportDate: '',
    // 人员信息（8项）
    personTypeLabel: '',
    birthDate: '',
    workDate: '',
    retireDate: '',
    retireAge: '',
    retireAgeMonths: '',
    flexDate: '',
    flexAge: '',
    flexAgeMonths: '',
    cityLabel: '',
    totalYearsText: '',
    // 缴费信息
    avgIndexText: '',
    avgIndexClass: '',
    personalAccText: '',
    // 法定退休计算结果
    legalTotalText: '',
    // 基础养老金
    basicFormula: '',
    basicSubstitute: '',
    basicAmountText: '',
    // 个人账户养老金
    personalFormula: '',
    personalSubstitute: '',
    personalAmountText: '',
    // 过渡性养老金
    transFormula: '',
    transSubstitute: '',
    transAmountText: '',
    // 增发养老金
    extraFormula: '',
    extraAmountText: '',
    // 其它加发
    bonusDesc: '',
    bonusAmountText: '',
    // 合计
    totalFormula: '',
    totalAmountText: '',
    // 弹性提前退休
    showFlex: false,
    flexBasicFormula: '',
    flexBasicSubstitute: '',
    flexBasicAmountText: '',
    flexPersonalFormula: '',
    flexPersonalSubstitute: '',
    flexPersonalAmountText: '',
    flexTransFormula: '',
    flexTransSubstitute: '',
    flexTransAmountText: '',
    flexExtraAmountText: '',
    flexBonusAmountText: '',
    flexTotalAmountText: '',
    // 历年缴费明细
    yearDetailList: [],
    // 计发基数预测说明
    basePredictText: '',
    unifyYear: '',
    // 免责
    dataVersion: '',
  },

  onLoad() {
    this.setData({ reportDate: this._formatDate(new Date()) })

    const app = getApp()
    const calcResult  = app.globalData.calcResult
    const pensionInput = app.globalData.pensionInput

    if (calcResult && pensionInput) {
      this._fillReport(calcResult, pensionInput)
    } else {
      wx.showToast({ title: '无测算数据，请重新测算', icon: 'none' })
    }
  },

  _fillReport(result, input) {
    const legal = result.legal || {}
    const flex  = result.flex  || null
    const PROV_BASE = getApp().globalData.PROV_BASE || {}

    // ── 人员信息（8项）────
    const personTypeLabel = PERSON_TYPE_LABELS[input.personType] || ''
    const cityKey = input.city || 'prov'
    const cityLabel = CITY_MAP[cityKey] || input.city || ''

    const birthDate = this._joinDate(input.birthYear, input.birthMonth)

    // 参加工作日期
    const workDate = this._joinDate(input.workYear, input.workMonth)

    // 法定退休日期 & 年龄
    const legalDate = legal.date || {}
    const retireDate = legalDate.year ? legalDate.year + '.' + String(legalDate.month).padStart(2, '0') : '--'
    const retireAge = legal.ageStr || (legal.age ? Math.floor(legal.age) + '岁' : '--')

    // 弹性提前退休日期 & 年龄
    let flexDate = ''
    let flexAge  = ''
    let showFlex = false
    if (flex && flex.date) {
      showFlex = true
      flexDate = flex.date.year ? flex.date.year + '.' + String(flex.date.month).padStart(2, '0') : '--'
      flexAge  = flex.ageStr || (flex.age ? Math.floor(flex.age) + '岁' : '--')
    }

    // ── 缴费信息 ────
    const avgIndex = legal.avgIndex || 0
    const avgIndexText = avgIndex > 0 ? avgIndex.toFixed(4) : '--'
    const avgIndexClass = this._indexClass(avgIndex)

    // 个人账户储存额：从 yearData 逐年累加得出
    const personalAcc = this._calcPersonalAcc(input.yearData, PROV_BASE)
    const personalAccText = personalAcc > 0 ? '¥' + personalAcc.toLocaleString() : '--'

    // ── 分项公式 & 代入数值（法定）────
    // 基础养老金
    const baseRetire = legal.baseRetire || 0
    const baseProv   = legal.baseProv   || 0
    const totalYears = legal.totalYears || 0
    const basicFormula      = '(退休地计发基数 + 全省计发基数 × 平均缴费指数) ÷ 2 × 累计缴费年限 × 1%'
    const basicSubstitute  = '(' + baseRetire.toFixed(2) + ' + ' + baseProv.toFixed(2) + ' × ' + avgIndexText + ') ÷ 2 × ' + totalYears.toFixed(1) + '年 × 1%'
    const basicAmountText  = (legal.basicPension && legal.basicPension.amount != null) ? legal.basicPension.amount.toFixed(2) : '0.00'

    // 个人账户养老金
    const personalAccAmt   = (legal.personalAccount && legal.personalAccount.amount != null) ? legal.personalAccount.amount : 0
    const personalMonths    = legal.months || 139
    const personalFormula   = '个人账户储存额 ÷ 计发月数'
    const personalSubstitute = personalAcc + ' ÷ ' + personalMonths
    const personalAmountText = personalAccAmt.toFixed(2)

    // 过渡性养老金
    const sightYears = legal.sightYears || 0
    const transCoeff = 0.014
    const transFormula     = '全省计发基数 × 视同缴费年限 × 平均缴费指数 × 过渡系数'
    const transSubstitute  = baseProv.toFixed(2) + ' × ' + sightYears.toFixed(2) + '年 × ' + avgIndexText + ' × ' + (transCoeff * 100).toFixed(1) + '%'
    const transAmountText  = (legal.transitionalPension && legal.transitionalPension.amount != null) ? legal.transitionalPension.amount.toFixed(2) : '0.00'

    // 增发养老金
    const extraAmount     = (legal.extraPension && legal.extraPension.amount != null) ? legal.extraPension.amount : 0
    const extraAmountText = extraAmount.toFixed(2)
    const extraFormula    = extraAmount > 0 ? '按劳模/职称规则增发' : '无'

    // 其它加发
    const bonusAmount     = (legal.specialAddition && legal.specialAddition.amount != null) ? legal.specialAddition.amount : 0
    const bonusAmountText = bonusAmount.toFixed(2)
    const bonusDesc      = legal.specialAddition && legal.specialAddition.desc ? legal.specialAddition.desc : '无'

    // 合计
    const total = legal.total || 0
    const totalAmountText = total.toFixed(2)

    // 弹性提前退休差额
    let diffText = ''
    if (showFlex && flex) {
      const fTotal = flex.total || 0
      const diff = Math.round((total - fTotal) * 100) / 100
      diffText = (diff >= 0 ? '+' : '') + diff.toFixed(2)
    }

    // 计发月数（用于代入公式展示）
    const personalMonths = legal.months || 139

    // ── 弹性提前退休（如果可提前）────
    let flexBasicFormula     = ''
    let flexBasicSubstitute  = ''
    let flexBasicAmountText  = ''
    let flexPersonalFormula  = ''
    let flexPersonalSubstitute = ''
    let flexPersonalAmountText = ''
    let flexTransFormula     = ''
    let flexTransSubstitute  = ''
    let flexTransAmountText  = ''
    let flexExtraAmountText  = ''
    let flexBonusAmountText  = ''
    let flexTotalAmountText  = ''

    if (showFlex && flex) {
      const fBaseRetire = flex.baseRetire || 0
      const fBaseProv   = flex.baseProv   || 0
      flexBasicFormula     = '(退休地计发基数 + 全省计发基数 × 平均缴费指数) ÷ 2 × 累计缴费年限 × 1%'
      flexBasicSubstitute  = '(' + fBaseRetire.toFixed(2) + ' + ' + fBaseProv.toFixed(2) + ' × ' + avgIndexText + ') ÷ 2 × ' + totalYears.toFixed(1) + '年 × 1%'
      flexBasicAmountText  = (flex.basicPension && flex.basicPension.amount != null) ? flex.basicPension.amount.toFixed(2) : '0.00'

      const fPersonalAccAmt   = (flex.personalAccount && flex.personalAccount.amount != null) ? flex.personalAccount.amount : 0
      const fPersonalMonths    = flex.months || personalMonths
      flexPersonalFormula     = '个人账户储存额 ÷ 计发月数'
      flexPersonalSubstitute  = personalAcc + ' ÷ ' + fPersonalMonths
      flexPersonalAmountText = fPersonalAccAmt.toFixed(2)

      const fSightYears = flex.sightYears || sightYears
      flexTransFormula     = '全省计发基数 × 视同缴费年限 × 平均缴费指数 × 过渡系数'
      flexTransSubstitute  = fBaseProv.toFixed(2) + ' × ' + fSightYears.toFixed(2) + '年 × ' + avgIndexText + ' × ' + (transCoeff * 100).toFixed(1) + '%'
      flexTransAmountText  = (flex.transitionalPension && flex.transitionalPension.amount != null) ? flex.transitionalPension.amount.toFixed(2) : '0.00'

      const fExtraAmount = (flex.extraPension && flex.extraPension.amount != null) ? flex.extraPension.amount : 0
      flexExtraAmountText = fExtraAmount.toFixed(2)

      const fBonusAmount = (flex.specialAddition && flex.specialAddition.amount != null) ? flex.specialAddition.amount : 0
      flexBonusAmountText = fBonusAmount.toFixed(2)

      const fTotal = flex.total || 0
      flexTotalAmountText = fTotal.toFixed(2)
    }

    // ── 历年缴费明细 ────
    const yearDetailList = this._buildYearDetails(input.yearData, PROV_BASE, avgIndex)

    // ── 计发基数预测说明 ────
    const basePredictText = this._buildBasePredictText(cityKey, PROV_BASE)

    this.setData({
      personTypeLabel,
      birthDate,
      workDate,
      retireDate,
      retireAge,
      flexDate,
      flexAge,
      showFlex,
      cityLabel,
      totalYearsText: totalYears.toFixed(1) + '年',
      avgIndexText,
      avgIndexClass,
      personalAccText,
      personalMonths,
      legalTotalText: totalAmountText,
      diffText,
      basicFormula,
      basicSubstitute,
      basicAmountText,
      personalFormula,
      personalSubstitute,
      personalAmountText,
      transFormula,
      transSubstitute,
      transAmountText,
      extraFormula,
      extraAmountText,
      bonusDesc,
      bonusAmountText,
      totalAmountText,
      showFlex,
      flexBasicFormula,
      flexBasicSubstitute,
      flexBasicAmountText,
      flexPersonalFormula,
      flexPersonalSubstitute,
      flexPersonalAmountText,
      flexTransFormula,
      flexTransSubstitute,
      flexTransAmountText,
      flexExtraAmountText,
      flexBonusAmountText,
      flexTotalAmountText,
      yearDetailList,
      basePredictText,
      dataVersion: '数据版本：2025年计发基数（吉人社发〔2025〕XX号）',
    })
  },

  // 逐年计算个人账户储存额
  _calcPersonalAcc(yearData, PROV_BASE) {
    let acc = 0
    const years = Object.keys(yearData || {}).map(Number).sort()
    for (const y of years) {
      const base = yearData[y] || 0
      if (base <= 0) continue
      const months = (y === 2025) ? 6 : 12
      acc += base * 0.08 * months
      const rate = PROV_BASE[y] ? 0.025 : 0.025
      if (y < 2025) {
        acc = Math.round(acc * (1 + rate))
      }
    }
    return Math.round(acc)
  },

  _buildYearDetails(yearData, PROV_BASE) {
    const list = []
    const years = Object.keys(yearData || {}).map(Number).sort()
    for (const y of years) {
      const base     = yearData[y] || 0
      const avgWage  = PROV_BASE[y] || 0
      const index    = avgWage > 0 ? base / avgWage : 0
      list.push({
        year:         y,
        baseText:     base > 0 ? '¥' + base.toLocaleString() : '--',
        avgWageText:  avgWage > 0 ? '¥' + avgWage.toLocaleString() : '--',
        indexText:    index > 0 ? index.toFixed(4) : '--',
        indexClass:   index > 0 ? this._indexClass(index) : '',
        accText:      '', // 逐年个人账户累计（可选）
      })
    }
    return list
  },

  _indexClass(idx) {
    if (idx < 1)  return 'index-low'
    if (idx > 2)  return 'index-high'
    return 'index-mid'
  },

  _joinDate(year, month) {
    if (!year) return '--'
    return year + '.' + String(month || 1).padStart(2, '0')
  },

  _formatDate(d) {
    const y   = d.getFullYear()
    const m   = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return y + '-' + m + '-' + day
  },

  // 计发基数预测说明
  _buildBasePredictText(cityKey, PROV_BASE) {
    if (cityKey === 'cc') {
      return '长春市计发基数与全省计发基数预计于2030年左右趋于一致，此后全省统一使用一个计发基数。预测规则：长春市年均增长约2.6%，全省其他地区年均增长约4.38%（预计2030年追平）。'
    }
    return '全省计发基数每年按约2.6%增长率预测（参考近5年平均涨幅）。'
  },

  // ── 事件 ──
  onPayReport() {
    wx.showToast({ title: '支付功能评估中，敬请期待', icon: 'none' })
  },

  onShareReport() {
    wx.showShareMenu({ withShareTicket: true })
  },

  onCustomConsult() {
    wx.showToast({ title: '定制咨询功能评估中，敬请期待', icon: 'none' })
  },

  onShareAppMessage() {
    return {
      title: '我的养老金测算报告 — 现实调音师',
      path: '/pages/pension/index',
    }
  },
})

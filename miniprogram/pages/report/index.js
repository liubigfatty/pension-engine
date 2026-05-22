// pages/report/index.js
// 养老金测算报告页

const PERSON_TYPE_LABELS = {
  male:      '企业职工·男',
  fw:        '企业职工·女（原50岁）',
  fc:        '企业职工·女（原55岁）',
  eco_male:  '灵活就业·男',
  eco_female: '灵活就业·女',
}

const BREAKDOWN_COLORS = ['#3b82f6','#8b5cf6','#059669','#f59e0b','#ec4899']

Page({
  data: {
    reportDate: '',
    totalPensionText: '0.00',
    personTypeLabel: '',
    birthDate: '',
    workDate: '',
    retireAge: 0,
    cityLabel: '',
    totalYears: '0',
    avgIndexText: '',
    avgIndexClass: '',
    breakdownList: [],
    yearDetailList: [],
    _calcResult: null,
  },

  onLoad(options) {
    this.setData({ reportDate: this._formatDate(new Date()) })

    // 从全局或参数获取计算结果
    const calcResult = getApp().globalData.calcResult
    if (calcResult) {
      this._fillReport(calcResult, getApp().globalData.pensionInput)
    }
  },

  _fillReport(result, input) {
    const legal = result.legal || {}
    const total = legal.total || 0

    // 分项明细
    const breakdownList = [
      { label: '基础养老金',   value: legal.basicPension || 0,  valueText: (legal.basicPension || 0).toFixed(2), formula: this._getBasicFormula(legal), color: BREAKDOWN_COLORS[0] },
      { label: '个人账户养老金', value: legal.personalPension || 0, valueText: (legal.personalPension || 0).toFixed(2), formula: this._getPersonalFormula(legal), color: BREAKDOWN_COLORS[1] },
      { label: '过渡性养老金', value: legal.transPension || 0, valueText: (legal.transPension || 0).toFixed(2), formula: this._getTransFormula(legal), color: BREAKDOWN_COLORS[2] },
      { label: '增发养老金',   value: legal.extraPension || 0, valueText: (legal.extraPension || 0).toFixed(2), formula: legal.extraPension > 0 ? '按劳模/职称规则计算' : '无增发', color: BREAKDOWN_COLORS[3] },
      { label: '其它加发',   value: legal.bonusPension || 0, valueText: (legal.bonusPension || 0).toFixed(2), formula: legal.bonusDesc || '无', color: BREAKDOWN_COLORS[4] },
    ].filter(it => it.value > 0)

    // 计算占比
    const maxVal = Math.max(total, 1)
    breakdownList.forEach(it => {
      it.pct = (it.value / total * 100).toFixed(1)
    })

    // 人员信息
    const personTypeLabel = PERSON_TYPE_LABELS[input?.personType] || ''
    const cityLabel = input?.city === 'cc' ? '长春市' : '吉林省其他地区'

    this.setData({
      totalPensionText: total.toFixed(2),
      personTypeLabel,
      birthDate: input?.birthYear ? input.birthYear + '-' + String(input.birthMonth || 1).padStart(2,'0') : '',
      workDate: input?.workYear ? input.workYear + '-' + String(input.workMonth || 1).padStart(2,'0') : '',
      retireAge: legal.retireAgeExact ? Math.floor(legal.retireAgeExact) : 0,
      cityLabel,
      totalYears: (legal.totalYears || 0).toFixed(1),
      avgIndexText: (legal.avgIndex || 0).toFixed(4),
      avgIndexClass: (legal.avgIndex || 0) < 1 ? 'index-low' : (legal.avgIndex || 0) > 2 ? 'index-high' : 'index-mid',
      breakdownList,
      _calcResult: result,
    })

    // 填充历年明细
    this._fillYearDetails(result, input)
  },

  _fillYearDetails(result, input) {
    // 从 yearData 构建明细
    const yearData = input?.yearData || {}
    const PROV_BASE = getApp().globalData.PROV_BASE || {}
    const list = []
    const years = Object.keys(yearData).map(Number).sort()
    for (const y of years) {
      const base = yearData[y] || 0
      const avgWage = PROV_BASE[y] || 0
      const index = avgWage > 0 ? base / avgWage : 0
      list.push({
        year: y,
        baseText: base > 0 ? '¥' + base.toLocaleString() : '--',
        avgWageText: avgWage > 0 ? '¥' + avgWage.toLocaleString() : '--',
        indexText: index > 0 ? index.toFixed(4) : '--',
        indexClass: index > 0 ? (index < 1 ? 'index-low' : index > 2 ? 'index-high' : 'index-mid') : '',
      })
    }
    this.setData({ yearDetailList: list })
  },

  _getBasicFormula(legal) {
    const b1 = (legal.baseRetire || 0).toFixed(2)
    const b2 = (legal.baseProv || 0).toFixed(2)
    const y = (legal.totalYears || 0).toFixed(1)
    return `(${b1} + ${b2}) ÷ 2 × ${y}年 × 1%`
  },

  _getPersonalFormula(legal) {
    const acc = (legal.personalAcc || 0).toFixed(0)
    const m = legal.months || 139
    return `${acc} ÷ ${m}（计发月数）`
  },

  _getTransFormula(legal) {
    const b = (legal.baseProv || 0).toFixed(2)
    const s = (legal.sightYears || 0).toFixed(2)
    return `${b} × ${s}年 × 指数 × 1.4%`
  },

  // ── 事件处理 ──
  onPayReport() {
    // TODO: 接入微信支付，支付成功后展示完整报告
    wx.showToast({ title: '支付功能评估中，敬请期待', icon: 'none' })
  },

  onShareReport() {
    wx.showShareMenu({ withShareTicket: true })
  },

  onCustomConsult() {
    // TODO: 跳转客服会话或支付页面
    wx.showToast({ title: '定制咨询功能评估中，敬请期待', icon: 'none' })
  },

  _formatDate(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth()+1).padStart(2,'0')
    const day = String(d.getDate()).padStart(2,'0')
    return y + '-' + m + '-' + day
  },

  onShareAppMessage() {
    return {
      title: '我的养老金测算报告 — 现实调音师',
      path: '/pages/pension/index',
    }
  },
})

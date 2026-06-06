// pages/pension/index.js
// 2026-06-03 改造：支持省份切换（吉林省 / 黑龙江省）

const { getProvinceData, CITY_LIST_JL, CITY_LIST_HLJ } = require('../../data/pension')
const { calculatePension, updateProvinceData } = require('../../utils/pension-calc')

const PERSON_TYPES = [
  { label: '企业职工·男',        value: 'male',       genderType: 'male', userType: 'standard' },
  { label: '企业职工·女（原50岁）', value: 'fw',     genderType: 'fw',   userType: 'standard' },
  { label: '企业职工·女（原55岁）', value: 'fc',     genderType: 'fc',   userType: 'standard' },
  { label: '灵活就业·男',        value: 'eco_male',  genderType: 'male', userType: 'flexible' },
  { label: '灵活就业·女',        value: 'eco_female', genderType: 'fw55', userType: 'flexible' },
]
const PERSON_TYPE_MAP = {}
PERSON_TYPES.forEach(p => { PERSON_TYPE_MAP[p.value] = { genderType: p.genderType, userType: p.userType } })

Page({
  data: {
    // ── Step 1 ──
    provinceList: ['吉林省', '黑龙江省'],
    provinceIndex: 0,
    cityList: CITY_LIST_JL,
    cityIndex: -1,
    personTypeIndex: 0,
    personTypeLabel: PERSON_TYPES[0].label,
    birthDate: '',
    workDate: '',
    bonusProvince: false,
    bonusCity: false,
    bonusMid: false,
    bonusHigh: false,
    showFlex: false,
    // ── Step 2 ──
    importMethod: 0,
    avgIndex: '',
    avgIndexClass: '',
    personalAcc: '',
    _yearData: {},
    _excelYearly: [],
    // ── Step 3 result ──
    legalResult: null,
    flexResult: null,
    showResult: false,
    legalDate: null,
    flexDate: null,
    canFlex: false,
  },

  // ========== Step 1 ==========
  onProvinceChange(e) {
    const idx = Number(e.detail.value)
    const pd = getProvinceData(idx === 0 ? 'jilin' : 'heilongjiang')
    this.setData({
      provinceIndex: idx,
      cityIndex: -1,
      cityList: pd.CITY_LIST,
    })
  },
  onCityChange(e) { this.setData({ cityIndex: Number(e.detail.value) }) },
  onPersonTypeChange(e) {
    const i = Number(e.detail.value)
    this.setData({ personTypeIndex: i, personTypeLabel: PERSON_TYPES[i].label })
  },
  onBirthDateChange(e) { this.setData({ birthDate: e.detail.value }) },
  onWorkDateChange(e)   { this.setData({ workDate: e.detail.value }) },
  onBonusProvinceChange(e) { this.setData({ bonusProvince: e.detail.value }) },
  onBonusCityChange(e)      { this.setData({ bonusCity: e.detail.value }) },
  onBonusMidChange(e)       { this.setData({ bonusMid: e.detail.value }) },
  onBonusHighChange(e)      { this.setData({ bonusHigh: e.detail.value }) },

  onNextStep1() {
    const d = this.data
    if (d.cityIndex < 0) return wx.showToast({ title: '请选择参保地', icon: 'none' })
    if (!d.birthDate) return wx.showToast({ title: '请选择出生日期', icon: 'none' })
    if (!d.workDate)  return wx.showToast({ title: '请选择参工时间', icon: 'none' })
    this.setData({ currentStep: 2 })
  },

  // ========== Step 2 ==========
  onImportMethodChange(e) { this.setData({ importMethod: Number(e.detail.value) }) },

  onAvgIndexInput(e) {
    const v = parseFloat(e.detail.value) || 0
    const cls = v < 0.6 ? 'idx-red' : v < 1.0 ? 'idx-blue' : 'idx-green'
    this.setData({ avgIndex: e.detail.value, avgIndexClass: cls })
  },
  onPersonalAccInput(e) { this.setData({ personalAcc: e.detail.value }) },

  onChooseExcel() {
    const that = this
    wx.chooseMessageFile({
      count: 1, type: 'file', extension: ['xlsx', 'xls'],
      success(res) {
        const filePath = res.tempFiles[0].path
        that._parseExcel(filePath)
      }
    })
  },

  _parseExcel(filePath) {
    const that = this
    wx.showLoading({ title: '解析中...' })
    const cloudPath = 'excel/' + Date.now() + '.xlsx'
    wx.cloud.uploadFile({
      cloudPath, filePath,
      success(upRes) {
        wx.cloud.callFunction({
          name: 'parseExcel',
          data: { fileID: upRes.fileID },
          success(res) {
            wx.hideLoading()
            const r = res.result
            if (!r || !r.success) {
              return wx.showToast({ title: r?.error || '解析失败', icon: 'none' })
            }
            that.setData({
              _yearData: r.yearlyDetails || {},
              avgIndex: String(r.avgIndex || ''),
              avgIndexClass: r.avgIndex < 0.6 ? 'idx-red' : r.avgIndex < 1.0 ? 'idx-blue' : 'idx-green',
              personalAcc: r.personalAcc ? String(r.personalAcc) : '',
              _excelYearly: r.excelYearly || [],
            })
            wx.showToast({ title: '导入成功', icon: 'success' })
          },
          fail() { wx.hideLoading(); wx.showToast({ title: '云函数调用失败', icon: 'none' }) }
        })
      },
      fail() { wx.hideLoading(); wx.showToast({ title: '上传失败', icon: 'none' }) }
    })
  },

  onNextStep2() {
    const d = this.data
    const idx = parseFloat(d.avgIndex)
    if (!idx || idx <= 0) return wx.showToast({ title: '请输入平均缴费指数', icon: 'none' })
    this.setData({ currentStep: 3 })
    this._doCalculate()
  },

  // ========== 核心计算 ==========
  _doCalculate() {
    const d = this.data
    const provinceVal = d.provinceIndex === 0 ? 'jilin' : 'heilongjiang'

    // 更新引擎内部省份数据
    updateProvinceData(provinceVal)

    const personVal  = PERSON_TYPES[d.personTypeIndex].value
    const typeMap    = PERSON_TYPE_MAP[personVal]
    const cityType   = (d.cityIndex === 0 && provinceVal === 'jilin') ? 'cc' : 'prov'

    const birthParts = d.birthDate.split('-')
    const workParts  = d.workDate.split('-')

    const result = calculatePension({
      province:     provinceVal,
      city:         cityType,
      genderType:   typeMap.genderType,
      birthYear:    parseInt(birthParts[0]),
      birthMonth:   parseInt(birthParts[1]) || 1,
      workYear:     parseInt(workParts[0]),
      workMonth:    parseInt(workParts[1]) || 1,
      avgIndex:     parseFloat(d.avgIndex) || 0,
      personalAcc:  parseFloat(d.personalAcc) || 0,
      bonusProvince: d.bonusProvince,
      bonusCity:     d.bonusCity,
      bonusMid:      d.bonusMid,
      bonusHigh:     d.bonusHigh,
    })

    // 存入 globalData 供报告页读取
    const app = getApp()
    app.globalData = app.globalData || {}
    app.globalData.calcResult  = result.legal
    app.globalData.pensionInput = {
      province:    provinceVal,
      city:        cityType,
      personType:  personVal,
      birthDate:   d.birthDate,
      workDate:    d.workDate,
      avgIndex:    parseFloat(d.avgIndex) || 0,
      personalAcc: parseFloat(d.personalAcc) || 0,
      bonusProvince: d.bonusProvince,
      bonusCity:     d.bonusCity,
      bonusMid:      d.bonusMid,
      bonusHigh:  d.bonusHigh,
      yearData:     d._yearData,
    }

    this.setData({
      legalResult: result.legal,
      flexResult:  result.flex,
      showResult:  true,
      legalDate:   result.legalDate,
      flexDate:    result.flexDate,
      canFlex:     result.canFlex,
      currentStep: 3,
    })
  },

  // ========== Step 3 分享 ==========
  onShareAppMessage() {
    return {
      title: '养老金测算结果 · ' + (this.data.legalResult?.total || 0) + '元/月',
      path: '/pages/pension/index',
    }
  },

  onShareTimeline() {
    return {
      title: '养老金测算结果 · 看看你能领多少？',
      query: '',
    }
  },

  onViewReport() {
    wx.navigateTo({ url: '/pages/report/index' })
  },

  onReset() {
    this.setData({
      provinceIndex: 0,
      cityIndex: -1,
      cityList: CITY_LIST_JL,
      personTypeIndex: 0,
      personTypeLabel: PERSON_TYPES[0].label,
      birthDate: '',
      workDate: '',
      bonusProvince: false,
      bonusCity: false,
      bonusMid: false,
      bonusHigh: false,
      avgIndex: '',
      avgIndexClass: '',
      personalAcc: '',
      _yearData: {},
      _excelYearly: [],
      legalResult: null,
      flexResult: null,
      showResult: false,
      currentStep: 1,
    })
  },
})

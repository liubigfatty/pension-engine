// pages/retire-age/retire-age.js
const app = getApp()

Page({
  data: {
    gender: 'male',
    birthDate: '',
    result: null,
    loading: false
  },

  onLoad() {
    if (app.globalData.provinces.length > 0) {
      this.setData({
        provinceList: app.globalData.provinces.map(p => p.name)
      })
    }
  },

  onGenderChange(e) {
    this.setData({ gender: e.detail.value })
  },

  onBirthChange(e) {
    this.setData({ birthDate: e.detail.value })
  },

  onQuery() {
    const { gender, birthDate } = this.data
    if (!birthDate) {
      wx.showToast({ title: '请选择出生年月', icon: 'none' })
      return
    }

    const [birthY, birthM] = birthDate.split('-').map(Number)

    // 用引擎计算
    const engine = require('../../engine/pension-engine')
    const config = require('../../provinces/jilin.json') // 默认用吉林配置
    // 延迟退休与省份无关，用默认配置即可

    const genderType = gender === 'male' ? 'male' : 'fw'

    const delay = engine.getDelayMonths(birthY, birthM, genderType, config)
    const totalMonths = engine.getRetireTotalMonths(birthY, birthM, genderType, config)
    const retireDate = engine.getRetireDate(birthY, birthM, totalMonths)
    const ageStr = engine.getAgeStr(totalMonths)
    const dateStr = engine.getDateStr(retireDate)

    // 原法定退休年龄
    const baseAge = gender === 'male' ? 60 : 50
    const originalRetireDate = engine.getRetireDate(birthY, birthM, baseAge * 12)
    const originalDateStr = engine.getDateStr(originalRetireDate)

    this.setData({
      result: {
        originalAge: `${baseAge}岁`,
        originalDate: originalDateStr,
        delayMonths: delay > 0 ? `${delay}个月` : '无延迟',
        newAge: ageStr,
        retireDate: dateStr,
        totalMonths
      }
    })
  },

  goBack() {
    wx.navigateBack()
  }
})

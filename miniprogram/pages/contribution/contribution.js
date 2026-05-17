// pages/contribution/contribution.js
const app = getApp()

Page({
  data: {
    name: '',
    gender: 'male',
    birthDate: '',
    workDate: '',
    avgIndex: '1.0',
    selectedProvince: null,
    cityList: [],
    selectedCity: null,
    loading: false,
    result: null
  },

  onLoad() {
    if (app.globalData.provinces.length > 0) {
      this.setData({
        provinceList: app.globalData.provinces.map(p => p.name)
      })
    }
  },

  onProvinceChange(e) {
    const index = e.detail.value
    const province = app.globalData.provinces[index]
    const config = require(`../../provinces/${province.code}.json`)
    this.setData({
      selectedProvince: { name: config.name, code: province.code, config }
    })
    const cities = []
    if (config.base_rates) {
      Object.keys(config.base_rates).forEach(key => {
        if (key !== 'prov') {
          cities.push({ code: key, name: key === 'cc' ? '长春市' : key })
        }
      })
    }
    this.setData({ cityList: cities })
  },

  onCityChange(e) {
    const index = e.detail.value
    this.setData({ selectedCity: this.data.cityList[index] })
  },

  onNameInput(e) { this.setData({ name: e.detail.value }) },
  onGenderChange(e) { this.setData({ gender: e.detail.value }) },
  onBirthChange(e) { this.setData({ birthDate: e.detail.value }) },
  onWorkChange(e) { this.setData({ workDate: e.detail.value }) },
  onIndexInput(e) { this.setData({ avgIndex: e.detail.value }) },

  handleSubmit() {
    const { name, gender, birthDate, workDate, avgIndex, selectedProvince, selectedCity } = this.data
    if (!selectedProvince) {
      wx.showToast({ title: '请选择参保地区', icon: 'none' })
      return
    }
    if (!birthDate || !workDate) {
      wx.showToast({ title: '请填写出生年月和参加工作时间', icon: 'none' })
      return
    }
    const [birthY, birthM] = birthDate.split('-').map(Number)
    const [workY, workM] = workDate.split('-').map(Number)

    const input = {
      name,
      gender,
      birthYear: birthY,
      birthMonth: birthM,
      workYear: workY,
      workMonth: workM,
      avgIndex: parseFloat(avgIndex) || 1.0,
      cityType: selectedCity ? selectedCity.code : 'prov',
      retireType: gender === 'female' ? 'standard' : 'standard'
    }

    this.setData({ loading: true })
    const engine = require('../../engine/pension-engine')
    const result = engine.calculate(selectedProvince.config, input)
    this.setData({ loading: false, result })
  },

  goBack() {
    wx.navigateBack()
  }
})

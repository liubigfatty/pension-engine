// pages/pension/pension.js
const app = getApp()

Page({
  data: {
    name: '',
    gender: 'male',
    birthDate: '',
    workDate: '',
    avgIndex: '1.0',
    sightYears: '0',
    personalAccInput: '',
    selectedProvince: null,
    cityList: [],
    selectedCity: null,
    retireType: 'standard',
    femaleRetireType: 'standard',
    loading: false,
    hasSight: false
  },

  onLoad() {
    if (app.globalData.provinces.length > 0) {
      this.setData({
        provinceList: app.globalData.provinces.map(p => p.name)
      })
    }
  },

  // 选择参保地区
  onProvinceChange(e) {
    const index = e.detail.value
    const province = app.globalData.provinces[index]
    const config = require(`../../provinces/${province.code}.json`)
    
    this.setData({
      selectedProvince: { name: config.name, code: province.code, config }
    })

    // 根据配置生成城市列表
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
  onSightInput(e) { this.setData({ sightYears: e.detail.value }) },
  onBalanceInput(e) { this.setData({ personalAccInput: e.detail.value }) },
  
  onTypeChange(e) { this.setData({ retireType: e.detail.value }) },
  onRetireTypeChange(e) { this.setData({ femaleRetireType: e.detail.value }) },

  handleSubmit() {
    const { name, gender, birthDate, workDate, avgIndex, sightYears, personalAccInput, 
             selectedProvince, selectedCity, retireType, femaleRetireType } = this.data

    if (!selectedProvince) {
      wx.showToast({ title: '请选择参保地区', icon: 'none' })
      return
    }
    if (!birthDate) {
      wx.showToast({ title: '请输入出生年月', icon: 'none' })
      return
    }
    if (!workDate) {
      wx.showToast({ title: '请输入参加工作时间', icon: 'none' })
      return
    }

    // 解析日期
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
      retireType: gender === 'female' ? femaleRetireType : retireType,
      personalAccInput: personalAccInput ? parseFloat(personalAccInput) : null,
      sightYears: sightYears ? parseInt(sightYears) : 0
    }

    this.setData({ loading: true })

    // 异步加载引擎并计算
    const engineUtil = require('../../utils/engine')
    
    engineUtil.loadEngine()
      .then(engine => {
        const result = engine.calculate(selectedProvince.config, input)
        
        // 保存输入参数供报告使用
        wx.setStorageSync('calc_name', name)
        wx.setStorageSync('calc_city', selectedCity ? selectedCity.name : '全省')
        wx.setStorageSync('calc_province', selectedProvince.name)
        wx.setStorageSync('calc_input', input)

        this.setData({ loading: false })

        // 跳转到结果页
        wx.navigateTo({
          url: `/pages/result/result?result=${encodeURIComponent(JSON.stringify(result))}`
        })
      })
      .catch(err => {
        this.setData({ loading: false })
        wx.showModal({
          title: '计算失败',
          content: err.message || '引擎加载失败，请检查网络后重试',
          showCancel: false
        })
      })
  },

  goBack() {
    wx.navigateBack()
  }
})

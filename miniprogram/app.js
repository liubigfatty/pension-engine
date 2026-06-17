App({
  globalData: {
    provinces: [],
    engine: null
  },
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
      return
    }
    wx.cloud.init({
      env: 'cloud1',
      traceUser: true,
    })
    
    // 加载省份配置
    this.loadProvinces()
  },
  loadProvinces() {
    // 读取省份配置列表
    const provinceFiles = ['jilin', 'liaoning', 'heilongjiang', 'shandong', 'henan', 'hebei', 'jiangsu']
    const provinces = []
    provinceFiles.forEach(code => {
      try {
        const config = require(`../provinces/${code}.json`)
        provinces.push({ code, name: config.name })
      } catch(e) {}
    })
    this.globalData.provinces = provinces
  }
})

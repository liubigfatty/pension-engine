App({
  globalData: {
    provinces: [],
    engine: null
  },
  onLaunch() {
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

App({
  globalData: {
    provinces: [],
    engine: null,
    calcResult: null,   // 养老金计算结果（传给报告页）
    pensionInput: null, // 输入参数（传给报告页）
    PROV_BASE: null,      // 社平基数（传给报告页）
  },
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'pension-calculato-6es590ea35e2f3',
        traceUser: true
      })
    }
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

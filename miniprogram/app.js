// app.js
App({
  globalData: {
    // 云开发环境ID（从云开发控制台获取）
    envId: 'cloud1-2d2gfe2lrpe9cdf8a0',
    // 隐私协议是否已检查
    privacyChecked: false,
    // 是否需要弹出隐私协议
    needPrivacyPopup: false
  },

  onLaunch() {
    console.log('[app.js] 小程序启动')
    
    // 初始化云开发环境
    if (wx.cloud) {
      wx.cloud.init({
        env: this.globalData.envId,
        traceUser: true
      })
      console.log('[app.js] 云开发初始化成功')
    }

    // 隐私协议检查（启动时检查，防止首页检查失败）
    this.checkPrivacySetting()
  },

  // 检查隐私协议授权状态
  checkPrivacySetting() {
    console.log('[app.js] 开始检查隐私协议')
    
    if (!wx.getPrivacySetting) {
      console.log('[app.js] 基础库不支持隐私协议API，跳过')
      this.globalData.privacyChecked = true
      return
    }

    wx.getPrivacySetting({
      success: (res) => {
        console.log('[app.js] 隐私授权状态：', JSON.stringify(res))
        this.globalData.privacyChecked = true
        
        if (res.needAuthorization) {
          // 需要授权
          this.globalData.needPrivacyPopup = true
          console.log('[app.js] ⚠️ 需要弹出隐私协议弹窗')
          
          // 可选：这里可以直接调用官方API弹出弹窗
          // this.requirePrivacyAuthorization()
        } else {
          console.log('[app.js] ✅ 已授权，无需弹窗')
        }
      },
      fail: (err) => {
        console.error('[app.js] 获取隐私设置失败：', err)
        this.globalData.privacyChecked = true
      }
    })
  },

  // 调用官方API弹出隐私协议弹窗（可选方案）
  requirePrivacyAuthorization() {
    if (!wx.requirePrivacyAuthorize) {
      console.log('[app.js] 基础库不支持 requirePrivacyAuthorize')
      return
    }

    wx.requirePrivacyAuthorize({
      success: () => {
        console.log('[app.js] 用户同意隐私协议（官方API）')
        wx.setStorageSync('privacy_agreed', true)
      },
      fail: () => {
        console.log('[app.js] 用户拒绝隐私协议（官方API）')
      },
      complete: () => {
        console.log('[app.js] 隐私协议弹窗完成')
      }
    })
  }
})

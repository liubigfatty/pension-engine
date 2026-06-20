// pages/index/index.js
Page({
  data: {
    showPrivacy: false,
    privacyContractName: ''
  },

  onLoad() {
    console.log('首页加载完成')
    
    // 按微信官方规范检查隐私授权状态（基础库 2.32.3+）
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          console.log('隐私授权状态：', res)
          if (res.needAuthorization) {
            // 需要弹出隐私协议
            this.setData({
              showPrivacy: true,
              privacyContractName: res.privacyContractName || '《隐私保护指引》'
            })
          }
        },
        fail: () => {
          // 低版本基础库不支持，使用本地存储判断
          this.checkPrivacyLocal()
        }
      })
    } else {
      // 低版本基础库，使用本地存储判断
      this.checkPrivacyLocal()
    }
  },

  // 本地存储判断（兼容低版本）
  checkPrivacyLocal() {
    const agreed = wx.getStorageSync('privacy_agreed')
    if (!agreed) {
      this.setData({ showPrivacy: true })
    }
  },

  // 查看隐私协议
  onViewPrivacy() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        success: () => console.log('打开隐私协议成功'),
        fail: () => console.log('打开隐私协议失败')
      })
    } else {
      // 低版本，跳转到隐私页面
      wx.navigateTo({ url: '/pages/privacy/privacy' })
    }
  },

  // 同意隐私协议（官方API回调）
  onAgreePrivacy() {
    console.log('用户同意隐私协议')
    wx.setStorageSync('privacy_agreed', true)
    this.setData({ showPrivacy: false })
    wx.showToast({ title: '感谢您的同意', icon: 'success' })
  },

  // 拒绝隐私协议
  onDisagreePrivacy() {
    wx.showToast({
      title: '需要同意隐私协议才能使用',
      icon: 'none',
      duration: 2000
    })
  },

  // 开始测算
  onStart() {
    // 检查是否已同意隐私协议
    const agreed = wx.getStorageSync('privacy_agreed')
    if (!agreed) {
      wx.showToast({
        title: '请先同意隐私协议',
        icon: 'none'
      })
      return
    }
    
    wx.navigateTo({
      url: '/pages/step1/step1'
    })
  },

  // 分享到聊天
  onShareAppMessage() {
    return {
      title: '养老金计算器 - 算算你能领多少',
      path: '/pages/index/index'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '养老金计算器 - 算算你能领多少'
    }
  }
})

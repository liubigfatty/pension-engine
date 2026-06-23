// pages/index/index.js
Page({
  data: {
    showPrivacy: false,
    privacyContractName: '',
    // 是否使用官方隐私弹窗（优先）
    useOfficialPopup: true
  },

  onLoad() {
    console.log('[index] 首页加载完成')
    
    // 按微信官方规范检查隐私授权状态
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          console.log('[index] 隐私授权状态：', JSON.stringify(res))
          
          if (res.needAuthorization) {
            // 需要授权 → 直接调用官方API弹出弹窗（最可靠）
            console.log('[index] 需要授权，调用官方API弹出弹窗')
            this.triggerOfficialPrivacyPopup()
          } else {
            // 已授权 → 检查是否是调试模式强制跳过
            console.log('[index] 系统返回已授权(needAuthorization=false)')
            
            // 兼容处理：即使系统返回已授权，也检查本地存储
            const localAgreed = wx.getStorageSync('privacy_agreed')
            if (!localAgreed) {
              // 系统说已授权但本地没记录 → 可能是首次安装后的状态
              // 不弹窗，但记录日志供审核参考
              console.log('[index] 系统已授权但本地无记录，不弹窗（符合预期）')
            }
          }
        },
        fail: (err) => {
          console.error('[index] 获取隐私设置失败：', err)
          this.checkPrivacyLocal()
        }
      })
    } else {
      console.log('[index] 基础库不支持隐私API')
      this.checkPrivacyLocal()
    }
  },

  // 调用官方隐私协议弹窗API（最可靠方案）
  triggerOfficialPrivacyPopup() {
    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          console.log('[index] ✅ 用户同意隐私协议（官方API）')
          wx.setStorageSync('privacy_agreed', true)
          this.setData({ showPrivacy: false })
          wx.showToast({ title: '感谢您的同意', icon: 'success' })
        },
        fail: (err) => {
          console.log('[index] ❌ 用户拒绝隐私协议（官方API）：', err)
          wx.showToast({ 
            title: '需要同意隐私协议才能使用', 
            icon: 'none',
            duration: 2000
          })
        },
        complete: () => {
          console.log('[index] 官方隐私协议弹窗完成')
        }
      })
    } else {
      console.log('[index] 基础库不支持 requirePrivacyAuthorize，回退到自定义弹窗')
      this.setData({ showPrivacy: true, privacyContractName: '《正元养老金计算引擎小程序隐私保护指引》' })
    }
  },

  // 本地存储判断（兼容低版本基础库）
  checkPrivacyLocal() {
    const agreed = wx.getStorageSync('privacy_agreed')
    if (!agreed) {
      this.setData({ showPrivacy: true, privacyContractName: '《正元养老金计算引擎小程序隐私保护指引》' })
    }
  },

  // 查看隐私协议
  onViewPrivacy() {
    if (wx.openPrivacyContract) {
      wx.openPrivacyContract({
        success: () => console.log('[index] 打开隐私协议成功'),
        fail: () => console.log('[index] 打开隐私协议失败')
      })
    } else {
      wx.navigateTo({ url: '/pages/privacy/privacy' })
    }
  },

  // 同意隐私协议（自定义弹窗的回调）
  onAgreePrivacy() {
    console.log('[index] 用户通过自定义弹窗同意隐私协议')
    wx.setStorageSync('privacy_agreed', true)
    this.setData({ showPrivacy: false })
  },

  // 拒绝隐私协议（自定义弹窗的回调）
  onDisagreePrivacy() {
    console.log('[index] 用户拒绝隐私协议')
    wx.showToast({
      title: '需要同意隐私协议才能使用',
      icon: 'none',
      duration: 2000
    })
  },

  // 开始测算
  onStart() {
    // 再次检查隐私状态（双重保险）
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          if (res.needAuthorization) {
            // 还需要授权 → 弹出官方弹窗
            this.triggerOfficialPrivacyPopup()
            return
          }
          // 已授权 → 继续跳转
          this.goToStep1()
        },
        fail: () => {
          // API失败 → 检查本地存储
          const agreed = wx.getStorageSync('privacy_agreed')
          if (!agreed) {
            this.setData({ showPrivacy: true })
            wx.showToast({ title: '请先同意隐私协议', icon: 'none' })
          } else {
            this.goToStep1()
          }
        }
      })
    } else {
      // 低版本基础库
      const agreed = wx.getStorageSync('privacy_agreed')
      if (!agreed) {
        this.setData({ showPrivacy: true })
        wx.showToast({ title: '请先同意隐私协议', icon: 'none' })
        return
      }
      this.goToStep1()
    }
  },

  // 跳转到step1
  goToStep1() {
    wx.navigateTo({ url: '/pages/step1/step1' })
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

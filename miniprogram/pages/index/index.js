// pages/index/index.js - 首页
Page({
  data: {},

  goPension() {
    wx.navigateTo({ url: '/pages/pension/pension' })
  },

  goContribution() {
    wx.navigateTo({ url: '/pages/contribution/contribution' })
  },

  goRetireAge() {
    wx.navigateTo({ url: '/pages/retire-age/retire-age' })
  },

  goHelp() {
    wx.navigateTo({ url: '/pages/help/help' })
  }
})

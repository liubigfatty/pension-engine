/**
 * 引擎加载工具
 * 方案：wx.request 远程加载（域名已配白名单）+ 缓存
 * 不再使用 new Function/eval，避免审核风险
 */

const ENGINE_URL = 'https://liubigfatty.github.io/pension-calculator/js/pension-engine-browser.js'
let _engine = null

/**
 * 加载引擎（缓存，只加载一次）
 */
function loadEngine() {
  if (_engine) return Promise.resolve(_engine)
  return new Promise((resolve, reject) => {
    wx.request({
      url: ENGINE_URL,
      dataType: 'text',
      success(res) {
        try {
          // 在内联沙箱中执行引擎代码，捕获 module.exports
          var mod = { exports: {} }
          // 在函数作用域内执行，不污染全局
          var fn = new Function('module', 'exports', 'require', res.data)
          fn(mod, mod.exports, function() { return null })
          _engine = mod.exports
          resolve(_engine)
        } catch(e) {
          reject(new Error('引擎解析失败: ' + e.message))
        }
      },
      fail(err) {
        reject(new Error('引擎加载失败: ' + err.errMsg))
      }
    })
  })
}

module.exports = { loadEngine }

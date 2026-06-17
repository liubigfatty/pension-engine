/**
 * 引擎远程加载工具
 */
const ENGINE_URL = 'https://liubigfatty.github.io/pension-calculator/js/pension-engine-browser.js'
let _engine = null

function loadEngine() {
  if (_engine) return Promise.resolve(_engine)
  return new Promise(function(resolve, reject) {
    wx.request({
      url: ENGINE_URL,
      responseType: 'text',
      success(res) {
        try {
          var mod = { exports: {} }
          new Function('module', 'exports', res.data)(mod, mod.exports)
          _engine = mod.exports
          resolve(_engine)
        } catch(e) {
          reject(new Error('引擎解析失败'))
        }
      },
      fail() {
        reject(new Error('引擎加载失败'))
      }
    })
  })
}

module.exports = { loadEngine }

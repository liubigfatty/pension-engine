/**
 * 养老金计算引擎加载器
 * 从远程加载引擎，避免编译时超时
 */

const ENGINE_URL = 'https://liubigfatty.github.io/pension-calculator/js/pension-engine-browser.js'

let engineCache = null
let loadingPromise = null

/**
 * 加载引擎（带缓存）
 */
function loadEngine() {
  // 如果已缓存，直接返回
  if (engineCache) {
    return Promise.resolve(engineCache)
  }

  // 如果正在加载，返回同一个 Promise
  if (loadingPromise) {
    return loadingPromise
  }

  // 开始加载
  loadingPromise = new Promise((resolve, reject) => {
    wx.request({
      url: ENGINE_URL,
      responseType: 'text',
      timeout: 10000, // 10秒超时
      success(res) {
        if (res.statusCode === 200 && res.data) {
          try {
            // 使用 new Function 执行引擎代码
            const mod = { exports: {} }
            const fn = new Function('module', 'exports', res.data)
            fn(mod, mod.exports)
            
            if (mod.exports) {
              engineCache = mod.exports
              resolve(engineCache)
            } else {
              reject(new Error('引擎模块导出为空'))
            }
          } catch (e) {
            reject(new Error('引擎解析失败: ' + e.message))
          }
        } else {
          reject(new Error('加载引擎失败，状态码: ' + res.statusCode))
        }
      },
      fail(err) {
        reject(new Error('网络请求失败: ' + (err.errMsg || '未知错误')))
      }
    })
  })

  return loadingPromise
}

/**
 * 清除缓存（用于调试）
 */
function clearCache() {
  engineCache = null
  loadingPromise = null
}

module.exports = {
  loadEngine,
  clearCache
}

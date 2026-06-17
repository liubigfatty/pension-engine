// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// 引入引擎（本地 require，云函数运行时加载）
const engine = require('./pension-engine')

/**
 * 养老金计算云函数
 * 
 * @param {Object} event - 输入参数
 * @param {string} event.name - 姓名
 * @param {string} event.gender - 性别 (male/fc/fw)
 * @param {number} event.birthYear - 出生年份
 * @param {number} event.birthMonth - 出生月份
 * @param {number} event.workYear - 参加工作年份
 * @param {number} event.workMonth - 参加工作月份
 * @param {number} event.avgIndex - 缴费指数
 * @param {string} event.cityType - 城市代码 (prov/cc/jl等)
 * @param {string} event.retireType - 退休类型 (normal/early)
 * @param {number|null} event.personalAccInput - 个人账户余额(自定义输入)
 * @param {number} event.sightYears - 视同缴费年限
 * @param {Object} event.provinceConfig - 省份配置对象
 */
exports.main = async (event, context) => {
  const {
    name = '',
    gender,
    birthYear,
    birthMonth,
    workYear,
    workMonth,
    avgIndex,
    cityType = 'prov',
    retireType,
    personalAccInput = null,
    sightYears = 0,
    provinceConfig
  } = event

  // 参数校验
  if (!provinceConfig) {
    return {
      success: false,
      error: '缺少省份配置'
    }
  }
  if (!gender || !birthYear || !birthMonth || !workYear || !workMonth) {
    return {
      success: false,
      error: '缺少必要参数'
    }
  }

  try {
    // 构建输入对象
    const input = {
      name,
      gender,
      birthYear: Number(birthYear),
      birthMonth: Number(birthMonth),
      workYear: Number(workYear),
      workMonth: Number(workMonth),
      avgIndex: Number(avgIndex) || 1.0,
      cityType,
      retireType,
      personalAccInput: personalAccInput ? Number(personalAccInput) : null,
      sightYears: Number(sightYears) || 0
    }

    // 调用引擎计算
    const result = engine.calculate(provinceConfig, input)

    return {
      success: true,
      data: result
    }

  } catch (err) {
    console.error('计算错误:', err)
    return {
      success: false,
      error: err.message || '计算失败',
      stack: err.stack
    }
  }
}

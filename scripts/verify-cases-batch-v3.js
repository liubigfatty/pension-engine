/**
 * 批量验证脚本 v3（重写版）
 * 用法：node scripts/verify-cases-batch-v3.js
 * 输出：verify-report-YYYYMMDD-HHMMSS.txt
 */

const fs   = require('fs')
const path = require('path')

const ROOT   = path.resolve(__dirname, '..')
const ENGINE = require(path.join(ROOT, 'engine/pension-engine'))
const CASES  = path.join(ROOT, 'cases')
const OUTFILE = path.join(ROOT, `verify-report-${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}.txt`)

// 省份配置缓存
const configCache = {}
function getConfig(provinceKey) {
  if (configCache[provinceKey]) return configCache[provinceKey]
  const file = path.join(ROOT, 'provinces', `${provinceKey}.json`)
  if (!fs.existsSync(file)) return null
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'))
  configCache[provinceKey] = cfg
  return cfg
}

// 省份名 → 配置文件名（优先直接匹配文件名）
function mapProvinceKey(province) {
  if (!province) return null
  const trimmed = province.trim()

  // 方式1：直接作为文件名尝试
  let directFile = path.join(ROOT, 'provinces', `${trimmed}.json`)
  if (fs.existsSync(directFile)) return trimmed

  // 方式2：中文省份名映射表
  const map = {
    '吉林省': 'jilin', '吉林': 'jilin',
    '北京市': 'beijing', '北京': 'beijing',
    '上海市': 'shanghai', '上海': 'shanghai',
    '广东省': 'guangdong', '广东': 'guangdong',
    '河北省': 'hebei', '河北': 'hebei',
    '黑龙江省': 'heilongjiang', '黑龙江': 'heilongjiang',
    '湖南省': 'hunan', '湖南': 'hunan',
    '江苏省': 'jiangsu', '江苏': 'jiangsu',
    '辽宁省': 'liaoning', '辽宁': 'liaoning',
    '山东省': 'shandong', '山东': 'shandong',
    '安徽省': 'anhui', '安徽': 'anhui',
    '甘肃省': 'gansu', '甘肃': 'gansu',
    '河南省': 'henan', '河南': 'henan',
    '浙江省': 'zhejiang', '浙江': 'zhejiang',
    '天津市': 'tianjin', '天津': 'tianjin',
    '湖北省': 'hubei', '湖北': 'hubei',
    '青海省': 'qinghai', '青海': 'qinghai',
    '云南省': 'yunnan', '云南': 'yunnan',
    '宁夏回族自治区': 'ningxia', '宁夏': 'ningxia',
    '江西省': 'jiangxi', '江西': 'jiangxi',
    '贵州省': 'guizhou', '贵州': 'guizhou',
    '深圳': 'shenzhen', '深圳市': 'shenzhen',
    '四川省': 'sichuan', '四川': 'sichuan',
    '福建省': 'fujian', '福建': 'fujian',
    '山西省': 'shanxi', '山西': 'shanxi',
    '陕西省': 'shaanxi', '陕西': 'shaanxi',
    '西藏自治区': 'xizang', '西藏': 'xizang',
  }
  if (map[trimmed]) return map[trimmed]

  // 方式3：模糊包含匹配
  for (const [k, v] of Object.entries(map)) {
    const cleanK = k.replace(/省|市|自治区/, '')
    if (trimmed.includes(cleanK)) return v
  }
  return null
}

// 日期解析（简单可靠：支持 YYYY年MM月 / YYYY-MM-DD / YYYY/MM/DD）
function parseDate(str) {
  if (!str) return null
  // 格式1: "1971年02月" 或 "1971年02月10日"
  let m = str.match(/(\d{4})年(\d{1,2})月/)
  if (m) return { year: +m[1], month: +m[2] }
  // 格式2: "1965-08-19" 或 "1965-08"
  m = str.match(/^(\d{4})-(\d{2})/)
  if (m) return { year: +m[1], month: +m[2] }
  // 格式3: "1965/08/19" 或 "1965/08"
  m = str.match(/^(\d{4})\/(\d{2})/)
  if (m) return { year: +m[1], month: +m[2] }
  return null
}

// 安全数值解析（多字段名尝试）
function parseNum(...args) {
  for (const a of args) {
    if (a == null) continue
    const n = parseFloat(a)
    if (!isNaN(n)) return n
  }
  return null
}

// 性别映射
function mapGender(gender) {
  if (!gender) return 'male'
  const g = typeof gender === 'string' ? gender.toLowerCase() : ''
  if (g === '男' || g === 'male') return 'male'
  if (g === '女' || g === 'female') return 'female'
  return 'male'
}
function mapGenderType(gender, retireAge) {
  if (mapGender(gender) === 'male') return 'male'
  if (retireAge === 50) return 'fw'
  if (retireAge === 55) return 'fc'
  return 'fw'
}

// cityType 映射
function mapCityType(city) {
  if (!city) return 'prov'
  return String(city).includes('长春') ? 'cc' : 'prov'
}

// 案例 → 引擎输入
function caseToInput(c) {
  const birthStr = c.birth || c.birth_date || c.birthDate || ''
  const workStr = c.work_start || c.work_start_date || c.workDate || c.employment_start_date || ''
  const birth = parseDate(birthStr)
  const work = parseDate(workStr)
  if (!birth || !work) return null

  const gender = mapGender(c.gender || c.genderType)
  const genderType = mapGenderType(gender, c.retirement_age)
  const cityType = mapCityType(c.city || c.region)

  const input = {
    name: String(c.case_id || c.id || 'unknown'),
    gender,
    birthYear: birth.year,
    birthMonth: birth.month,
    workYear: work.year,
    workMonth: work.month,
    genderType,
    cityType,
    avgIndex: parseNum(c.avg_index, c.average_wage_index, c.avgIndex, 1.0),
    personalAccInput: parseNum(c.personal_account, c.personal_account_balance, c.personalAcc, c.personalAccInput),
    sightYears: parseNum(c.deemed_years, c.sightYears, c.sightYearsInput),
    totalYearsInput: parseNum(c.total_years, c.totalYears, c.totalYearsInput),
  }

  const br = parseNum(c.base_number_city, c.pension_base, c.baseRetire, c.baseRetireInput)
  const bp = parseNum(c.base_number_province, c.pension_base, c.baseProv, c.baseProvInput)
  if (br != null) input.baseRetireInput = br
  if (bp != null) input.baseProvInput = bp

  if (c.retirement_type && (c.retirement_type.includes('提前') || c.retirement_type.includes('弹性'))) {
    input.skipDelay = true
  }

  return input
}

// 提取官方期望值（支持多种嵌套/平铺格式）
function getExpected(c) {
  // 格式A：平铺字段（29.json 等）
  if (c.basic_pension != null) {
    return {
      basic:     parseNum(c.basic_pension),
      extra:     parseNum(c.total_years_bonus, c.years_bonus),
      personal:  parseNum(c.personal_pension),
      transitional: parseNum(c.transitional_pension, c.transition_pension),
      total:     parseNum(c.total, c.monthly_basic_pension_total, c.totalPension),
    }
  }
  // 格式B：pension_breakdown（下划线）或 pensionBreakdown（驼峰）
  const pb = c.pension_breakdown || c.pensionBreakdown
  if (pb) {
    const extra = pb.basic_pension_increase_by_tenure || pb.basicPensionIncreaseByTenure || pb.extraPension || {}
    return {
      basic:         parseNum(pb.basic_pension, pb.basicPension),
      extra:         parseNum(extra.total, extra.amount),
      personal:      parseNum(pb.personal_account_pension, pb.personalAccountPension, pb.personal_pension, pb.personalPension),
      transitional:  parseNum(pb.transitional_pension, pb.transitionalPension, pb.transition_pension),
      total:          parseNum(pb.monthly_basic_pension_total, pb.monthlyBasicPensionTotal, pb.total, pb.totalPension),
    }
  }
  // 格式C：直接有 total 字段
  if (c.total != null) {
    return {
      basic:     parseNum(c.basic_pension, c.basicPension),
      extra:     parseNum(c.extra_pension, c.extraPension),
      personal:  parseNum(c.personal_pension, c.personalPension),
      transitional: parseNum(c.transitional_pension, c.transitionalPension),
      total:     parseNum(c.total, c.totalPension),
    }
  }
  return null
}

// 单案例验证
function verifyCase(c, provinceKey) {
  const input = caseToInput(c)
  const expected = getExpected(c)
  if (!input || !expected) return { skip: true, reason: '无法解析输入或期望值' }

  const config = getConfig(provinceKey)
  if (!config) return { skip: true, reason: `省份配置缺失: ${provinceKey}` }

  let result
  try { result = ENGINE.calculate(config, input) }
  catch (e) { return { error: true, reason: e.message } }

  const legal = result.legal
  const diffs = []
  const check = (label, exp, act) => {
    if (exp == null || act == null) return
    const d = Math.abs(exp - act)
    if (d > 1.0)       diffs.push(`  ✗ ${label}: 期望¥${exp.toFixed(2)} vs 实际¥${act.toFixed(2)} (差¥${d.toFixed(2)})`)
    else if (d > 0.01)  diffs.push(`  ⚠ ${label}: 期望¥${exp.toFixed(2)} vs 实际¥${act.toFixed(2)} (差¥${d.toFixed(2)})`)
  }

  check('基础养老金',     expected.basic,        legal.basicPension?.amount)
  check('增发养老金',     expected.extra,        legal.extraPension?.amount)
  check('个人账户养老金', expected.personal,    legal.personalPension?.amount)
  check('过渡性养老金',   expected.transitional, legal.transitionalPension?.amount)
  check('月养老金合计',   expected.total,        legal.total)

  return {
    skip: false,
    pass: diffs.length === 0,
    diffs,
    expected,
    actual: {
      basic:    legal.basicPension?.amount,
      extra:    legal.extraPension?.amount,
      personal: legal.personalPension?.amount,
      transitional: legal.transitionalPension?.amount,
      total:    legal.total,
    }
  }
}

// 递归收集所有 JSON 案例
function collectCases() {
  const results = []
  function walk(dir) {
    for (const f of fs.readdirSync(dir)) {
      const fp = path.join(dir, f)
      const st = fs.statSync(fp)
      if (st.isDirectory()) { walk(fp); continue }
      if (!f.endsWith('.json')) continue
      results.push({ dir: path.basename(dir), file: f, fullPath: fp })
    }
  }
  walk(CASES)
  return results
}

// 主流程
function main() {
  const all = collectCases()
  const lines = []
  let pass = 0, fail = 0, skip = 0, err = 0

  lines.push('═'.repeat(72))
  lines.push(`  养老金引擎批量验证报告 (v3 重写版)`)
  lines.push(`  时间: ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}`)
  lines.push(`  案例总数: ${all.length}`)
  lines.push('═'.repeat(72))
  lines.push('')

  for (const item of all) {
    let obj
    try { obj = JSON.parse(fs.readFileSync(item.fullPath, 'utf8')) }
    catch (e) {
      lines.push(`[ERROR] ${item.file}: JSON解析失败`)
      err++; continue
    }

    const province = obj.province || obj.region || obj.city || item.dir
    const pk = mapProvinceKey(province)
    if (!pk) {
      lines.push(`[SKIP] ${item.file}: 无法识别省份: ${province}`)
      skip++; continue
    }

    const r = verifyCase(obj, pk)
    if (r.skip) {
      lines.push(`[SKIP] ${item.file}: ${r.reason}`)
      skip++
    } else if (r.error) {
      lines.push(`[ERROR] ${item.file}: ${r.reason}`)
      err++
    } else if (r.pass) {
      lines.push(`[PASS] ${item.file}`)
      pass++
    } else {
      lines.push(`[FAIL] ${item.file}`)
      r.diffs.forEach(d => lines.push(d))
      fail++
    }
  }

  lines.push('')
  lines.push('═'.repeat(72))
  lines.push(`  结果汇总:`)
  lines.push(`    ✅ 通过:  ${pass}`)
  lines.push(`    ✗ 失败:  ${fail}`)
  lines.push(`    ⚠  跳过:  ${skip}`)
  lines.push(`    💥 错误:  ${err}`)
  lines.push(`    总计:   ${all.length}`)
  lines.push('═'.repeat(72))

  const report = lines.join('\n')
  fs.writeFileSync(OUTFILE, report, 'utf8')
  console.log(report)
  console.log(`\n📄 报告已保存: ${OUTFILE}`)
}

main()

/**
 * 批量验证脚本 v2 — 把 cases/ 里所有案例跑一遍，对比引擎输出与官方值
 *
 * 用法：node scripts/verify-cases-batch-v2.js
 * 输出：verify-report-YYYYMMDD-HHMMSS.txt
 */

const fs   = require('fs')
const path = require('path')

// ── 路径 ─────────────────────────────────────────────
const ROOT   = path.resolve(__dirname, '..')
const ENGINE = require(path.join(ROOT, 'engine/pension-engine'))
const CASES  = path.join(ROOT, 'cases')
const OUTFILE = path.join(ROOT, `verify-report-${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}.txt`)

// ── 省份配置缓存 ─────────────────────────────────────
const configCache = {}
function getConfig(provinceKey) {
  if (configCache[provinceKey]) return configCache[provinceKey]
  const file = path.join(ROOT, 'provinces', `${provinceKey}.json`)
  if (!fs.existsSync(file)) return null
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'))
  configCache[provinceKey] = cfg
  return cfg
}

// ── 省份名 → 配置文件名 映射 ──────────────────────
function mapProvinceKey(province) {
  if (!province) return null
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
    '宁夏': 'ningxia', '宁夏回族自治区': 'ningxia',
    '江西省': 'jiangxi', '江西': 'jiangxi',
    '贵州省': 'guizhou', '贵州': 'guizhou',
    '深圳': 'shenzhen', '深圳市': 'shenzhen',
  }
  // 尝试精确匹配
  if (map[province]) return map[province]
  // 尝试包含匹配
  for (const [k, v] of Object.entries(map)) {
    if (province.includes(k.replace(/省|市|自治区/, ''))) return v
  }
  return null
}

// ── 日期解析（支持多种格式）─────────────────────────
function parseDate(str) {
  if (!str) return null
  // 格式1: "YYYY年MM月" 或 "YYYY年MM月DD日"
  let m = str.match(/(\d{4})年(\d{1,2})月/)
  if (m) return { year: +m[1], month: +m[2] }
  // 格式2: "YYYY-MM-DD" 或 "YYYY-MM"
  m = str.match(/^(\d{4})-(\d{2})/)
  if (m) return { year: +m[1], month: +m[2] }
  // 格式3: "YYYY/MM/DD" 或 "YYYY/MM"
  m = str.match(/^(\d{4})\/(\d{2})/)
  if (m) return { year: +m[1], month: +m[2] }
  return null
}

// ── 性别映射 ───────────────────────────────────────
function mapGender(gender) {
  if (!gender) return 'male'
  if (typeof gender === 'string') {
    if (gender === '男' || gender.toLowerCase() === 'male') return 'male'
    if (gender === '女' || gender.toLowerCase() === 'female') return 'female'
  }
  return 'male'
}
function mapGenderType(gender, retirementAge) {
  const g = mapGender(gender)
  if (g === 'male') return 'male'
  // 女性：根据退休年龄判断 50→fw, 55→fc
  if (retirementAge === 50) return 'fw'
  if (retirementAge === 55) return 'fc'
  return 'fw' // 默认
}

// ── cityType 映射 ───────────────────────────────────
function mapCityType(city) {
  if (!city) return 'prov'
  if (typeof city === 'string' && city.includes('长春')) return 'cc'
  return 'prov'
}

// ── 案例 → 引擎输入 ───────────────────────────────
function caseToInput(c) {
  // 支持多种字段名
  const birthStr = c.birth || c.birth_date || c.birthDate || ''
  const workStr = c.work_start || c.work_start_date || c.workDate || c.employment_start_date || ''
  const birth = parseDate(birthStr)
  const work = parseDate(workStr)
  if (!birth || !work) return null

  const gender = mapGender(c.gender || c.genderType)
  const genderType = mapGenderType(gender, c.retirement_age)
  const cityType = mapCityType(c.city || c.region)

  // 基础字段
  const input = {
    name:            String(c.case_id || c.id || 'unknown'),
    gender,
    birthYear:       birth.year,
    birthMonth:      birth.month,
    workYear:        work.year,
    workMonth:       work.month,
    genderType,
    cityType,
    avgIndex:        parseNum(c.avg_index, c.average_wage_index, c.avgIndex, 1.0),
    personalAccInput: parseNum(c.personal_account, c.personal_account_balance, c.personalAcc, c.personalAccInput),
    sightYearsInput:  parseNum(c.deemed_years, c.sightYears, c.sightYearsInput),
    totalYearsInput:  parseNum(c.total_years, c.totalYears, c.totalYearsInput),
  }

  // 计发基数：优先用退休地，其次全省
  const baseRetire = parseNum(c.base_number_city, c.pension_base, c.baseRetire, c.baseRetireInput)
  const baseProv = parseNum(c.base_number_province, c.pension_base, c.baseProv, c.baseProvInput)
  if (baseRetire != null) input.baseRetireInput = baseRetire
  if (baseProv != null) input.baseProvInput = baseProv

  // 特殊工种提前退休 → skipDelay
  if (c.retirement_type && (c.retirement_type.includes('提前') || c.retirement_type.includes('弹性'))) {
    input.skipDelay = true
  }

  return input
}

// ── 安全数值解析 ───────────────────────────────────
function parseNum(...args) {
  for (const a of args) {
    if (a == null) continue
    const n = parseFloat(a)
    if (!isNaN(n)) return n
  }
  return null
}

// ── 提取官方期望值 ─────────────────────────────────
function getExpected(c) {
  // 格式A：平铺字段（29.json 等）
  if (c.basic_pension != null) {
    return {
      basic:          parseNum(c.basic_pension),
      extra:          parseNum(c.total_years_bonus, c.years_bonus),
      personal:       parseNum(c.personal_pension),
      transitional:   parseNum(c.transitional_pension, c.transition_pension),
      total:          parseNum(c.total, c.monthly_basic_pension_total, c.totalPension),
    }
  }
  // 格式B：嵌套结构（jilin-pension-case.json 等）
  if (c.pension_breakdown || c.pensionBreakdown) {
    const b = c.pension_breakdown || c.pensionBreakdown
    const extra = b.basic_pension_increase_by_tenure || b.basicPensionIncreaseByTenure || b.extraPension || {}
    return {
      basic:          parseNum(b.basic_pension, b.basicPension),
      extra:          parseNum(extra.total, extra.amount),
      personal:       parseNum(b.personal_account_pension, b.personalAccountPension, b.personal_pension, b.personalPension),
      transitional:   parseNum(b.transitional_pension, b.transitionalPension, b.transition_pension),
      total:          parseNum(b.monthly_basic_pension_total, b.monthlyBasicPensionTotal, b.total, b.totalPension),
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

// ── 单案例验证 ─────────────────────────────────────
function verifyCase(c, provinceKey) {
  const input = caseToInput(c)
  const expected = getExpected(c)
  if (!input || !expected) return { skip: true, reason: '无法解析输入或期望值' }

  const config = getConfig(provinceKey)
  if (!config) return { skip: true, reason: `省份配置缺失: ${provinceKey}` }

  let result
  try {
    result = ENGINE.calculate(config, input)
  } catch (e) {
    return { error: true, reason: e.message }
  }

  const legal = result.legal
  const diffs = []

  const check = (label, expected, actual) => {
    if (expected == null || actual == null) return
    const diff = Math.abs(expected - actual)
    if (diff > 1.0) {
      diffs.push(`  ❌ ${label}: 期望¥${expected.toFixed(2)} vs 实际¥${actual.toFixed(2)} (差¥${diff.toFixed(2)})`)
    } else if (diff > 0.01) {
      diffs.push(`  ⚠️ ${label}: 期望¥${expected.toFixed(2)} vs 实际¥${actual.toFixed(2)} (差¥${diff.toFixed(2)})`)
    }
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

// ── 收集所有案例文件 ───────────────────────────────
function collectCases() {
  const results = []

  function walkDir(dir) {
    const items = fs.readdirSync(dir)
    for (const f of items) {
      const fp = path.join(dir, f)
      const stat = fs.statSync(fp)
      if (stat.isDirectory()) {
        walkDir(fp)
      } else if (f.endsWith('.json')) {
        const dirName = path.basename(dir)
        results.push({ dir: dirName, file: f, fullPath: fp })
      }
    }
  }

  walkDir(CASES)
  return results
}

// ── 主流程 ─────────────────────────────────────────
function main() {
  const all = collectCases()
  const lines = []
  let passCount = 0, failCount = 0, skipCount = 0, errorCount = 0

  lines.push('═'.repeat(72))
  lines.push(`  养老金引擎批量验证报告 (v2)`)
  lines.push(`  时间: ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}`)
  lines.push(`  案例总数: ${all.length}`)
  lines.push('═'.repeat(72))
  lines.push('')

  for (const item of all) {
    let caseObj
    try {
      caseObj = JSON.parse(fs.readFileSync(item.fullPath, 'utf8'))
    } catch (e) {
      lines.push(`[ERROR] ${item.dir}/${item.file}: JSON解析失败 - ${e.message}`)
      errorCount++
      continue
    }

    // 确定省份 key
    const province = caseObj.province || caseObj.region || caseObj.city || item.dir
    const provinceKey = mapProvinceKey(province)
    if (!provinceKey) {
      lines.push(`[SKIP] ${item.file}: 无法识别省份: ${province}`)
      skipCount++
      continue
    }

    const r = verifyCase(caseObj, provinceKey)

    if (r.skip) {
      lines.push(`[SKIP] ${item.file}: ${r.reason}`)
      skipCount++
    } else if (r.error) {
      lines.push(`[ERROR] ${item.file}: ${r.reason}`)
      errorCount++
    } else if (r.pass) {
      lines.push(`[PASS] ${item.file}`)
      passCount++
    } else {
      lines.push(`[FAIL] ${item.file}`)
      r.diffs.forEach(d => lines.push(d))
      failCount++
    }
  }

  lines.push('')
  lines.push('═'.repeat(72))
  lines.push(`  结果汇总:`)
  lines.push(`    ✅ 通过:  ${passCount}`)
  lines.push(`    ❌ 失败:  ${failCount}`)
  lines.push(`    ⚠️  跳过:  ${skipCount}`)
  lines.push(`    💥 错误:  ${errorCount}`)
  lines.push(`    总计:   ${all.length}`)
  lines.push('═'.repeat(72))

  const report = lines.join('\n')
  fs.writeFileSync(OUTFILE, report, 'utf8')
  console.log(report)
  console.log('')
  console.log(`📄 报告已保存: ${OUTFILE}`)
}

main()

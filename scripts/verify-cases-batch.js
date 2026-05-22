/**
 * 批量验证脚本 — 把 cases/ 里所有案例跑一遍，对比引擎输出与官方值
 *
 * 用法：node scripts/verify-cases-batch.js
 * 输出：verify-report-YYYYMMDD-HHMMSS.txt
 */

const fs   = require('fs')
const path = require('path')

// ── 路径 ──────────────────────────────────────────────
const ROOT    = path.resolve(__dirname, '..')
const ENGINE  = require(path.join(ROOT, 'engine/pension-engine'))
const CASES   = path.join(ROOT, 'cases')
const OUTFILE = path.join(ROOT, `verify-report-${new Date().toISOString().replace(/[-:]/g,'').slice(0,15)}.txt`)

// ── 省份配置缓存 ───────────────────────────────────────
const configCache = {}
function getConfig(province) {
  if (configCache[province]) return configCache[province]
  const file = path.join(ROOT, 'provinces', `${province}.json`)
  if (!fs.existsSync(file)) return null
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'))
  configCache[province] = cfg
  return cfg
}

// ── 中文月份解析 ─────────────────────────────────────
function parseCNDate(str) {
  if (!str) return null
  const m = str.match(/(\d{4})年(\d{1,2})月/)
  return m ? { year: +m[1], month: +m[2] } : null
}

// ── 性别映射 ─────────────────────────────────────────
function mapGender(gender) {
  if (gender === '男' || gender === 'male')   return 'male'
  if (gender === '女' || gender === 'female') return 'female'
  return 'male'
}
function mapGenderType(gender, retirementAge) {
  if (gender === 'male' || gender === '男') return 'male'
  // 女性：根据退休年龄判断 50→fw, 55→fc
  if (retirementAge === 50) return 'fw'
  if (retirementAge === 55) return 'fc'
  return 'fw' // 默认
}

// ── cityType 映射 ─────────────────────────────────────
function mapCityType(city) {
  if (!city) return 'prov'
  if (city.includes('长春')) return 'cc'
  return 'prov'
}

// ── 案例 → 引擎输入 ─────────────────────────────────
function caseToInput(c) {
  const birth = parseCNDate(c.birth || c.birth_date)
  const work  = parseCNDate(c.work_start || c.employment_start_date || c.workDate)
  if (!birth || !work) return null

  const gender     = mapGender(c.gender)
  const genderType = mapGenderType(gender, c.retirement_age)
  const cityType  = mapCityType(c.city)

  const input = {
    name:       String(c.case_id || 'unknown'),
    gender,
    birthYear:  birth.year,
    birthMonth: birth.month,
    workYear:   work.year,
    workMonth:  work.month,
    genderType,
    cityType,
    avgIndex:         c.avg_index != null ? +c.avg_index : (c.average_wage_index != null ? +c.average_wage_index : 1.0),
    personalAccInput:  c.personal_account != null ? +c.personal_account : (c.personal_account_balance != null ? +c.personal_account_balance : null),
    sightYearsInput:   c.deemed_years != null ? +c.deemed_years : null,
    totalYearsInput:   c.total_years != null ? +c.total_years : null,
    baseRetireInput:   c.base_number_city != null ? +c.base_number_city : (c.pension_base != null ? +c.pension_base : null),
    baseProvInput:      c.base_number_province != null ? +c.base_number_province : (c.pension_base != null ? +c.pension_base : null),
  }

  // 特殊工种提前退休 → skipDelay
  if (c.retirement_type && c.retirement_type.includes('提前')) {
    input.skipDelay = true
  }

  return input
}

// ── 提取官方期望值 ───────────────────────────────────
function getExpected(c) {
  // 格式1：平铺字段（29.json 等）
  if (c.basic_pension != null) {
    return {
      basic:     +c.basic_pension,
      extra:      +c.total_years_bonus != null ? +c.total_years_bonus : null,
      personal:   +c.personal_pension,
      transitional: +c.transition_pension,
      total:      +c.total,
    }
  }
  // 格式2：嵌套结构（jilin-pension-case.json 等）
  if (c.pension_breakdown) {
    const b = c.pension_breakdown
    return {
      basic:      b.basic_pension,
      extra:       b.basic_pension_increase_by_tenure?.total != null ? b.basic_pension_increase_by_tenure.total : null,
      personal:    b.personal_account_pension,
      transitional: b.transitional_pension,
      total:       b.monthly_basic_pension_total,
    }
  }
  return null
}

// ── 单案例验证 ─────────────────────────────────────
function verifyCase(c, provinceKey) {
  const input     = caseToInput(c)
  const expected  = getExpected(c)
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

  check('基础养老金',       expected.basic,          legal.basicPension?.amount)
  check('增发养老金',        expected.extra,          legal.extraPension?.amount)
  check('个人账户养老金',    expected.personal,       legal.personalPension?.amount)
  check('过渡性养老金',      expected.transitional,    legal.transitionalPension?.amount)
  check('月养老金合计',      expected.total,           legal.total)

  return {
    skip: false,
    pass: diffs.length === 0,
    diffs,
    expected,
    actual: {
      basic:     legal.basicPension?.amount,
      extra:     legal.extraPension?.amount,
      personal:  legal.personalPension?.amount,
      transitional: legal.transitionalPension?.amount,
      total:     legal.total,
    }
  }
}

// ── 收集所有案例文件 ─────────────────────────────────
function collectCases() {
  const results = []
  const provinces = fs.readdirSync(CASES).filter(f => {
    const fp = path.join(CASES, f)
    return fs.statSync(fp).isDirectory()
  })

  for (const prov of provinces) {
    const pdir = path.join(CASES, prov)
    const files = fs.readdirSync(pdir).filter(f => f.endsWith('.json'))
    for (const f of files) {
      const fp = path.join(pdir, f)
      try {
        const c = JSON.parse(fs.readFileSync(fp, 'utf8'))
        results.push({ province: prov, file: f, case: c })
      } catch (e) {
        results.push({ province: prov, file: f, error: e.message })
      }
    }
  }

  // 也检查 cases/ 根目录
  const rootFiles = fs.readdirSync(CASES).filter(f => f.endsWith('.json'))
  for (const f of rootFiles) {
    const fp = path.join(CASES, f)
    try {
      const c = JSON.parse(fs.readFileSync(fp, 'utf8'))
      results.push({ province: c.province || 'unknown', file: f, case: c })
    } catch (e) {
      // ignore
    }
  }

  return results
}

// ── 主流程 ───────────────────────────────────────────
function main() {
  const all = collectCases()
  const lines = []
  let passCount = 0, failCount = 0, skipCount = 0, errorCount = 0

  lines.push('═'.repeat(72))
  lines.push(`  养老金引擎批量验证报告`)
  lines.push(`  时间: ${new Date().toLocaleString('zh-CN', {timeZone:'Asia/Shanghai'})}`)
  lines.push(`  案例总数: ${all.length}`)
  lines.push('═'.repeat(72))
  lines.push('')

  for (const item of all) {
    if (item.error) {
      lines.push(`[ERROR] ${item.province}/${item.file}: ${item.error}`)
      errorCount++
      continue
    }

    const { province, file, case: c } = item
    const provinceKey = province.replace(/省|市|壮族自治区|维吾尔自治区|自治区/, '').toLowerCase()
    // 简单映射：jilin → jilin, beijing → beijing 等
    const key = provinceKey === 'jilin' ? 'jilin'
      : provinceKey === 'beijing' ? 'beijing'
      : provinceKey === 'shanghai' ? 'shanghai'
      : provinceKey === 'guangdong' ? 'guangdong'
      : provinceKey === 'hebei' ? 'hebei'
      : provinceKey // 尝试直接用

    const r = verifyCase(c, key)

    if (r.skip) {
      lines.push(`[SKIP] ${file}: ${r.reason}`)
      skipCount++
    } else if (r.error) {
      lines.push(`[ERROR] ${file}: ${r.reason}`)
      errorCount++
    } else if (r.pass) {
      lines.push(`[PASS] ${file}`)
      passCount++
    } else {
      lines.push(`[FAIL] ${file}`)
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

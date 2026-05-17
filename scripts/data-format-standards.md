# 养老金案例数据格式规范

## 1. 核心字段定义

### 1.1 人员基本信息
```json
{
  "case_id": "唯一标识",           // 字符串/数字，全局唯一
  "province": "省份",             // 如"吉林省"、"山东省"
  "city": "城市",                 // 如"长春市"、"济南市"
  "gender": "男|女",
  "birth_date": "YYYY-MM" or "YYYY-MM-DD",
  "work_start_date": "YYYY-MM-DD",  // 参加工作/参保时间
  "retire_date": "YYYY-MM or YYYY-MM-DD",  // 退休时间
  "retire_age": 60,                // 退休年龄（整数）
  "retire_type": "正常退休|提前退休|特殊工种退休|内退"
}
```

### 1.2 身份分类（关键！）
```json
{
  "job_category": "企业男职工|企业女工人|企业女干部|灵活就业男|灵活就业女|机关事业单位人员",
  "position": "管理岗|技术岗|工人岗|无|企业管理人员",
  "special_job": true|false,       // 特殊工种
  "military_transfer": true|false  // 军转干部
}
```

### 1.3 缴费信息
```json
{
  "contribution_years": {
    "deemed_years": 6.42,          // 视同缴费年限
    "deemed_months": 0,
    "actual_years": 32.67,         // 实际缴费年限
    "actual_months": 392,
    "total_years": 39.09,          // 累计缴费年限
    "total_months": 468,
    "interruption_years": 0,       // 中断缴费年限
    "special_converted_years": 0   // 特殊工种折算年限
  },
  "average_index": 1.48,           // 平均缴费指数
  "account_balance": 220698.73,    // 个人账户储存额
  "account_established_date": "1995-07-01"  // 建账时间
}
```

### 1.4 养老金计算
```json
{
  "pension_base": {
    "monthly": 7468,               // 计发基数（月）
    "yearly": 89616,               // 计发基数（年）
    "year": 2025                   // 计发基数年份
  },
  "breakdown": {
    "basic_pension": 2500.00,      // 基础养老金
    "account_pension": 1587.49,    // 个人账户养老金
    "transition_pension": 1200.00, // 过渡性养老金
    "adjustment_pension": 0.00,    // 调节金
    "local_subsidy": 0.00,         // 地方补贴
    "military_subsidy": 0.00,      // 军转补贴
    "other": 0.00                  // 其他
  },
  "total_pension": 5287.49,        // 合计月养老金
  "effective_date": "2025-06",     // 生效时间
  "account_months": 139            // 计发月数
}
```

### 1.5 系数与政策
```json
{
  "transition_coefficient": 0.013,  // 过渡系数（1.3%）
  "formula_details": {              // 各部分计算公式
    "basic_pension": "(社平×指数+社平)÷2×年限%",
    "account_pension": "账户余额÷计发月数",
    "transition_pension": "社平×指数×视同年×系数%"
  },
  "policy_reference": "国发〔1978〕104号|鲁政发[2006]92号"
}
```

### 1.6 数据质量标注
```json
{
  "data_quality": "official_verified|self_reported|predicted",  // 数据来源
  "source": "原始文件描述",
  "notes": ["备注1", "备注2"],
  "formula_verified": true|false,       // 公式是否已验证
  "formula_diff": 0.00                  // 与官方结果差异
}
```

## 2. 数据来源分类

### 2.1 真实计发案例（official_verified）
- 来源：真实养老金核定表、计发表
- 特征：有公章、编号、完整公式、官方数值
- 用途：核心验证集，用于引擎校准

### 2.2 用户自述案例（self_reported）
- 来源：微信聊天、口述、截图
- 特征：参数可能不全、有误差
- 用途：边界测试、异常处理

### 2.3 预测测算案例（predicted）
- 来源：模拟计算、假设场景
- 特征：明确标注为预测/测算
- 用途：功能测试、边界条件

## 3. 省份配置映射

| 目录 | 省份 | 核心配置文件 |
|------|------|-------------|
| jilin | 吉林省 | provinces/jilin.json |
| liaoning | 辽宁省 | provinces/liaoning.json |
| heilongjiang | 黑龙江省 | provinces/heilongjiang.json |
| shandong | 山东省 | provinces/shandong.json |
| henan | 河南省 | provinces/henan.json |
| hebei | 河北省 | provinces/hebei.json |
| jiangsu | 江苏省 | provinces/jiangsu.json |
| anhui | 安徽省 | provinces/anhui.json |
| hunan | 湖南省 | provinces/hunan.json |
| beijing | 北京市 | provinces/beijing.json |
| guangdong | 广东省 | provinces/guangdong.json |
| gansu | 甘肃省 | provinces/gansu.json |
| other | 其他 | cases/other/ |

## 4. 政策文号清单

### 国家层面
- 国发〔1978〕104号 — 退休退职办法（退休年龄基础依据）
- 国发〔1995〕6号 — 企业养老保险制度改革决定
- 国发〔2005〕38号 — 完善企业职工基本养老保险制度
- 劳社部发〔2001〕20号 — 灵活就业人员参保规定
- 人社部发〔2017〕76号 — 延迟退休相关政策
- 国发〔2024〕9号 — 渐进式延迟法定退休年龄决定

### 省级层面（需下载原文）
- 鲁政发[2006]92号 — 山东省养老保险办法
- 鲁人社规[2021]4号 — 山东省实施细则
- 皖政2006〔59〕号 — 安徽省养老保险办法
- 吉人社联发〔年份〕号 — 吉林省养老保险办法（待确认完整文号）

## 5. 验证规则

### 5.1 必验项
1. 基础养老金 = (计发基数 + 指数化工资) / 2 × 累计年限%
2. 个人账户养老金 = 账户余额 / 计发月数
3. 过渡性养老金 = 计发基数 × 指数 × 视同年 × 过渡系数
4. 合计 = 各分项之和（误差 ≤ 0.01）

### 5.2 逻辑一致性检查
1. 退休年龄 ≥ 法定最低年龄
2. 累计年限 = 视同年限 + 实际年限
3. 建账时间 ≤ 参加工作时间和1995-07-01的较晚者
4. 计发月数与退休年龄匹配

### 5.3 数据完整性
- 已退休案例：所有数值字段必填
- 未退休/测算案例：预测字段需标注"predicted"

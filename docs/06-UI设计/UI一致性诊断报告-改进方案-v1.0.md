# UI一致性诊断报告 & 改进方案

**项目**：养老金测算微信小程序  
**诊断时间**：2026年6月21日  
**诊断范围**：首页、步骤1-3、结果页（共5个页面）

---

## 一、诊断结果：发现6大类一致性问题 ⚠️

### 问题1：字体大小混乱（无统一排版 scale）

| 元素 | app.wxss | index | step1 | step3 | result | 问题 |
|--------|----------|-------|-------|-------|--------|------|
| 页面标题 | 44rpx | - | 44rpx | 44rpx | ✅ 一致 |
| 品牌名 | - | **48rpx** | - | - | ⚠️ 比其他标题大 |
| 副标题/说明 | 28rpx | 28rpx | 26rpx | 25-26rpx | ⚠️ 不一致 |
| 表单标签 | 30rpx | - | 30rpx | 30rpx | ✅ 一致 |
| 按钮文字 | 34rpx | **38rpx** | 34rpx | 30-34rpx | ⚠️ 不一致 |
| 小字说明 | 22-28rpx | 22-24rpx | 24rpx | 22-27rpx | ⚠️ 无规律 |

**结论**：没有统一的字体大小系统，开发人员随意写数值。

---

### 问题2：按钮样式不统一

| 属性 | app.wxss `.btn-primary` | index `.btn-start` | step1 `.btn-next` | step3 `.btn-calc` | result `.btn-share` |
|--------|------------------------|-------------------|---------------------|---------------------|----------------------|
| border-radius | **12rpx**（方角） | **50rpx**（全圆） | **50rpx**（全圆） | **50rpx**（全圆） | **50rpx**（全圆） |
| font-size | 34rpx | **38rpx** | 34rpx | 34rpx | 30rpx |
| font-weight | 500 | **600** | 500 | **600** | **600** |
| box-shadow | 无 | 有 | 无 | 有 | 有 |

**结论**：`app.wxss`里定义的按钮是方角的，但实际页面用的都是全圆角，两套风格并存！

---

### 问题3：选择器（Picker）样式不统一

| 属性 | app.wxss `.picker-box` | step1 `.picker-value` |
|--------|--------------------------|------------------------|
| background | `#fff` | `#f7f8fa`（浅灰） |
| border | `2rpx solid #e0e0e0` | `2rpx solid transparent`（默认无边框） |
| border-radius | `12rpx` | `16rpx` |
| padding | `24rpx 30rpx` | `28rpx 28rpx` |
| 选中状态 | 无定义 | 白底 + 绿色边框 |

**结论**：全局样式和实际页面样式是完全不同的两套设计！

---

### 问题4：颜色使用混乱（无统一色板）

| 用途 | 颜色值 | 出现位置 | 问题 |
|--------|----------|----------|------|
| 主文字色 | `#333` | app.wxss | ✅ 基础 |
| 主文字色 | `#1a1a1a` | step1, step3 | ⚠️ 比#333更黑，不一致 |
| 主文字色 | `#555` | result | ⚠️ 比#333浅，不一致 |
| 次文字色 | `#666` | app.wxss | ✅ 基础 |
| 次文字色 | `#999` | step1, app | ✅ 一致 |
| 背景色 | `#f5f5f5` | app.wxss | ✅ 基础 |
| 背景色 | 深蓝渐变 | index | ⚠️ 完全不同的色系 |
| 背景色 | `#f5f6fa` | result | ⚠️ 偏蓝灰，不一致 |
| 绿色主色 | `#07c160` | 全局 | ✅ 一致 |
| 绿色渐变 | `#06ae56` | 按钮 | ✅ 一致 |

**结论**：没有统一的颜色变量系统，颜色值散落在各处。

---

### 问题5：间距（Spacing）无规律

| 位置 | padding | margin-bottom | 问题 |
|--------|---------|---------------|------|
| app.wxss 容器 | `30rpx` | - | - |
| step1 容器 | `40rpx 32rpx` | - | ⚠️ 不一致 |
| step3 容器 | `40rpx 32rpx` | - | ✅ 与step1一致 |
| result 容器 | `0` | - | ⚠️ 完全不一样 |
| 表单项间距 | `36rpx` | - | ✅ app.wxss定义 |
| step1 表单项 | - | `36rpx` | ✅ 一致 |
| step3 表单项 | - | `32rpx` | ⚠️ 不一致 |

**结论**：间距没有基于某个基础单位（比如8rpx）的倍数来设计。

---

### 问题6：组件重复定义（代码冗余）

| 组件 | 重复位置 | 问题 |
|--------|----------|------|
| `.progress` 进度指示器 | `step1.wxss` + `step3.wxss` | 完全重复定义 |
| `.page-title` 页面标题 | `step1.wxss` + `step3.wxss` | 完全重复定义 |
| `.page-desc` 页面副标题 | `step1.wxss` + `step3.wxss` | 完全重复定义 |
| `.form-group` 表单项 | `app.wxss` + `step1.wxss` + `step3.wxss` | 重复定义 |

**结论**：应该抽取到 `app.wxss` 作为全局样式，页面样式只写差异部分。

---

## 二、改进方案：建立统一设计系统 🎨

### 方案概述

```
目标：建立一套统一的设计系统（Design System）
方法：在 app.wxss 中定义设计变量 + 统一组件样式
结果：所有页面自动保持一致的外观
```

---

### 改进1：建立字体排版系统（Typography Scale）

**当前问题**：字体大小随意  
**改进方案**：定义明确的字号层级

```css
/* app.wxss - 添加到文件顶部 */

/* ========== 设计变量（通过 class 实现） ========== */

/* 字体大小系统（基于 2rpx 递增，关键值突出） */
.text-xxl  { font-size: 48rpx; }  /* 品牌名 */
.text-xl   { font-size: 40rpx; }  /* 结果页总金额 */
.text-lg   { font-size: 36rpx; }  /* 页面标题 */
.text-base { font-size: 32rpx; }  /* 按钮文字、重要数值 */
.text-md   { font-size: 30rpx; }  /* 表单标签、正文 */
.text-sm   { font-size: 28rpx; }  /* 说明文字 */
.text-xs   { font-size: 24rpx; }  /* 辅助信息 */
.text-xxs  { font-size: 20rpx; }  /* 底部声明 */
```

**实施步骤**：
1. 在 `app.wxss` 顶部添加以上 class
2. 所有页面统一使用这些 class，不再硬写 `font-size`

---

### 改进2：统一按钮样式

**当前问题**：`app.wxss` 定义的是方角按钮，实际页面用的是全圆角  
**改进方案**：统一为全圆角（更符合微信小程序风格）

```css
/* app.wxss - 修改 .btn-primary 和 .btn-secondary */

.btn-primary {
  background: linear-gradient(135deg, #07c160 0%, #06ae56 100%);
  color: #fff;
  border: none;
  border-radius: 50rpx;  /* 改：12rpx → 50rpx */
  padding: 28rpx 0;
  font-size: 34rpx;
  font-weight: 600;      /* 改：500 → 600 */
  width: 100%;
  box-shadow: 0 8rpx 24rpx rgba(7,193,96,0.3);  /* 新增阴影 */
}

.btn-secondary {
  background: #fff;
  color: #07c160;
  border: 2rpx solid #07c160;
  border-radius: 50rpx;  /* 改：12rpx → 50rpx */
  padding: 28rpx 0;
  font-size: 34rpx;
  font-weight: 600;
  width: 100%;
}
```

**实施步骤**：
1. 修改 `app.wxss` 中的按钮样式
2. 修改各页面按钮，统一使用 `app.wxss` 的 `.btn-primary` 和 `.btn-secondary`

---

### 改进3：统一选择器（Picker）样式

**当前问题**：`app.wxss` 和 `step1.wxss` 的选择器样式完全不同  
**改进方案**：统一为 `step1.wxss` 的样式（浅灰背景+选中变白+绿色边框）

```css
/* app.wxss - 修改 .picker-box */

.picker-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx;    /* 改：24rpx 30rpx → 28rpx 28rpx */
  border-radius: 16rpx;       /* 改：12rpx → 16rpx */
  font-size: 30rpx;
  background: #f7f8fa;        /* 改：#fff → #f7f8fa */
  border: 2rpx solid transparent;  /* 改：#e0e0e0 → transparent */
  color: #333;
  position: relative;
  transition: all 0.3s;
}

.picker-box.selected {
  color: #1a1a1a;
  background: #fff;
  border-color: #07c160;
  box-shadow: 0 2rpx 12rpx rgba(7,193,96,0.08);
}

.picker-box.placeholder {
  color: #bbb;
}
```

**实施步骤**：
1. 修改 `app.wxss` 中的 `.picker-box`
2. 删除 `step1.wxss` 中的 `.picker-value`（改用全局样式）

---

### 改进4：建立统一颜色系统

**当前问题**：颜色值散落各处，没有变量  
**改进方案**：在 `app.wxss` 顶部定义颜色变量（通过注释说明）

```css
/* ========== 颜色系统 ========== */

/* 主色 */
/* 绿色：#07c160（主按钮、激活状态） */
/* 绿色渐变：#06ae56（按钮渐变终点） */

/* 文字色 */
/* 主文字：#1a1a1a（标题、重要文字） */
/* 次文字：#666（正文） */
/* 辅助文字：#999（占位符、禁用状态） */
/* 链接/强调：#07c160（绿色） */

/* 背景色 */
/* 页面背景：#f5f5f5（浅灰） */
/* 卡片背景：#fff（白色） */
/* 输入框背景：#f7f8fa（浅灰蓝） */

/* 边框色 */
/* 默认边框：#e0e0e0 */
/* 激活边框：#07c160（绿色） */

/* 功能色 */
/* 成功：#07c160 */
/* 警告：#ffc107 */
/* 错误：#e74c3c */
/* 信息：#1890ff */
```

**实施步骤**：
1. 在 `app.wxss` 顶部添加颜色系统注释
2. 全局搜索所有颜色值，替换为统一的值

---

### 改进5：建立间距系统（基于 8rpx）

**当前问题**：间距没有规律  
**改进方案**：基于 8rpx 基础单位，定义间距 class

```css
/* app.wxss - 添加间距系统 */

/* ========== 间距系统（基于 8rpx） ========== */
.space-xs  { margin: 8rpx; }   /* 8rpx */
.space-sm  { margin: 16rpx; }  /* 16rpx */
.space-md  { margin: 24rpx; }  /* 24rpx */
.space-lg  { margin: 32rpx; }  /* 32rpx */
.space-xl  { margin: 48rpx; }  /* 48rpx */
.space-xxl { margin: 64rpx; }  /* 64rpx */

/* 容器内边距统一 */
.container-padding { padding: 40rpx 32rpx; }  /* 所有步骤页统一 */
```

**实施步骤**：
1. 在 `app.wxss` 中添加间距 class
2. 所有页面统一使用 `container-padding`

---

### 改进6：消除组件重复定义

**当前问题**：`.progress`、`.page-title` 等在多个文件重复定义  
**改进方案**：抽取到 `app.wxss`

```css
/* app.wxss - 添加进度指示器（从 step1/step3 抽取） */

/* 进度指示器 */
.progress {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 48rpx;
}
.progress-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background: #e0e0e0;
}
.progress-dot.active,
.progress-dot.done {
  background: #07c160;
}
.progress-line {
  width: 80rpx;
  height: 4rpx;
  background: #e0e0e0;
  margin: 0 12rpx;
}
.progress-line.active,
.progress-line.done {
  background: #07c160;
}

/* 页面标题（从 step1/step3 抽取） */
.step-header {
  text-align: center;
  margin-bottom: 56rpx;
}
.step-title {
  display: block;
  font-size: 44rpx;
  font-weight: bold;
  color: #1a1a1a;
}
.step-subtitle {
  display: block;
  font-size: 26rpx;
  color: #999;
  margin-top: 12rpx;
}
```

**实施步骤**：
1. 在 `app.wxss` 中添加 `.progress` 和 `.step-header`
2. 删除 `step1.wxss` 和 `step3.wxss` 中的重复定义
3. 修改 `step1.wxml` 和 `step3.wxml`，使用统一的 class 名

---

## 三、实施计划 📋

### 阶段A：建立设计系统（在 app.wxss 中）

| 任务 | 内容 | 预计耗时 |
|------|------|----------|
| A1 | 添加字体排版系统（7个 class） | 15分钟 |
| A2 | 修改按钮样式（统一为全圆角） | 10分钟 |
| A3 | 修改选择器样式（统一为浅灰背景） | 10分钟 |
| A4 | 添加颜色系统注释 | 5分钟 |
| A5 | 添加间距系统（6个 class） | 10分钟 |
| A6 | 添加进度指示器和页面标题组件 | 15分钟 |
| **小计** | | **65分钟** |

---

### 阶段B：修改各页面（应用统一设计系统）

| 任务 | 内容 | 预计耗时 |
|------|------|----------|
| B1 | **首页**：修改按钮样式，应用字体系统 | 15分钟 |
| B2 | **步骤1**：删除重复定义，应用全局样式 | 20分钟 |
| B3 | **步骤2**：补充缺失的样式（当前只有 retirement-preview） | 20分钟 |
| B4 | **步骤3**：删除重复定义，应用全局样式 | 20分钟 |
| B5 | **结果页**：统一按钮样式，应用字体系统 | 20分钟 |
| **小计** | | **95分钟** |

---

### 阶段C：真机测试验证

| 任务 | 内容 | 预计耗时 |
|------|------|----------|
| C1 | 真机测试5个典型案例 | 30分钟 |
| C2 | 检查所有页面样式是否一致 | 15分钟 |
| **小计** | | **45分钟** |

---

## 四、总预估时间 ⏱️

```
阶段A（建立设计系统）：65分钟
阶段B（修改各页面）：  95分钟
阶段C（真机测试）：    45分钟
--------------------------------
总计：                 205分钟（约3.5小时）
```

---

## 五、交付物清单 📦

| 交付物 | 路径 | 说明 |
|--------|------|------|
| 设计系统说明 | `docs/06-UI设计/设计系统-v1.0.md` | 颜色、字体、间距规范 |
| 改进后 app.wxss | `miniprogram/app.wxss` | 统一样式 |
| 改进后各页面 wxss | `miniprogram/pages/*/*.wxss` | 应用统一设计系统 |
| UI一致性测试报告 | `docs/05-测试/UI一致性测试报告.md` | 测试验证结果 |

---

## 六、建议执行顺序 🎯

### 选项A：完整执行（推荐）✅
**内容**：执行阶段A+B+C（完整建立设计系统）  
**优点**：一次性解决所有一致性问题，后续开发效率高  
**缺点**：耗时较长（约3.5小时）  
**适合**：要长期维护这个项目，或者要加很多新功能  

---

### 选项B：快速修复（部分执行）⚡
**内容**：只执行阶段A（建立设计系统），暂不修改各页面  
**优点**：快速建立规范，后续开发按规范来  
**缺点**：现有页面还是不一致，需要后续慢慢改  
**适合**：时间紧，先建立规范，后续逐步优化  

---

### 选项C：只改关键页面（针对性执行）🎯
**内容**：只改首页和结果页（用户看到最多的两个页面）  
**优点**：快速提升关键页面的观感  
**缺点**：步骤页还是不一致  
**适合**：急着发布，先优化关键页面  

---

## 七、我的建议 💬

**选选项A（完整执行）**，因为：

1. ✅ 这个项目你已经投入了大量时间（Phase 1-4 + UI抛光）
2. 🚀 建立设计系统后，后续如果有新功能，开发速度会更快
3. 💎 UI一致性对小程序审核通过率有帮助（苹果风格指南）
4. 📝 我可以帮你**批量修改**，不用手动一个一个改

---

**你想怎么做？直接告诉我就行！** 💪

1. **"执行完整方案（选项A）"** → 我立即开始建立设计系统 + 修改所有页面
2. **"先建立设计系统（选项B）"** → 我先建立规范，页面慢慢改
3. **"只改关键页面（选项C）"** → 我优先改首页和结果页
4. **"看看详细的设计系统规范"** → 我展开说明颜色、字体、间距的具体数值

**我随时准备开始！** 🎨🔥

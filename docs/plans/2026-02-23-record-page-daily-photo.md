# 记录页重构 + 每日体型照（NocoDB Attachment）实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 把首页重构为可按天查看的记录流，展示每餐食物明细，并新增每日体型照记录能力（可选）。

**Architecture:** 采用“首页记录聚合 + 记录页快捷入口 + WeightRecords 扩展字段”的方案。记录数据继续沿用 Food/Water/Exercise/Weight 表，体型照存入 WeightRecords.photo（Attachment），以 date 作为逻辑唯一键并由代码 upsert 维护。首页通过所选日期统一拉取并渲染当日卡片。

**Tech Stack:** Next.js App Router, React, Zustand, NocoDB REST API (v2 + v3 attachment upload), Playwright。

## 功能需求与约束

1. 首页 `/` 重构为记录页（结构对齐截图信息层级）：
   - 顶部日期标题（今天/历史日期）
   - 一周日期条（周一到周日，可切换周并选择日期）
   - 能量环、营养块
   - 每餐记录卡片（早餐/午餐/晚餐/加餐）
   - 运动卡片
   - 体型照卡片
2. 每餐卡片必须显示该餐已记录食物明细（名称、数量、热量）。
3. 每日记录可查看：切换日期后刷新当天记录。
4. 每餐目标热量规则固定：早餐25%、午餐35%、晚餐30%、加餐10%，展示为 `已摄入 X/Y 千卡`。
5. 新增每日体型照记录：可选上传，保存在 NocoDB `WeightRecords.photo`（Attachment）。
6. 每天仅保留最新1张体型照（再次上传时覆盖旧图）。
7. 快捷记录页新增“体型照记录”入口，跳转 `/record/photo`。
8. 保留现有全局底部导航，不替换为餐次底栏。

## 任务分解

### Task 0: 文档先行

**Files:**
- Create: `docs/plans/2026-02-23-record-page-daily-photo.md`

**Step 1:** 将需求、约束、数据模型和任务分解写入计划文档。

### Task 1: 数据层扩展（WeightRecords.photo）

**Files:**
- Modify: `src/services/recordService.ts`
- Modify: `src/lib/nocodb.ts`
- Modify: `src/store/useRecordStore.ts`

**Step 1: 定义类型与接口**
- 扩展 `WeightRecord` 增加附件类型字段。
- 增加 `getWeightRecordByDate(date)`。
- 增加 `upsertWeightRecord(data)`。
- 增加 `uploadWeightPhoto(date, file)`。
- 增加 `clearWeightPhoto(date)`。

**Step 2: Attachment 上传能力**
- 在 `nocodb.ts` 增加 `resolveFieldIdByTitle(tableTitle, fieldTitle)`。
- 通过 v3 上传接口 `POST /api/v3/data/{baseId}/{tableId}/records/{recordId}/fields/{fieldId}/upload` 上传文件。

**Step 3: Store 状态扩展**
- 增加 `weightRecordsByDate`。
- 增加 `fetchWeightRecordByDate(date)`。
- 增加 `saveWeightPhoto(date, file)`。
- 增加 `removeWeightPhoto(date)`。

### Task 2: NocoDB 初始化脚本

**Files:**
- Modify: `scripts/init-nocodb.js`

**Step 1:** 确保 `WeightRecords` 存在 `photo: Attachment` 字段（已存在则跳过）。

### Task 3: 体型照记录页面

**Files:**
- Create: `src/app/record/photo/page.tsx`

**Step 1:** 页面基础 UI
- 标题、返回按钮、上传入口。

**Step 2:** 上传流程
- 选图后预览。
- 保存时调用 `saveWeightPhoto(today, file)`。
- 成功后返回首页。

**Step 3:** 覆盖与移除
- 若当日已有照片，支持“重新上传”与“移除照片”。

### Task 4: 快捷记录入口

**Files:**
- Modify: `src/app/record/page.tsx`
- Modify: `src/components/dashboard/FloatingActionButton.tsx`

**Step 1:** 新增“体型照记录”入口到 `/record/photo`。

### Task 5: 首页重构为记录流

**Files:**
- Modify: `src/app/page.tsx`

**Step 1:** 新增日期选择状态与周切换逻辑。

**Step 2:** 根据所选日期拉取：
- food/water/exercise
- daily photo

**Step 3:** 渲染卡片区：
- 每餐卡片（展示食物明细）
- 运动卡片
- 体型照卡片

**Step 4:** 餐次目标计算
- 使用固定比例与 `target_calories` 计算 Y。

### Task 6: 测试与回归

**Files:**
- Modify: `tests/mvp-docs.spec.ts`

**Step 1:** 增加首页记录流与体型照入口相关用例。

**Step 2:** 覆盖关键场景
- 首页存在餐次卡片标题
- 记录页存在体型照入口
- 体型照页面可访问

**Step 3:** 跑回归
- `npx playwright test tests/mvp-docs.spec.ts`

## 验收标准

1. 首页可按日期查看每日记录。
2. 每餐卡片显示食物明细与 `已摄入 X/Y 千卡`。
3. 快捷记录可进入体型照记录页面。
4. 当日体型照可上传、覆盖、移除，且历史日期可查看。
5. 现有关键用例无回归。

## 假设与默认值

1. 视觉目标是“结构和信息层级一致”，不追求像素级还原。
2. 体型照存 NocoDB Attachment。
3. 每日仅保留最新 1 张。
4. 不新增餐次比例配置项。
5. 保留当前全局底部导航体系。

# FitPlus 项目文档阅读规则

## 项目概述
FitPlus 是一款三分化（Push/Pull/Legs）训练记录 App，基于 React + TypeScript + Vite 构建，数据存储在 localStorage，部署在 GitHub Pages。

## 文档库位置
飞书云空间：https://rcnf2iyzif3o.feishu.cn/drive/folder/Ot0pfJk7rlJl2NdmkNTcPKzynVg

## 文档结构
```
📁 FitPlus 项目文档
├── 📄 FitPlus - 项目文档目录（目录索引，必须首先阅读）
├── 📁 01-需求文档
│   ├── FitPlus - V1.0 需求文档
│   ├── FitPlus - V1.1 需求文档
│   └── FitPlus - V1.2.0 需求文档（当前最新）
├── 📁 02-设计文档
│   └── FitPlus - UI/UE 设计规范
├── 📁 03-技术文档
│   └── FitPlus - 数据文档
└── 📁 04-测试文档
    ├── FitPlus - V1.1 测试用例
    ├── FitPlus - V1.1 测试报告
    ├── FitPlus - V1.2.0 测试用例（当前最新）
    └── FitPlus - V1.2.0 测试报告（当前最新）
```

## 阅读规则

### 规则 1：版本优先级
- 始终优先阅读最新版本（V1.2.0）的文档
- 历史版本文档仅在做版本对比或回溯问题时参考
- 需求变更以最新版本需求文档为准，历史版本中已废弃的需求不再适用

### 规则 2：文档阅读顺序
开发新功能或修复 BUG 时，按以下顺序阅读：
1. **目录索引** → 了解整体文档结构
2. **最新需求文档**（01-需求文档/V1.2.0）→ 理解功能需求
3. **UI/UE 设计规范**（02-设计文档）→ 确认视觉和交互标准
4. **数据文档**（03-技术文档）→ 了解数据模型和存储结构
5. **最新测试用例**（04-测试文档/V1.2.0）→ 了解已有测试覆盖

### 规则 3：文档命名规范
所有文档标题统一格式：`FitPlus - [版本号] [文档类型]`
- 版本号：V1.0 / V1.1 / V1.2.0
- 文档类型：需求文档 / 测试用例 / 测试报告 / 设计规范 / 数据文档
- 新增文档时必须遵循此命名规范

### 规则 4：需求变更流程
1. 在最新版本需求文档中追加新需求章节（标注日期）
2. 同步更新测试用例文档
3. 开发完成后更新测试报告
4. 更新目录索引文档（如有新文档加入）

### 规则 5：BUG 记录规范
- BUG 统一记录在测试用例文档中，格式为 `BUG-XXX`
- 严重程度：严重 / 一般 / 轻微
- 必须包含：问题描述、复现步骤、根因分析、修复方案、验证方式

### 规则 6：代码仓库
- GitHub：https://github.com/CrazyDave0514/ppl-training
- 分支策略：main（正式环境）
- Commit 规范：Conventional Commits（feat/fix/docs/style/refactor）

## 关键文档链接
- [目录索引](https://rcnf2iyzif3o.feishu.cn/docx/Pq6nd2c3Io0piDxuy3McuzX3nHf)
- [V1.2.0 需求文档](https://rcnf2iyzif3o.feishu.cn/docx/UbmAd572uonj9FxjL8ncAOemn15)
- [V1.2.0 测试用例](https://rcnf2iyzif3o.feishu.cn/docx/Rt3mdlVH2ocpeOxn2YEcdIQJnvh)
- [UI/UE 设计规范](https://rcnf2iyzif3o.feishu.cn/docx/SUyYd7EppoSETQxBfnncDV77nCe)
- [数据文档](https://rcnf2iyzif3o.feishu.cn/docx/HOLkduoUGo3V9Ex5oyrcKBBMn5b)

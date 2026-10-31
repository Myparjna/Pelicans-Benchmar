# 交接文档生成计划（handoff-plan）

- 项目根目录：`C:\Users\mypra\Desktop\VibeCoding指南\skills测评项目\03-鹈鹕自行车测试`
- 模式：**update**（用户通过 --intent update 显式指定）
- 受众级别：`developer`

## 文档清单

| 文档 | 动作 | 必需 | 原因 | focus |
|---|---|---|---|---|
| `readme.md` | **generate** | 是 | 门禁必需文档 | 30 秒看懂项目 + 快速启动 + 速查卡；待确认问题全部汇总到顶部 |
| `usage.md` | **generate** | 是 | 门禁必需文档 | 从真实用户角色出发的核心业务流程，启动不等于使用 |
| `architecture.md` | **generate** | 是 | 门禁必需文档 | 系统架构、模块职责、数据流、真实调用链、技术选型与扩展点 |
| `environment.md` | **generate** | 是 | 门禁必需文档 | 每个变量的用途/获取方式/必需性/泄露影响，不遗漏、不写真实值 |
| `deployment.md` | **generate** | 是 | 门禁必需文档 | 部署命令、域名/DNS、资源与账号归属、CI/CD |
| `operations.md` | **generate** | 是 | 门禁必需文档 | 日常维护、监控日志、适用的故障处置与回滚 |
| `regression-test.md` | **generate** | 是 | 门禁必需文档 | 区分检测到/已执行/已通过，写清测试缺口 |
| `known-issues.md` | **generate** | 是 | 门禁必需文档 | 宁可多写不可隐瞒：Bug、半成品功能、技术债 |
| `ai-services.md` | **generate** |  | 检测到：AI SDK/API 或模型线索 | AI API 的调用点、模型、计费限额与降级行为 |
| `api.md` | **skip** |  | 未检测到相关事实，跳过 | 接口清单以扫描为准，鉴权方式读源码确认 |
| `database.md` | **skip** |  | 未检测到相关事实，跳过 | 数据模型、迁移流程、备份恢复命令 |
| `desktop.md` | **skip** |  | 未检测到相关事实，跳过 | 构建打包命令、代码签名与自动更新现状 |

## 扫描范围

- 文件总数：4843，实际扫描：665
- .handoff.yml 额外跳过目录：无
- 扫描完整，无需调整范围。

## 执行要求

- 本计划根据扫描事实自动采用；AI 快速检查模式、文档清单和扫描范围后直接继续，不等待用户确认。
- 如确需定制，用户可在运行 generate_handoff.py 前编辑 plan 文件中的 action/focus。
- generate_handoff.py 会读取本计划并跳过 action=skip 的文档。
- required=true 的文档是门禁硬要求，跳过会导致 verify 失败。
- update 模式下本计划只判定模式与缺失文档；具体章节影响仍以 compare_handoff.py 的更新建议为准。

> 本计划默认直接进入生成流程；如需手工裁剪文档或调整 focus，请在运行 generate_handoff.py 前编辑
> `project-handoff-plan.json` 中的 action/focus。

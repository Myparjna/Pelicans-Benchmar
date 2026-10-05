---
document: regression-test.md
generated: 2026-10-06 00:46
client_level: developer
---

# 回归测试说明

## 测试现状

- 测试配置: 未检测到（无 jest/vitest/pytest 配置）
- 测试目录: 未检测到
- 测试文件数: 0

项目**没有任何自动化测试**。质量保障全部靠：一次性 CDP 脚本（真实浏览器模拟操作）+ 无头 Chrome 截图 + 线上 `curl` 校验。这些脚本写在 `03-TempScr/`，命名带日期，按需改后运行，不是可持续回归套件。

⚠️ 下文区分「检测到」「已执行」「执行通过」：只有标注**已执行并通过**的才是真跑过的。

## 回归范围

| 业务流程/模块 | 风险 | 验证方式 | 通过标准 | 证据位置 |
|---|---|---|---|---|
| 展厅渲染（45 卡片、分类顺序、并列 band） | 高 | 无头 Chrome dump-dom + 整页截图 | section 数=10、merged-band=4、标题顺序与配置一致 | `02-TempFiles/reorder-full.png`、`02-TempFiles/reorder-lower.png` |
| 缩略图（png/webp） | 高 | 线上逐个校验 `content-type` | 全部 `image/png` / `image/webp`（状态码 200 不可信） | 部署后 curl 抽查 |
| 打分与卡片同步 | 高 | CDP 合成点击：查看器打分 → 关闭 → 读卡片分数 | 卡片分数与查看器一致，刷新后保持 | `03-TempScr/10月5日-2110-展厅查看器交互校验.js`（已执行并通过） |
| 查看器二次打开 / 连续翻页预加载 | 中高 | CDP 脚本 | 二次打开不串页、翻页命中预加载帧 | `03-TempScr/10月5日-2120-查看器二次打开复测.js`（已执行并通过） |
| 分类筛选与搜索 | 中 | 人工点击 | chip 过滤正确、搜索命中 | 人工验证（无脚本留存） |
| 数据完整性 | 高 | Node 载入 `sites-data.js` 核对文件存在性 | 条目数 45、缺失文件 0 | `03-TempScr/10月5日-2335-本次改动冒烟.js`（已执行并通过） |
| 部署产物 | 高 | 线上 curl 校验首页计数、数据条数、资源 content-type | 计数 45、`"slug"` 45、图片类型正确 | 每次部署后执行 |

## 自动化测试

```bash
# 无自动化测试套件可跑。下面的命令是「已实际执行过」的等价校验步骤（在项目根目录执行）：

# 1) 静态语法检查（已执行并通过，最近一次 2026-10-06 00:2x）
"C:/Users/mypra/.workbuddy/binaries/node/versions/22.22.2-6/node.exe" --check assets/app.js

# 2) 数据完整性：条目数与资源文件存在性（已执行并通过，45 条 / 缺失 0）
"C:/Users/mypra/.workbuddy/binaries/node/versions/22.22.2-6/node.exe" -e "
global.window={}; const fs=require('fs');
eval(fs.readFileSync('sites-data.js','utf8'));
const s=window.SITES;
console.log(s.length, s.filter(x=>!fs.existsSync(x.src)||!fs.existsSync(x.thumb)).length);
"

# 3) XML/结构校验（未执行）：当前没有 HTML 校验命令，靠浏览器渲染无报错间接保证
```

- 执行日期：2026-10-05 至 2026-10-06（多次迭代）。
- 结果：上述 1、2 通过；第 3 项未执行。
- CDP 校验脚本（`03-TempScr/10月5日-2110/2120/2125/2335-*`）在 Chrome 9303 端口实例上执行并通过，脚本本身仍在目录里可重跑（需先起本地服务并手动启动带 `--remote-debugging-port=9303` 的 Chrome）。

## 人工与真实软件验证

| 步骤 | 预期结果 | 实际结果 | 证据 |
|---|---|---|---|
| 本地起服务打开首页 | 45 张卡片、无裂图、分类顺序正确 | 通过 | `02-TempFiles/reorder-full.png`（1440×5600 整页） |
| 点击卡片打开查看器 | iframe 加载原页面；红色关闭按钮；序号 `n / 45` | 通过 | `02-TempFiles/viewer-open-功能验收.png` |
| 查看器打分 7 → 改 9 → 关闭 | 展厅卡片同步显示 9 | 通过（修复后） | 2110 脚本输出 |
| 连续翻页 3 次 | 命中预加载帧、无白屏 | 通过 | 2120 脚本输出 |
| 移动端竖屏 390×844 | 单列、无横向溢出 | 通过（较早批次验证） | `02-TempFiles/mobile-390x844.png` |
| 线上首页与数据 | 计数 45、`sites-data.js` 45 条 | 通过 | curl 输出 |

## 测试数据与环境

- 浏览器：系统 Chrome（`C:\Program Files\Google\Chrome\Application\chrome.exe`），无头模式 `--headless=new`。
- 调试端口：9303（本项目惯用；9300/9302 常被其他项目占用，用前先探测）。
- 本地服务：`python -m http.server 8137 --bind 127.0.0.1`（跑脚本前先 curl 探活，临时服务会随终端退出）。
- 运行时：托管 Node 22.22.2-6、托管 Python 3.13（venv 含 Pillow）。
- 测试数据：`sites-data.js` 45 条真实数据；评分基线 `C:/Users/mypra/Desktop/peilika-ratings-2026-10-05.json`（不含密钥）。
- 备份：改动前会 `cp sites-data.js 02-TempFiles/sites-data.backup*.js`。

## 发布前最小回归清单

- [ ] `node --check assets/app.js` 通过
- [ ] 数据完整性脚本：条目数正确、缺失文件 0
- [ ] 本地起服务，首页卡片数 = 数据条数，无裂图
- [ ] 分类顺序与并列 band 与配置一致（dump-dom 或截图）
- [ ] 打开任一查看器：能加载、翻页正常、Esc 关闭、红色按钮在位
- [ ] 打分 → 关闭 → 卡片同步；刷新页面评分仍在
- [ ] 移动端视口（390×844）无横向溢出
- [ ] 部署：`bash OpsDev/deploy-pages.sh` 成功
- [ ] 线上校验：首页计数、`sites-data.js` 条数、`thumbs/*.webp` 的 `content-type`
- [ ] 回滚预案：记住上一个正常部署 ID（控制台 Rollback）
- [ ] `git commit` 涉及文件

## 已知测试缺口

- **无自动化回归套件**：所有验证都是一次性脚本/人工，改动后不能一键回归。建议补一个统一的 `node 03-TempScr/regress.js`（起服务 + CDP 跑核心流程 + 断言）。
- **未覆盖**：键盘操作（←/→/Esc 的完整路径）、评分导出/导入 JSON 的一致性、搜索与筛选的边界（空结果、特殊字符）、iframe 内页面自身报错。
- **无法在本机验证**：Cloudflare 生产环境行为（边缘缓存生效时间、真实用户网络下的 CDN 图标加载）。
- **模型产出页面自身质量**未做自动检查（只人工看截图），各页面可能自带 JS 错误或外链失效。
- **缩略图生成未纳入回归**：重跑脚本后只人工抽查几张，没有批量尺寸/帧数校验。

---
description: IM 项目 Git 提交信息规范
---

# Git Commit 提交规范

所有 Git 提交必须遵循以下格式：

## 提交格式

```
<类型>(<范围>): <描述>

[可选的正文]

[可选的脚注]
```

## 类型 (Type)

| 类型 | 描述 |
|------|------|
| `feat` | 新增功能 |
| `fix` | 修复缺陷 |
| `docs` | 文档变更 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构（不增加功能，不修复缺陷） |
| `perf` | 性能优化 |
| `test` | 添加测试 |
| `chore` | 构建过程或辅助工具变动 |
| `init` | 初始化项目 |
| `build` | 打包构建 |

## 范围 (Scope)

- `client` - 前端相关
- `server` - 后端相关
- `db` - 数据库相关
- `auth` - 认证相关
- `chat` - 聊天功能
- `friends` - 好友功能
- `upload` - 文件上传
- `socket` - WebSocket相关
- `deploy` - 部署相关
- `*` - 多个范围时使用

## 示例

```bash
# 新增功能
git commit -m "feat(chat): 添加消息已读状态显示"

# 修复缺陷
git commit -m "fix(auth): 修复令牌过期检查问题"

# 文档更新
git commit -m "docs(readme): 更新安装指南"

# 初始化
git commit -m "init: 项目初始化，React + Node.js + SQLite"

# 代码重构
git commit -m "refactor(server): 将数据库查询提取到模型层"

# 多范围
git commit -m "feat(*): 实现聊天和头像的图片上传功能"
```

## 规则

1. **描述** 不超过50个字符
2. **描述** 使用中文，简洁明了
3. **正文** 用于详细描述变更内容（可选）
4. **脚注** 用于关联 Issue 或说明破坏性变更（可选）

## 带正文的示例

```bash
git commit -m "feat(chat): 实现群聊功能

- 添加群组创建接口
- 添加群成员管理功能
- 添加群消息广播机制

关联 #12"
```

---
description: IM 项目代码规范
---

# 代码规范

## 语言规范

### 界面语言
- **所有用户界面文本必须使用中文**
- 包括：按钮、标签、提示信息、占位符、错误消息等
- 示例：`登录` 而非 `Login`，`请输入用户名` 而非 `Enter username`

### 代码注释
- 代码注释使用**中文**
- 复杂逻辑必须添加注释说明

### 控制台日志
- 可使用英文或中文，建议保持统一

## 命名规范

### 文件命名
- 组件文件：PascalCase，如 `Login.jsx`, `ChatMessage.jsx`
- 工具文件：camelCase，如 `api.js`, `socket.js`
- 样式文件：kebab-case 或与组件同名

### 变量命名
- 使用 camelCase：`userName`, `messageList`
- 常量使用 UPPER_SNAKE_CASE：`API_BASE`, `MAX_FILE_SIZE`
- 组件使用 PascalCase：`ChatBubble`, `UserAvatar`

### 函数命名
- 处理函数：`handle` + 动作，如 `handleSubmit`, `handleClick`
- 加载函数：`load` + 资源，如 `loadMessages`, `loadUsers`
- API 调用：动词 + 名词，如 `getUsers`, `sendMessage`

## 组件规范

### React 组件结构
```jsx
// 1. 导入语句
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. 组件定义
export default function ComponentName() {
  // 3. 状态声明
  const [state, setState] = useState('');
  
  // 4. 副作用
  useEffect(() => {
    // 初始化逻辑
  }, []);
  
  // 5. 事件处理函数
  const handleAction = () => {
    // 处理逻辑
  };
  
  // 6. 渲染
  return (
    <div>
      {/* JSX 内容 */}
    </div>
  );
}
```

### 样式规范
- 优先使用 CSS 变量：`var(--text-primary)`
- 颜色、间距等使用预定义变量
- 避免内联样式，除非必要

## API 规范

### 请求格式
- RESTful 风格
- URL 使用小写和连字符：`/api/ai/start-chat`
- 请求体使用 camelCase

### 响应格式
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误处理
```json
{
  "error": "错误描述"
}
```

## 数据库规范

### 表命名
- 使用复数形式：`users`, `messages`, `friendships`
- 小写加下划线：`conversation_members`

### 字段命名
- 使用 snake_case：`user_id`, `created_at`
- 布尔字段使用 `is_` 前缀：`is_ai`, `is_read`
- 时间字段使用 `_at` 后缀：`created_at`, `updated_at`

## Git 提交规范

参见 `/git-commit` 工作流文件

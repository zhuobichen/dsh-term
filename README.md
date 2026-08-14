# dsh-term

终端版 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) —— 像 Claude Code 一样住在终端的 AI 编码助手。

在终端里与 Harness 的编码 agent 持续对话，agent 能读取文件、执行 shell 命令、编辑代码。

## 特性

- 🖥️ 终端 REPL：`dsh-term` 命令直接进入交互式对话
- 🔁 多轮对话：自动携带对话历史，`/new` 随时开新会话
- 📁 文件 + 命令：agent 可读文件、跑命令、写代码
- 🚀 零额外运行时：复用全局安装的 DeepSeek Harness（headless 模式）

## 安装

要求 Node.js >= 22，以及已全局安装 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness)：

```sh
npm install -g @deepseek-ai/dsh

git clone <repo-url>
cd dsh-term
npm install
npm run build
```

## 使用

```sh
# 设置凭据（也可用 .env 或导出到 shell）
export DEEPSEEK_API_KEY=sk-...

npm start
```

进入后：

```
dsh-term — 终端版 DeepSeek Harness
❯ 看一下当前目录有哪些文件
❯ /new        # 新会话
❯ /quit       # 退出
```

## 内置命令

| 命令 | 说明 |
|------|------|
| `/help` | 显示帮助 |
| `/new` | 清空上下文、开始新会话 |
| `/quit` | 退出（等价 `/exit`） |

## 环境变量

| 变量 | 用途 | 默认 |
|------|------|------|
| `DEEPSEEK_API_KEY` | API 凭据 | 必填 |
| `DEEPSEEK_BASE_URL` | OpenAI 兼容代理端点 | DeepSeek 官方 |
| `DSH_MODEL` | 模型 | Harness 默认 |
| `DSH_CWD` | agent 工作目录 | 当前目录 |
| `DSH_RUNTIME` | dsh 运行时入口路径 | 全局 npm 安装位置 |

## 原理

`src/cli.ts` 用 `readline` + `chalk` 提供终端交互界面，每次把对话历史拼进提示词，通过 Harness 的 `headless` 模式（`dsh --profile headless "<prompt>"`）驱动编码 agent 执行。

## License

MIT

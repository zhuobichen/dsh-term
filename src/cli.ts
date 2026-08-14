#!/usr/bin/env node
/**
 * dsh-term —— 终端版 DeepSeek Harness
 * 像 Claude Code 一样住在终端：交互式 REPL + 多轮对话 + 读文件/跑命令/写代码。
 *
 * 原理：复用全局安装的 DeepSeek Harness（dsh CLI）的 headless 模式，
 * 每次把对话历史拼进提示词，让 agent 在终端里持续对话。
 */
import { spawn } from 'node:child_process'
import readline from 'node:readline/promises'
import chalk from 'chalk'
import path from 'node:path'

interface Turn {
  role: 'user' | 'assistant'
  text: string
}

/** 全局 npm 安装的 dsh 运行时入口（node 直接跑，绕开 Windows 上 spawn 找不到 shim 的问题）。 */
const DSH_RUNTIME =
  process.env.DSH_RUNTIME ??
  path.join(process.env.APPDATA ?? '', 'npm', 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')

function runHeadless(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [DSH_RUNTIME, '--profile', 'headless', prompt], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d: Buffer) => {
      stdout += d.toString()
    })
    child.stderr.on('data', (d: Buffer) => {
      stderr += d.toString()
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(stderr.trim() || `dsh 退出码 ${code}`))
    })
  })
}

function buildPrompt(input: string, history: Turn[]): string {
  if (history.length === 0) return input
  const lines = history.map((t) => (t.role === 'user' ? `用户：${t.text}` : `助手：${t.text}`))
  return `以下是我们的对话历史，请基于它回答最后的问题。\n\n${lines.join('\n')}\n\n用户：${input}`
}

function printHelp(): void {
  console.log(chalk.gray(`
内置命令：
  /help    显示本帮助
  /new     清空上下文、开始一个新会话
  /quit    退出（等价 /exit）

直接输入即可与 agent 对话。agent 可以读取文件、执行 shell 命令、编辑代码。
`))
}

async function main(): Promise<void> {
  process.env.DSH_CWD = process.env.DSH_CWD ?? process.cwd()

  console.log(chalk.bold.green('dsh-term') + chalk.gray(' — 终端版 DeepSeek Harness'))
  console.log(chalk.gray('模型: ' + (process.env.DSH_MODEL ?? '默认') + '   工作目录: ' + process.env.DSH_CWD))
  console.log(chalk.gray('输入 /help 查看命令\n'))

  const history: Turn[] = []
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  for (;;) {
    const input = (await rl.question(chalk.cyan('❯ '))).trim()
    if (input === '') continue
    if (input === '/quit' || input === '/exit') break
    if (input === '/help') {
      printHelp()
      continue
    }
    if (input === '/new') {
      history.length = 0
      console.log(chalk.gray('已开始新会话\n'))
      continue
    }

    process.stdout.write(chalk.gray('… 思考中\n'))
    try {
      const response = await runHeadless(buildPrompt(input, history))
      history.push({ role: 'user', text: input }, { role: 'assistant', text: response })
      console.log('\n' + response + '\n')
    } catch (e) {
      console.error(chalk.red('错误: ' + (e as Error).message) + '\n')
    }
  }

  rl.close()
}

main().catch((e) => {
  const msg = (e as Error).message
  // 非交互（管道 EOF）时 readline 会关闭，属正常退出
  if (msg.includes('readline was closed')) process.exit(0)
  console.error(chalk.red('致命错误: ' + msg))
  process.exit(1)
})

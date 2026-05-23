import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { readdirSync, readFileSync } from 'fs'
import { join, basename, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')

interface SidebarItem {
  text: string
  link?: string
  items?: SidebarItem[]
  collapsed?: boolean
}

/**
 * 从 docs/{topicDir}/ 自动读取所有题目文件，生成侧边栏。
 * title 从文件 Front Matter 中提取，确保显示题目完整标题。
 */
function topicSidebar(topicDir: string, topicName: string): SidebarItem {
  const dir = join(REPO_ROOT, 'docs', topicDir)

  const items: SidebarItem[] = readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'index.md')
    .map((f) => {
      const content = readFileSync(join(dir, f), 'utf-8')
      const m = content.match(/^title:\s*(.+)$/m)
      const text = m ? m[1].trim() : basename(f, '.md')
      return {
        text,
        link: `/docs/${topicDir}/${basename(f, '.md')}`,
      }
    })

  return {
    text: topicName,
    collapsed: false,
    items: [
      { text: `${topicName} 总览`, link: `/docs/${topicDir}/` },
      ...items,
    ],
  }
}

const TOPICS: [string, string][] = [
  ['php',            'PHP 语言篇'],
  ['algorithm',      '数据结构与算法篇'],
  ['network',        '计算机网络篇'],
  ['design-pattern', '设计模式篇'],
  ['storage',        '存储与中间件篇'],
  ['architecture',   '架构与分布式篇'],
  ['server',         '操作系统与服务器篇'],
  ['security',       '安全篇'],
  ['web',            'Web 篇'],
  ['misc',           '番外篇'],
]

const sidebar: Record<string, SidebarItem[]> = {}
for (const [dir, name] of TOPICS) {
  sidebar[`/docs/${dir}/`] = [topicSidebar(dir, name)]
}

/** 仅生产构建注入 GA；本地 `npm run dev` 为 development，不加载统计脚本 */
const isProd =
  (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env
    ?.NODE_ENV === 'production'

export default withMermaid(defineConfig({
  title: 'PHP 面试问答',
  head: isProd
    ? [
        [
          'script',
          {
            async: '',
            src: 'https://www.googletagmanager.com/gtag/js?id=G-LJKDV6FKPC',
          },
        ],
        [
          'script',
          {},
          [
            'window.dataLayer = window.dataLayer || [];',
            'function gtag(){dataLayer.push(arguments);}',
            "gtag('js', new Date());",
            "gtag('config', 'G-LJKDV6FKPC');",
          ].join('\n'),
        ],
      ]
    : [],
  description: 'PHP 中大厂面试题库，L1–L5 难度全覆盖',
  lang: 'zh-CN',
  base: '/PHP-Interview-QA/',
  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: '首页', link: '/' },
      {
        text: '按主题',
        items: TOPICS.map(([dir, name]) => ({
          text: name,
          link: `/docs/${dir}/`,
        })),
      },
      { text: '按难度', link: '/docs/index-difficulty' },
    ],

    sidebar,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/colinlet/PHP-Interview-QA' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: '基于 Apache License 2.0 开源',
      copyright: 'PHP 面试问答',
    },

    docFooter: {
      prev: '上一题',
      next: '下一题',
    },

    outline: {
      label: '本题结构',
    },
  },
}))

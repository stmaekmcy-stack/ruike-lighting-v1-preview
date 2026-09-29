import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export const brandFlowchartPages = [
  { route: 'brand-flowcharts/', title: '瑞客照明品牌素材库', description: '浏览瑞客照明灯光效果交付宣传流程图，提供五个主题、横竖两种版式，以及 PNG、可编辑 SVG 和整套素材下载。' },
  { route: 'brand-flowcharts/pages/01-effect-delivery/', title: '瑞客灯光效果交付流程', description: '从客户需求、效果目标、灯光设计到产品匹配、现场落地、灯光调试和效果验收，了解瑞客灯光效果交付的七个环节。' },
  { route: 'brand-flowcharts/pages/02-expectation-to-result/', title: '从一句期待，到真实灯光效果', description: '客户对舒适、层次和氛围的期待，如何经过需求理解、效果目标、设计、产品匹配和现场调试，变成真实空间里的灯光效果。' },
  { route: 'brand-flowcharts/pages/03-effect-assurance/', title: '效果保障，不是一句承诺', description: '瑞客围绕效果目标、专业设计、产品匹配、技术交底、安装检查、变更控制、调试优化与最终验收组织全过程关键节点。' },
  { route: 'brand-flowcharts/pages/04-customer-journey/', title: '一次完整的灯光项目合作', description: '从初步沟通、需求诊断、现场勘察，到设计预算、合同、图纸深化、安装协同、调试验收与售后，了解与瑞客合作的项目过程。' },
  { route: 'brand-flowcharts/pages/05-traditional-vs-ruike/', title: '买到灯不等于得到灯光效果', description: '对比传统买灯与瑞客灯光效果交付：灯具是实现效果的工具，瑞客围绕客户期待和最终真实空间效果组织交付。' },
]

const escape = (value) => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

export async function prepareBrandFlowcharts({ siteUrl, allowIndexing, icpNumber }) {
  for (const page of brandFlowchartPages) {
    const file = join('dist', page.route, 'index.html')
    let html = await readFile(file, 'utf8')
    if (!html.includes('<!-- RUIKE_ICP -->') || !html.includes('<meta name="robots" content="noindex, nofollow">')) {
      throw new Error(`Brand library template is missing its publication markers: ${page.route}`)
    }
    const url = `${siteUrl}${page.route}`
    html = html
      .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${escape(page.description)}">`)
      .replace('<meta name="robots" content="noindex, nofollow">', `<meta name="robots" content="${allowIndexing ? 'index, follow' : 'noindex, nofollow'}">`)
      .replace('<!-- RUIKE_ICP -->', icpNumber ? `<a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">${escape(icpNumber)}</a>` : '')
      .replace('</head>', `<link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:site_name" content="瑞客照明"><meta property="og:title" content="${escape(page.title)}"><meta property="og:description" content="${escape(page.description)}"><meta property="og:url" content="${url}"></head>`)
    await writeFile(file, html)
  }
}

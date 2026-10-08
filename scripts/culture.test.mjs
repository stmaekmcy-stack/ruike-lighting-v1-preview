import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { culture } from '../src/content/culture.ts'
import { brand } from '../src/content/brand.ts'

test('Public culture follows the confirmed V1.1 statements exactly', () => {
  assert.equal(culture.mission, '为客户实现期待的灯光效果，让每一个空间因光而更具价值。')
  assert.equal(culture.vision, '成为中国最值得信赖的灯光效果交付品牌。')
  assert.equal(culture.origin.join(''), '专业创造效果，担当兑现承诺。')
  assert.deepEqual(culture.values.map(({ name }) => name), ['客户第一', '专业务实', '结果担当', '持续成长'])
  assert.deepEqual(culture.spirit, ['专业', '担当', '拼搏', '共赢'])
})

test('Manual display line breaks do not alter the mission or vision', () => {
  assert.equal(culture.explanationLines.join(''), culture.explanation)
  assert.equal(culture.missionLines.join(''), culture.mission)
  assert.equal(culture.visionLines.join(''), culture.vision)
})

test('About page keeps consultation and existing source anchors', () => {
  const source = readFileSync(new URL('../src/AboutPage.tsx', import.meta.url), 'utf8')
  assert.match(source, /href=\{link\('#start'\)\}/)
  for (let index = 1; index <= 5; index++) assert.ok(source.includes(`id="section-${index}"`))
  assert.match(source, /非项目实拍/)
  assert.match(source, /<summary>\{faq.question\}/)
})

test('About delivery labels remain identical to the approved homepage', () => {
  assert.deepEqual(brand.deliveryStepNames, ['理解期待', '定义效果', '灯光设计', '产品匹配', '现场落地', '专业调试', '效果验收'])
  const home = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const label of brand.deliveryStepNames) assert.ok(home.includes(`title: '${label}'`))
})

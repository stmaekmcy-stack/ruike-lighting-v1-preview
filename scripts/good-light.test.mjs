import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { goodLight } from '../src/content/good-light.ts'

test('Good-light definition preserves the V2.6 section 2.2 original', () => {
  assert.equal(goodLight.definition, '好的灯光效果，不追求统一亮度、固定风格或单一参数的最大化，而是从人的真实使用和观看出发，根据建筑、空间、活动与对象的特点恰当地组织光：使人的视觉需求获得适宜回应并保持视觉舒适，使需要被看见的人物、物品和材料得到恰当呈现，使空间形成清楚自然的重点、主次、前后、深度、边界以及必要的区域与方向关系，同时形成与建筑特征、空间功能、人的活动、使用时间/场景及设计意图相符的空间氛围。')
  assert.equal(goodLight.summary, goodLight.definition.split('：')[0] + '。')
  assert.equal(goodLight.judgment, '单项看是否恰当，整体看是否相符。')
})

test('The five observation names and descriptions match the approved homepage', () => {
  assert.deepEqual(goodLight.observations.map(({ title }) => title), ['视觉需求', '视觉舒适', '对象呈现', '空间感知', '空间氛围'])
  const home = readFileSync(new URL('../src/App.tsx', import.meta.url), 'utf8')
  for (const observation of goodLight.observations) {
    assert.ok(home.includes(`title: '${observation.title}', body: '${observation.body}'`))
  }
})

test('About presents good light between purpose and values and links to the existing detail anchor', () => {
  const source = readFileSync(new URL('../src/AboutPage.tsx', import.meta.url), 'utf8')
  assert.ok(source.indexOf('className="about-purpose"') < source.indexOf('id="good-light"'))
  assert.ok(source.indexOf('id="good-light"') < source.indexOf('id="values-title"'))
  assert.ok(source.includes("link('lighting-delivery/#section-2')"))
  const pages = readFileSync(new URL('../src/content/pages.ts', import.meta.url), 'utf8')
  assert.match(pages, /title: '瑞客从五个观察面判断效果', paragraphs: \[goodLight.definition,/)
})

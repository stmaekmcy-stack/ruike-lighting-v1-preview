import { test } from 'node:test'
import assert from 'node:assert/strict'
import { assertVisibleFaq } from './visible-faq.mjs'

const faq = [{ name: '什么是效果交付？', acceptedAnswer: { text: '围绕最终空间效果连接项目环节。' } }]
const schema = '<script type="application/ld+json">' + JSON.stringify(faq) + '</script>'

test('structured data alone cannot satisfy the visible FAQ gate', () => {
  assert.throws(() => assertVisibleFaq('<body>' + schema + '</body>', faq))
  assert.throws(() => assertVisibleFaq('<body>' + schema + '<h3>什么是效果交付？</h3><p>答案已改变。</p></body>', faq))
  assert.doesNotThrow(() => assertVisibleFaq('<body>' + schema + '<h3>什么是效果交付？</h3><p>围绕最终空间效果连接项目环节。</p></body>', faq))
})

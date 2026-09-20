import assert from 'node:assert/strict'

export function assertVisibleFaq(html, questions) {
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || ''
  const text = body
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&#x27;', "'")
    .replaceAll('&lt;', '<').replaceAll('&gt;', '>')
  for (const question of questions) {
    assert.ok(text.includes(question.name), 'FAQ question must be present in body content')
    assert.ok(text.includes(question.acceptedAnswer.text), 'FAQ answer must be present in body content')
  }
}

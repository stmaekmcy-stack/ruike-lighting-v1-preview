import type { IncomingMessage, ServerResponse } from 'node:http'

const allowedProjectTypes = new Set(['别墅', '大平层', '酒店', '会所', '餐饮', '零售', '展厅', '办公', '其他'])
const allowedStages = new Set(['概念 / 方案阶段', '深化设计', '水电施工', '木工 / 吊顶', '灯具选择', '安装阶段', '已安装待调试', '其他'])
const allowedFileTypes = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const allowedFileExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png'])
const maxBodyBytes = 28 * 1024 * 1024
const maxFileBytes = 8 * 1024 * 1024
const maxFiles = 3

type InquiryFile = {
  name?: unknown
  type?: unknown
  size?: unknown
  data?: unknown
}

type InquiryPayload = {
  name?: unknown
  phone?: unknown
  city?: unknown
  projectType?: unknown
  stage?: unknown
  brief?: unknown
  wechat?: unknown
  area?: unknown
  website?: unknown
  files?: unknown
}

function sendJson(response: ServerResponse, status: number, payload: Record<string, unknown>) {
  const body = JSON.stringify(payload)
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(body)
}

function readRequestBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = []
    let totalBytes = 0

    request.on('data', (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
      totalBytes += buffer.byteLength
      if (totalBytes > maxBodyBytes) {
        reject(new Error('请求内容过大。'))
        request.destroy()
        return
      }
      chunks.push(buffer)
    })
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    request.on('error', reject)
  })
}

function readText(value: unknown, maxLength: number) {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, maxLength)
}

function validatePayload(payload: InquiryPayload) {
  const name = readText(payload.name, 80)
  const phone = readText(payload.phone, 40)
  const city = readText(payload.city, 80)
  const projectType = readText(payload.projectType, 40)
  const stage = readText(payload.stage, 40)
  const brief = readText(payload.brief, 4000)
  const wechat = readText(payload.wechat, 80)
  const area = readText(payload.area, 20)
  const errors: string[] = []

  if (!name) errors.push('请填写称呼。')
  if (!phone || !/^[0-9+()\-\s]{6,40}$/.test(phone)) errors.push('请填写有效的联系电话。')
  if (!city) errors.push('请填写项目城市。')
  if (!allowedProjectTypes.has(projectType)) errors.push('请选择有效的项目类型。')
  if (!allowedStages.has(stage)) errors.push('请选择有效的项目阶段。')
  if (brief.length < 8) errors.push('请补充项目说明。')
  if (area && !/^[0-9]+(?:\.[0-9]+)?$/.test(area)) errors.push('面积请填写数字。')

  const files = payload.files === undefined ? [] : payload.files
  if (!Array.isArray(files) || files.length > maxFiles) {
    errors.push('项目资料最多上传 3 个文件。')
  } else {
    for (const file of files as InquiryFile[]) {
      const name = readText(file.name, 160)
      const type = typeof file.type === 'string' ? file.type : ''
      const size = typeof file.size === 'number' ? file.size : 0
      const extension = name.split('.').pop()?.toLowerCase() ?? ''
      const data = typeof file.data === 'string' ? file.data : ''
      const encodedSize = data.includes(',') ? Math.floor((data.split(',')[1]?.length ?? 0) * 0.75) : 0
      if (!name || !allowedFileTypes.has(type) || !allowedFileExtensions.has(extension) || size <= 0 || size > maxFileBytes || encodedSize > maxFileBytes) {
        errors.push('文件格式或大小不符合要求。')
        break
      }
    }
  }

  return { errors, fields: { name, phone, city, projectType, stage, brief, wechat, area } }
}

function normalise(value: string) {
  return value.replace(/\s+/g, '').toLowerCase()
}

export function createInquiryHandler() {
  const recentSubmissions = new Map<string, number>()

  return async (request: IncomingMessage, response: ServerResponse) => {
    if (request.method !== 'POST') {
      sendJson(response, 405, { message: '仅支持 POST 请求。' })
      return
    }

    try {
      const rawBody = await readRequestBody(request)
      const payload = JSON.parse(rawBody) as InquiryPayload
      if (readText(payload.website, 120)) {
        sendJson(response, 400, { message: '提交未完成，请稍后再试。' })
        return
      }

      const { errors, fields } = validatePayload(payload)
      if (errors.length > 0) {
        sendJson(response, 400, { message: errors[0] })
        return
      }

      const now = Date.now()
      for (const [key, timestamp] of recentSubmissions) {
        if (now - timestamp > 10 * 60 * 1000) recentSubmissions.delete(key)
      }
      const duplicateKey = `${normalise(fields.phone)}|${normalise(fields.city)}|${normalise(fields.brief)}`
      const previousTimestamp = recentSubmissions.get(duplicateKey)
      if (previousTimestamp && now - previousTimestamp < 60 * 1000) {
        sendJson(response, 429, { message: '相同项目资料提交过于频繁，请稍后再试。' })
        return
      }
      recentSubmissions.set(duplicateKey, now)

      sendJson(response, 201, { ok: true })
    } catch {
      sendJson(response, 400, { message: '提交未完成，请检查项目资料后再试。' })
    }
  }
}

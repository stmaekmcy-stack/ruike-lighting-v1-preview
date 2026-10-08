// Public explanation grounded in《瑞客好灯光效果标准》V2.6 (2026-09-02), sections 2.2–3.
// Only the definition is quoted; internal roles, procedures and the source document stay private.
const approach = '好的灯光效果，不追求统一亮度、固定风格或单一参数的最大化，而是从人的真实使用和观看出发，根据建筑、空间、活动与对象的特点恰当地组织光'

export const goodLight = {
  summary: approach + '。',
  definition: approach + '：使人的视觉需求获得适宜回应并保持视觉舒适，使需要被看见的人物、物品和材料得到恰当呈现，使空间形成清楚自然的重点、主次、前后、深度、边界以及必要的区域与方向关系，同时形成与建筑特征、空间功能、人的活动、使用时间/场景及设计意图相符的空间氛围。',
  judgment: '单项看是否恰当，整体看是否相符。',
  note: '不以单一参数代替整体判断。',
  // Names and brief descriptions match the approved homepage, without changing its layout.
  observations: [
    { title: '视觉需求', body: '真实使用所需的视觉条件是否得到适宜回应。' },
    { title: '视觉舒适', body: '人在主要使用与观看位置能否自然、稳定地观看。' },
    { title: '对象呈现', body: '重要人物、物品与材料是否被恰当呈现。' },
    { title: '空间感知', body: '光是否帮助人自然理解空间的重点、主次、前后、深度、边界与方向。' },
    { title: '空间氛围', body: '整体视觉状态是否与建筑、功能、活动、时间及设计意图相符。' },
  ],
}

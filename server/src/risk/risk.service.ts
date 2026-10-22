export function assessRisk(
  user: { age: number | null; gender: string | null },
  indicators: { name: string; status: string; valueText: string }[],
  weights: { metabolic?: number; cardio?: number; liver?: number; respiratory?: number; bone?: number } = {},
) {
  const w = {
    metabolic: Number(weights.metabolic ?? 1),
    cardio: Number(weights.cardio ?? 1),
    liver: Number(weights.liver ?? 1),
    respiratory: Number(weights.respiratory ?? 1),
    bone: Number(weights.bone ?? 1),
  }
  const score = (pred: (i: any) => boolean, key: keyof typeof w) => {
    const hits = indicators.filter(pred).length
    const raw = hits * 25 + (user.age && user.age > 50 ? 15 : 0)
    return Math.min(100, Math.round(raw * (Number.isFinite(w[key]) ? w[key] : 1)))
  }
  const metabolic = score((i) => /血糖|胆固醇|甘油三酯|体重/.test(i.name) && i.status !== 'normal', 'metabolic')
  const cardio = score((i) => /血压|心|胆固醇/.test(i.name) && i.status !== 'normal', 'cardio')
  const liver = score((i) => /转氨酶|肝/.test(i.name) && i.status !== 'normal', 'liver')
  const respiratory = score((i) => /肺|呼吸/.test(i.name) && i.status !== 'normal', 'respiratory')
  const bone = score((i) => /骨|钙/.test(i.name) && i.status !== 'normal', 'bone')
  const diseases = [
    { name: '高血压', level: cardio >= 50 ? 'high' : cardio >= 25 ? 'mid' : 'low' },
    { name: '糖尿病', level: metabolic >= 50 ? 'high' : metabolic >= 25 ? 'mid' : 'low' },
    { name: '脂肪肝', level: liver >= 50 ? 'high' : liver >= 25 ? 'mid' : 'low' },
  ]
  return {
    diseases,
    radar: [
      { dim: '代谢风险', score: metabolic },
      { dim: '心血管风险', score: cardio },
      { dim: '肝肾风险', score: liver },
      { dim: '呼吸风险', score: respiratory },
      { dim: '骨骼风险', score: bone },
    ],
  }
}

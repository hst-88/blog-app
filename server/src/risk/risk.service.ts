export function assessRisk(user: { age: number | null; gender: string | null }, indicators: { name: string; status: string; valueText: string }[]) {
  const score = (pred: (i: any) => boolean) => {
    const hits = indicators.filter(pred).length
    return Math.min(100, hits * 25 + (user.age && user.age > 50 ? 15 : 0))
  }
  const metabolic = score((i) => /血糖|胆固醇|甘油三酯|体重/.test(i.name) && i.status !== 'normal')
  const cardio = score((i) => /血压|心|胆固醇/.test(i.name) && i.status !== 'normal')
  const liver = score((i) => /转氨酶|肝/.test(i.name) && i.status !== 'normal')
  const respiratory = score((i) => /肺|呼吸/.test(i.name) && i.status !== 'normal')
  const bone = score((i) => /骨|钙/.test(i.name) && i.status !== 'normal')
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

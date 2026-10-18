<template>
  <div class="portal">
    <nav class="top">
      <div class="logo"><i>检</i>检后无忧</div>
      <div class="links">
        <a href="/user/login">用户端</a>
        <a href="/doctor/login">医生端</a>
        <a href="/admin/login">管理端</a>
      </div>
    </nav>
    <section class="hero">
      <div>
        <p class="eyebrow">检后无忧 HEALTH LOOP</p>
        <h1>体检之后，健康有人管</h1>
        <p class="lead">体检中心导入报告，用户看懂指标并发起咨询，医生干预回复与随访。三端共用同一套数据，一条链路走完。</p>
        <div class="cta">
          <a class="btn primary" href="/user/login">我是用户</a>
          <a class="btn ghost" href="/doctor/login">我是医生</a>
        </div>
      </div>
      <div class="preview">
        <div class="phone-mini">
          <b>张三的体检报告</b>
          <span class="pill">低风险 · 1 项异常</span>
          <p>谷丙转氨酶 45 U/L ↑</p>
          <p>血糖 5.4 mmol/L 正常</p>
          <em>AI 解读与在线咨询已打通</em>
        </div>
      </div>
    </section>
    <section class="grid">
      <a class="card user" href="/user/login">
        <span class="tag">C 端</span>
        <h2>体检用户</h2>
        <p>注册登录、查看报告、AI 解读、在线咨询、血压打卡</p>
        <em>进入用户端</em>
      </a>
      <a class="card doctor" href="/doctor/login">
        <span class="tag">医生端</span>
        <h2>基层医生</h2>
        <p>患者档案、异常预警、回复咨询、随访宣教</p>
        <em>进入医生端</em>
      </a>
      <a class="card admin" href="/admin/login">
        <span class="tag">管理端</span>
        <h2>体检中心</h2>
        <p>导入报告、统计分析、套餐权限、系统配置</p>
        <em>进入管理端</em>
      </a>
    </section>
    <ol class="flow">
      <li><b>01</b> 管理端导入或沿用示例报告</li>
      <li><b>02</b> 用户注册（身份证 110101199001011234 可匹配示例报告）</li>
      <li><b>03</b> 用户查看报告、AI 解读后向医生发起咨询</li>
      <li><b>04</b> 医生回复咨询、处理预警，管理端即时看到用户与统计</li>
    </ol>
  </div>
</template>
<style scoped>
.portal { min-height: 100%; background: linear-gradient(180deg, #e0f2fe 0%, #f8fafc 38%, #fff 100%); }
.top { max-width: 1120px; margin: 0 auto; padding: 22px 24px; display: flex; justify-content: space-between; align-items: center; }
.logo { display: flex; align-items: center; gap: 10px; font-weight: 800; font-size: 18px; }
.logo i { font-style: normal; width: 32px; height: 32px; border-radius: 10px; display: grid; place-items: center; color: #fff; background: linear-gradient(135deg, #38bdf8, #0284c7); }
.links { display: flex; gap: 18px; color: #0369a1; font-weight: 600; font-size: 14px; }
.hero { max-width: 1120px; margin: 0 auto; padding: 24px 24px 8px; display: grid; grid-template-columns: 1.2fr .8fr; gap: 32px; align-items: center; }
.eyebrow { letter-spacing: 3px; color: #0284c7; font-weight: 700; font-size: 12px; }
h1 { font-size: 44px; margin: 8px 0 14px; line-height: 1.15; }
.lead { color: #475569; max-width: 560px; font-size: 16px; line-height: 1.7; }
.cta { display: flex; gap: 12px; margin-top: 24px; }
.btn { display: inline-flex; align-items: center; justify-content: center; height: 44px; padding: 0 20px; border-radius: 999px; text-decoration: none; font-weight: 700; }
.btn.primary { background: #0284c7; color: #fff; }
.btn.ghost { background: #fff; color: #0369a1; border: 1px solid #bae6fd; }
.preview { display: flex; justify-content: center; }
.phone-mini { width: 280px; background: #0f172a; color: #e2e8f0; border-radius: 28px; padding: 22px; box-shadow: 0 30px 60px rgba(15,23,42,.25); }
.phone-mini b { display: block; font-size: 18px; margin-bottom: 8px; }
.pill { display: inline-block; background: #14532d; color: #bbf7d0; border-radius: 999px; padding: 2px 8px; font-size: 12px; margin-bottom: 12px; }
.phone-mini p { margin: 8px 0; color: #cbd5e1; }
.phone-mini em { display: block; margin-top: 16px; color: #38bdf8; font-style: normal; font-size: 13px; }
.grid { max-width: 1120px; margin: 28px auto 0; padding: 0 24px 8px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.card { display: block; padding: 24px; border-radius: 22px; text-decoration: none; min-height: 210px; background: #fff; box-shadow: 0 16px 40px rgba(15,23,42,.06); }
.card.user { background: linear-gradient(180deg, #e0f2fe, #fff); }
.card.doctor { background: linear-gradient(180deg, #ccfbf1, #fff); }
.card.admin { background: linear-gradient(180deg, #e2e8f0, #fff); }
.tag { font-size: 12px; color: #0369a1; font-weight: 700; }
.card h2 { margin: 12px 0 8px; }
.card p { color: #64748b; font-size: 14px; min-height: 48px; }
.card em { font-style: normal; color: #0369a1; font-weight: 700; }
.flow { max-width: 1120px; margin: 12px auto 64px; padding: 8px 24px 40px; color: #334155; line-height: 2.1; }
.flow b { color: #0284c7; margin-right: 8px; }
@media (max-width: 900px) {
  .hero, .grid { grid-template-columns: 1fr; }
  h1 { font-size: 32px; }
}
</style>

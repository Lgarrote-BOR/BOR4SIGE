<!-- ============================================================
     Bor4SIGE — Versión WordPress
     Instrucciones de uso:
     1. En WordPress, crea una nueva Página (Páginas → Añadir nueva)
     2. Asigna una plantilla "Ancho completo" o "Sin barra lateral"
        (depende de tu tema: Full Width, No Sidebar, Canvas, etc.)
     3. En el editor Gutenberg, añade un bloque "HTML personalizado"
     4. Pega TODO el contenido de este archivo en ese bloque
     5. Publica o previsualiza la página
     NOTA: Si tu tema no carga Google Fonts, activa el link de fuentes
     que está incluido al inicio de este snippet.
     ============================================================ -->

<!-- Fuentes (omite si tu tema ya carga Inter o Space Grotesk) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />

<style>
/* ── RESET SCOPE ── */
.bor4sige-wp *, .bor4sige-wp *::before, .bor4sige-wp *::after {
  box-sizing: border-box; margin: 0; padding: 0;
}

/* ── VARIABLES ── */
.bor4sige-wp {
  --c-bg:        #05070f;
  --c-surface:   #0d1120;
  --c-surface2:  #111827;
  --c-border:    rgba(255,255,255,0.07);
  --c-text:      #e8ecf4;
  --c-muted:     #8b95a8;
  --c-accent1:   #3b82f6;
  --c-accent2:   #8b5cf6;
  --c-accent3:   #06b6d4;
  --c-green:     #10b981;
  --c-orange:    #f59e0b;
  --gradient-hero:   linear-gradient(135deg, #1e1b4b 0%, #0f172a 40%, #042029 100%);
  --gradient-accent: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  --gradient-card:   linear-gradient(145deg, #111827, #0d1120);
  --font-main: 'Inter', sans-serif;
  --font-head: 'Space Grotesk', sans-serif;

  font-family: var(--font-main);
  color: var(--c-text);
  line-height: 1.6;
  background: var(--c-bg);
  overflow-x: hidden;
  width: 100%;
}

/* ── KEYFRAMES (globales, no necesitan scope) ── */
@keyframes sige-float1  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(40px,30px)} }
@keyframes sige-float2  { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-30px,-40px)} }
@keyframes sige-float3  { 0%,100%{transform:translate(-50%,-50%) scale(1)} 50%{transform:translate(-50%,-50%) scale(1.15)} }
@keyframes sige-pulse   { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.3)} }
@keyframes sige-bounce  { 0%,100%{transform:rotate(45deg) translate(0,0)} 50%{transform:rotate(45deg) translate(4px,4px)} }
@keyframes sige-fadeUp  { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
@keyframes sige-marquee { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
@keyframes sige-scan    { 0%{top:0;opacity:1} 100%{top:100%;opacity:0} }

/* ── HERO ── */
.bor4sige-wp .s-hero {
  min-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 6rem 2rem 4rem;
  position: relative;
  background: var(--gradient-hero);
  overflow: hidden;
}
.bor4sige-wp .s-orb {
  position: absolute; border-radius: 50%;
  filter: blur(80px); opacity: .25; pointer-events: none;
}
.bor4sige-wp .s-orb-1 {
  width:600px;height:600px;
  background:radial-gradient(circle,#3b82f6,transparent 70%);
  top:-200px;left:-200px;
  animation:sige-float1 8s ease-in-out infinite;
}
.bor4sige-wp .s-orb-2 {
  width:500px;height:500px;
  background:radial-gradient(circle,#8b5cf6,transparent 70%);
  bottom:-150px;right:-100px;
  animation:sige-float2 10s ease-in-out infinite;
}
.bor4sige-wp .s-orb-3 {
  width:300px;height:300px;
  background:radial-gradient(circle,#06b6d4,transparent 70%);
  top:50%;left:50%;
  transform:translate(-50%,-50%);
  animation:sige-float3 12s ease-in-out infinite;
}
.bor4sige-wp .s-badge {
  display:inline-flex;align-items:center;gap:.5rem;
  background:rgba(59,130,246,.15);
  border:1px solid rgba(59,130,246,.3);
  border-radius:100px;padding:.4rem 1rem;
  font-size:.8rem;font-weight:600;color:#93c5fd;
  margin-bottom:1.5rem;
  animation:sige-fadeUp .6s ease both;
}
.bor4sige-wp .s-badge-dot {
  width:6px;height:6px;background:#3b82f6;
  border-radius:50%;animation:sige-pulse 2s ease infinite;
}
.bor4sige-wp .s-hero h1 {
  font-family:var(--font-head);
  font-size:clamp(2.5rem,7vw,5.5rem);
  font-weight:800;line-height:1.05;letter-spacing:-2px;
  animation:sige-fadeUp .6s .1s ease both;
}
.bor4sige-wp .s-grad-text {
  background:linear-gradient(135deg,#60a5fa 0%,#a78bfa 50%,#22d3ee 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.bor4sige-wp .s-hero-sub {
  font-size:clamp(.95rem,2vw,1.2rem);color:var(--c-muted);
  max-width:660px;margin:1.5rem auto 0;
  animation:sige-fadeUp .6s .2s ease both;line-height:1.7;
}
.bor4sige-wp .s-hero-actions {
  display:flex;gap:1rem;margin-top:2.5rem;flex-wrap:wrap;justify-content:center;
  animation:sige-fadeUp .6s .3s ease both;
}
.bor4sige-wp .s-btn-p {
  display:inline-flex;align-items:center;gap:.5rem;
  background:var(--gradient-accent);color:#fff;
  padding:.85rem 2rem;border-radius:12px;
  font-weight:700;font-size:1rem;text-decoration:none;
  transition:transform .2s,box-shadow .2s;
  box-shadow:0 0 30px rgba(59,130,246,.4);
}
.bor4sige-wp .s-btn-p:hover{transform:translateY(-2px);box-shadow:0 0 50px rgba(59,130,246,.6);}
.bor4sige-wp .s-btn-s {
  display:inline-flex;align-items:center;gap:.5rem;
  background:rgba(255,255,255,.06);color:var(--c-text);
  padding:.85rem 2rem;border-radius:12px;
  font-weight:600;font-size:1rem;text-decoration:none;
  border:1px solid var(--c-border);
  transition:background .2s,transform .2s;
}
.bor4sige-wp .s-btn-s:hover{background:rgba(255,255,255,.1);transform:translateY(-2px);}
.bor4sige-wp .s-hero-stats {
  display:flex;gap:3rem;margin-top:4rem;
  animation:sige-fadeUp .6s .4s ease both;
  flex-wrap:wrap;justify-content:center;
}
.bor4sige-wp .s-stat-num {
  font-family:var(--font-head);font-size:2.25rem;font-weight:800;
  background:var(--gradient-accent);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}
.bor4sige-wp .s-stat-label{font-size:.8rem;color:var(--c-muted);font-weight:500;margin-top:.25rem;}

/* ── NORMAS STRIP ── */
.bor4sige-wp .s-normas-strip {
  background:var(--c-surface);
  border-top:1px solid var(--c-border);border-bottom:1px solid var(--c-border);
  overflow:hidden;padding:1.25rem 0;
}
.bor4sige-wp .s-normas-track {
  display:flex;gap:3rem;
  animation:sige-marquee 25s linear infinite;white-space:nowrap;
}
.bor4sige-wp .s-norma-item {display:flex;align-items:center;gap:.75rem;flex-shrink:0;}
.bor4sige-wp .s-norma-icon {
  width:36px;height:36px;border-radius:8px;
  display:flex;align-items:center;justify-content:center;
  font-size:.65rem;font-weight:800;color:#fff;
}
.bor4sige-wp .s-norma-name {font-size:.85rem;font-weight:600;color:var(--c-muted);}

/* ── SECTIONS ── */
.bor4sige-wp .s-inner {max-width:1200px;margin:0 auto;padding:5rem 2rem;}
.bor4sige-wp .s-label {
  display:inline-flex;align-items:center;gap:.5rem;
  font-size:.75rem;font-weight:700;letter-spacing:2px;
  text-transform:uppercase;color:#60a5fa;margin-bottom:1rem;
}
.bor4sige-wp .s-label::before{content:'';width:20px;height:2px;background:#60a5fa;}
.bor4sige-wp .s-title {
  font-family:var(--font-head);
  font-size:clamp(1.8rem,3.5vw,2.8rem);
  font-weight:800;letter-spacing:-1px;line-height:1.1;
}
.bor4sige-wp .s-desc{color:var(--c-muted);font-size:1.05rem;max-width:600px;margin-top:1rem;line-height:1.7;}

/* ── FEATURES ── */
.bor4sige-wp .s-features-hdr{text-align:center;margin-bottom:3rem;}
.bor4sige-wp .s-features-grid {
  display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.5rem;
}
.bor4sige-wp .s-fcard {
  background:var(--gradient-card);border:1px solid var(--c-border);
  border-radius:20px;padding:2rem;
  transition:transform .3s,border-color .3s,box-shadow .3s;position:relative;overflow:hidden;
}
.bor4sige-wp .s-fcard::before{
  content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.1),transparent);
}
.bor4sige-wp .s-fcard:hover{transform:translateY(-4px);border-color:rgba(59,130,246,.3);box-shadow:0 20px 60px rgba(59,130,246,.1);}
.bor4sige-wp .s-fcard-icon{width:52px;height:52px;border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-bottom:1.25rem;}
.bor4sige-wp .s-fcard-title{font-family:var(--font-head);font-size:1.1rem;font-weight:700;margin-bottom:.6rem;}
.bor4sige-wp .s-fcard-desc{font-size:.9rem;color:var(--c-muted);line-height:1.65;}
.bor4sige-wp .s-ftags{display:flex;flex-wrap:wrap;gap:.4rem;margin-top:1.25rem;}
.bor4sige-wp .s-ftag{font-size:.7rem;font-weight:600;padding:.2rem .6rem;border-radius:100px;background:rgba(59,130,246,.1);color:#93c5fd;border:1px solid rgba(59,130,246,.2);}

/* ── STATS BAND ── */
.bor4sige-wp .s-stats-band{background:var(--c-surface);border-top:1px solid var(--c-border);border-bottom:1px solid var(--c-border);}
.bor4sige-wp .s-stats-grid{display:grid;grid-template-columns:repeat(4,1fr);}
.bor4sige-wp .s-stat-box{padding:3rem 2rem;text-align:center;border-right:1px solid var(--c-border);}
.bor4sige-wp .s-stat-box:last-child{border-right:none;}
.bor4sige-wp .s-snum{font-family:var(--font-head);font-size:3rem;font-weight:900;line-height:1;background:var(--gradient-accent);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
.bor4sige-wp .s-slabel{font-size:.85rem;color:var(--c-muted);margin-top:.5rem;font-weight:500;}

/* ── MODULES ── */
.bor4sige-wp .s-mods-bg{background:var(--c-surface);border-top:1px solid var(--c-border);border-bottom:1px solid var(--c-border);}
.bor4sige-wp .s-mods-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-top:2rem;}
.bor4sige-wp .s-mcard{background:var(--gradient-card);border:1px solid var(--c-border);border-radius:16px;padding:1.5rem;transition:transform .2s,box-shadow .2s;}
.bor4sige-wp .s-mcard:hover{transform:translateY(-3px);box-shadow:0 12px 40px rgba(0,0,0,.3);}
.bor4sige-wp .s-mcard-icon{font-size:1.75rem;margin-bottom:.75rem;}
.bor4sige-wp .s-mcard-title{font-size:.85rem;font-weight:700;margin-bottom:.25rem;}
.bor4sige-wp .s-mcard-norm{font-size:.7rem;color:var(--c-muted);}

/* ── AI SECTION ── */
.bor4sige-wp .s-ai-bg{background:linear-gradient(135deg,#0a0e1a 0%,#0d1120 50%,#070d1f 100%);}
.bor4sige-wp .s-ai-layout{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;}
.bor4sige-wp .s-aicard{background:var(--gradient-card);border:1px solid var(--c-border);border-radius:20px;padding:2rem;position:relative;overflow:hidden;}
.bor4sige-wp .s-aicard::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(59,130,246,.05),rgba(139,92,246,.05));}
.bor4sige-wp .s-scan{position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,#3b82f6,transparent);animation:sige-scan 3s ease-in-out infinite;}
.bor4sige-wp .s-alert{display:flex;align-items:flex-start;gap:.75rem;padding:.9rem 1rem;border-radius:10px;margin-bottom:.75rem;font-size:.82rem;}
.bor4sige-wp .s-alert-ok{background:rgba(16,185,129,.08);border:1px solid rgba(16,185,129,.2);}
.bor4sige-wp .s-alert-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);}
.bor4sige-wp .s-alert-info{background:rgba(59,130,246,.08);border:1px solid rgba(59,130,246,.2);}
.bor4sige-wp .s-adot{width:8px;height:8px;border-radius:50%;margin-top:3px;flex-shrink:0;}
.bor4sige-wp .s-ai-ul{list-style:none;margin-top:1.5rem;}
.bor4sige-wp .s-ai-ul li{display:flex;align-items:flex-start;gap:.75rem;padding:.75rem 0;border-bottom:1px solid var(--c-border);font-size:.9rem;}
.bor4sige-wp .s-ai-ul li:last-child{border-bottom:none;}

/* ── STANDARDS ── */
.bor4sige-wp .s-std-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-top:3rem;}
.bor4sige-wp .s-std-card{background:var(--gradient-card);border:1px solid var(--c-border);border-radius:16px;padding:1.5rem;text-align:center;transition:transform .2s,border-color .2s;position:relative;overflow:hidden;}
.bor4sige-wp .s-std-card:hover{transform:translateY(-3px);border-color:rgba(139,92,246,.4);}
.bor4sige-wp .s-std-glow{position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;filter:blur(30px);opacity:.2;}
.bor4sige-wp .s-std-badge{display:inline-block;font-family:var(--font-head);font-size:.7rem;font-weight:800;padding:.25rem .6rem;border-radius:6px;margin-bottom:.75rem;color:#fff;}
.bor4sige-wp .s-std-name{font-size:1.05rem;font-weight:700;margin-bottom:.25rem;}
.bor4sige-wp .s-std-desc{font-size:.75rem;color:var(--c-muted);line-height:1.5;}
.bor4sige-wp .s-std-bar{margin-top:1rem;height:4px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;}
.bor4sige-wp .s-std-fill{height:100%;border-radius:2px;}
.bor4sige-wp .s-std-pct{font-size:.7rem;color:var(--c-muted);margin-top:.35rem;text-align:right;}

/* ── CHATBOT DEMO ── */
.bor4sige-wp .s-chat-layout{display:grid;grid-template-columns:1fr 1fr;gap:4rem;align-items:center;}
.bor4sige-wp .s-chat-bg{background:var(--c-surface);border-top:1px solid var(--c-border);}
.bor4sige-wp .s-chat-win{background:var(--gradient-card);border:1px solid var(--c-border);border-radius:20px;overflow:hidden;}
.bor4sige-wp .s-chat-hdr{display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem;background:rgba(255,255,255,.03);border-bottom:1px solid var(--c-border);}
.bor4sige-wp .s-chat-av{width:32px;height:32px;background:var(--gradient-accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.9rem;}
.bor4sige-wp .s-chat-name{font-size:.85rem;font-weight:700;}
.bor4sige-wp .s-chat-status{font-size:.7rem;color:#10b981;}
.bor4sige-wp .s-chat-body{padding:1.25rem;display:flex;flex-direction:column;gap:1rem;}
.bor4sige-wp .s-cmsg{display:flex;gap:.75rem;align-items:flex-start;}
.bor4sige-wp .s-cmsg.user{flex-direction:row-reverse;}
.bor4sige-wp .s-cbubble{max-width:75%;padding:.75rem 1rem;border-radius:14px;font-size:.82rem;line-height:1.5;}
.bor4sige-wp .s-cbot{background:rgba(59,130,246,.1);border:1px solid rgba(59,130,246,.2);border-radius:4px 14px 14px 14px;}
.bor4sige-wp .s-cuser{background:var(--gradient-accent);border-radius:14px 14px 4px 14px;color:#fff;}
.bor4sige-wp .s-chat-in{display:flex;align-items:center;gap:.75rem;padding:1rem 1.25rem;background:rgba(255,255,255,.02);border-top:1px solid var(--c-border);}
.bor4sige-wp .s-chat-field{flex:1;background:rgba(255,255,255,.04);border:1px solid var(--c-border);border-radius:10px;padding:.6rem 1rem;color:var(--c-text);font-size:.82rem;outline:none;}
.bor4sige-wp .s-chat-send{width:34px;height:34px;background:var(--gradient-accent);border:none;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:.85rem;}

/* ── CTA ── */
.bor4sige-wp .s-cta{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%);text-align:center;}
.bor4sige-wp .s-cta-box{max-width:700px;margin:0 auto;}
.bor4sige-wp .s-cta-box h2{font-family:var(--font-head);font-size:clamp(1.8rem,3.5vw,2.8rem);font-weight:800;letter-spacing:-1px;line-height:1.1;margin-bottom:1rem;}
.bor4sige-wp .s-cta-box p{color:var(--c-muted);font-size:1.05rem;line-height:1.7;margin-bottom:2rem;}
.bor4sige-wp .s-perks{display:flex;gap:2rem;margin-top:3rem;justify-content:center;flex-wrap:wrap;}
.bor4sige-wp .s-perk{display:flex;align-items:center;gap:.5rem;font-size:.85rem;color:var(--c-muted);}

/* ── SCROLL REVEAL ── */
.bor4sige-wp .s-reveal{opacity:0;transform:translateY(30px);transition:opacity .7s ease,transform .7s ease;}
.bor4sige-wp .s-reveal.visible{opacity:1;transform:translateY(0);}

/* ── RESPONSIVE ── */
@media(max-width:900px){
  .bor4sige-wp .s-ai-layout,.bor4sige-wp .s-chat-layout{grid-template-columns:1fr;}
  .bor4sige-wp .s-stats-grid{grid-template-columns:1fr 1fr;}
  .bor4sige-wp .s-stat-box{border-right:1px solid var(--c-border);border-bottom:1px solid var(--c-border);}
}
@media(max-width:600px){
  .bor4sige-wp .s-features-grid{grid-template-columns:1fr;}
  .bor4sige-wp .s-stats-grid{grid-template-columns:1fr 1fr;}
}
</style>

<!-- ═══════════════════════════════════════════════
     CONTENIDO — Bor4SIGE LANDING PAGE (WordPress)
     ═══════════════════════════════════════════════ -->
<div class="bor4sige-wp">

  <!-- HERO -->
  <section class="s-hero">
    <div class="s-orb s-orb-1"></div>
    <div class="s-orb s-orb-2"></div>
    <div class="s-orb s-orb-3"></div>

    <div class="s-badge">
      <span class="s-badge-dot"></span>
      Sistema Integrado de Gestión Empresarial
    </div>

    <h1>
      Gestión normativa<br />
      <span class="s-grad-text">inteligente y unificada</span>
    </h1>

    <p class="s-hero-sub">
      <strong>Bor4SIGE</strong> centraliza el cumplimiento de las principales normas ISO y el Esquema Nacional de Seguridad en una sola plataforma, potenciada con Inteligencia Artificial para auditorías automáticas y seguimiento continuo.
    </p>

    <div class="s-hero-actions">
      <a href="#contacto-sige" class="s-btn-p">🚀 Solicitar acceso</a>
      <a href="#funcionalidades-sige" class="s-btn-s">Descubrir funcionalidades ↓</a>
    </div>

    <div class="s-hero-stats">
      <div style="text-align:center">
        <div class="s-stat-num">10+</div>
        <div class="s-stat-label">Normas ISO &amp; ENS</div>
      </div>
      <div style="text-align:center">
        <div class="s-stat-num">30+</div>
        <div class="s-stat-label">Módulos integrados</div>
      </div>
      <div style="text-align:center">
        <div class="s-stat-num">100%</div>
        <div class="s-stat-label">Offline-first</div>
      </div>
      <div style="text-align:center">
        <div class="s-stat-num">IA</div>
        <div class="s-stat-label">Cumplimiento automático</div>
      </div>
    </div>
  </section>

  <!-- NORMAS STRIP -->
  <div class="s-normas-strip">
    <div class="s-normas-track">
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#2563eb">9001</div><span class="s-norma-name">ISO 9001 — Calidad</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#16a34a">14001</div><span class="s-norma-name">ISO 14001 — Medio Ambiente</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#ea580c">45001</div><span class="s-norma-name">ISO 45001 — SST</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#7c3aed">27001</div><span class="s-norma-name">ISO 27001 — Seguridad Info.</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#0891b2">22301</div><span class="s-norma-name">ISO 22301 — Continuidad</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#be185d">37001</div><span class="s-norma-name">ISO 37001 — Anti-Soborno</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#b45309">37301</div><span class="s-norma-name">ISO 37301 — Compliance</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#0d9488">20000</div><span class="s-norma-name">ISO 20000 — ITSM</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#6d28d9">27701</div><span class="s-norma-name">ISO 27701 — Privacidad</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#1d4ed8">ENS</div><span class="s-norma-name">ENS — Esquema Nacional de Seguridad</span></div>
      <!-- duplicado para loop infinito -->
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#2563eb">9001</div><span class="s-norma-name">ISO 9001 — Calidad</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#16a34a">14001</div><span class="s-norma-name">ISO 14001 — Medio Ambiente</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#ea580c">45001</div><span class="s-norma-name">ISO 45001 — SST</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#7c3aed">27001</div><span class="s-norma-name">ISO 27001 — Seguridad Info.</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#0891b2">22301</div><span class="s-norma-name">ISO 22301 — Continuidad</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#be185d">37001</div><span class="s-norma-name">ISO 37001 — Anti-Soborno</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#b45309">37301</div><span class="s-norma-name">ISO 37301 — Compliance</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#0d9488">20000</div><span class="s-norma-name">ISO 20000 — ITSM</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#6d28d9">27701</div><span class="s-norma-name">ISO 27701 — Privacidad</span></div>
      <div class="s-norma-item"><div class="s-norma-icon" style="background:#1d4ed8">ENS</div><span class="s-norma-name">ENS — Esquema Nacional de Seguridad</span></div>
    </div>
  </div>

  <!-- FUNCIONALIDADES -->
  <section id="funcionalidades-sige">
    <div class="s-inner">
      <div class="s-features-hdr s-reveal">
        <div class="s-label">Funcionalidades</div>
        <h2 class="s-title">Todo lo que necesitas<br />en una sola plataforma</h2>
        <p class="s-desc" style="margin:0 auto">Bor4SIGE integra gestión de calidad, seguridad, medio ambiente, compliance y servicios TI en un entorno unificado, intuitivo y potente.</p>
      </div>
      <div class="s-features-grid">
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(59,130,246,.15)">📊</div>
          <div class="s-fcard-title">Cuadro de Mando Integral</div>
          <div class="s-fcard-desc">Dashboard ejecutivo en tiempo real con KPIs de todos los sistemas de gestión, semáforo de cumplimiento y métricas ENS unificadas.</div>
          <div class="s-ftags"><span class="s-ftag">KPIs</span><span class="s-ftag">Tiempo Real</span><span class="s-ftag">ENS</span></div>
        </div>
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(139,92,246,.15)">🤖</div>
          <div class="s-fcard-title">IA para Cumplimiento Normativo</div>
          <div class="s-fcard-desc">Motor de inteligencia artificial que escanea continuamente los datos del sistema, detecta desviaciones y genera alertas de cumplimiento proactivas.</div>
          <div class="s-ftags"><span class="s-ftag">Machine Learning</span><span class="s-ftag">Alertas automáticas</span><span class="s-ftag">CAPA</span></div>
        </div>
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(16,185,129,.15)">📁</div>
          <div class="s-fcard-title">Gestión Documental Avanzada</div>
          <div class="s-fcard-desc">Control total de documentos, procedimientos y registros con control de versiones, estados y responsables. Cumple con el requisito 7.5 de las normas ISO.</div>
          <div class="s-ftags"><span class="s-ftag">ISO 9001 §7.5</span><span class="s-ftag">Control de versiones</span></div>
        </div>
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(6,182,212,.15)">🔍</div>
          <div class="s-fcard-title">Gestión de Auditorías</div>
          <div class="s-fcard-desc">Planificación, seguimiento y cierre de auditorías internas y externas. Registro de hallazgos, no conformidades y acciones correctivas (CAPA).</div>
          <div class="s-ftags"><span class="s-ftag">ISO 19011</span><span class="s-ftag">No conformidades</span><span class="s-ftag">CAPA</span></div>
        </div>
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(245,158,11,.15)">⚖️</div>
          <div class="s-fcard-title">Cumplimiento Legal &amp; ENS</div>
          <div class="s-fcard-desc">Registro y seguimiento de obligaciones legales. Mapa de cumplimiento del Esquema Nacional de Seguridad (Alto, Medio, Bajo).</div>
          <div class="s-ftags"><span class="s-ftag">ENS</span><span class="s-ftag">Requisitos legales</span><span class="s-ftag">RGPD</span></div>
        </div>
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(239,68,68,.15)">🛡️</div>
          <div class="s-fcard-title">Gestión de Incidentes de Seguridad</div>
          <div class="s-fcard-desc">Registro, clasificación y seguimiento de incidentes de seguridad de la información con trazabilidad completa según ISO 27001 y ENS.</div>
          <div class="s-ftags"><span class="s-ftag">ISO 27001</span><span class="s-ftag">ENS</span><span class="s-ftag">Trazabilidad</span></div>
        </div>
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(16,185,129,.15)">🌱</div>
          <div class="s-fcard-title">Gestión Ambiental &amp; Climática</div>
          <div class="s-fcard-desc">Evaluación de aspectos ambientales, control operacional y análisis de riesgos derivados del cambio climático.</div>
          <div class="s-ftags"><span class="s-ftag">ISO 14001</span><span class="s-ftag">Cambio Climático</span></div>
        </div>
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(249,115,22,.15)">⛑️</div>
          <div class="s-fcard-title">Seguridad y Salud en el Trabajo</div>
          <div class="s-fcard-desc">Investigación de accidentes, evaluación de riesgos laborales y seguimiento de indicadores SST. Cumplimiento integral de ISO 45001.</div>
          <div class="s-ftags"><span class="s-ftag">ISO 45001</span><span class="s-ftag">Investigación accidentes</span></div>
        </div>
        <div class="s-fcard s-reveal">
          <div class="s-fcard-icon" style="background:rgba(139,92,246,.15)">💬</div>
          <div class="s-fcard-title">Chatbot Asistente Virtual</div>
          <div class="s-fcard-desc">Asistente inteligente integrado para consultas sobre operativa de la aplicación y requisitos normativos. Disponible en todo momento.</div>
          <div class="s-ftags"><span class="s-ftag">IA Conversacional</span><span class="s-ftag">Soporte normativo</span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS BAND -->
  <div class="s-stats-band s-reveal">
    <div class="s-inner" style="padding:0">
      <div class="s-stats-grid">
        <div class="s-stat-box"><div class="s-snum" id="sige-c1">0</div><div class="s-slabel">Módulos integrados</div></div>
        <div class="s-stat-box"><div class="s-snum" id="sige-c2">0</div><div class="s-slabel">Normas soportadas</div></div>
        <div class="s-stat-box"><div class="s-snum" id="sige-c3">0</div><div class="s-slabel">Controles ENS cubiertos</div></div>
        <div class="s-stat-box"><div class="s-snum" id="sige-c4">0</div><div class="s-slabel">% Operación offline</div></div>
      </div>
    </div>
  </div>

  <!-- MÓDULOS -->
  <section class="s-mods-bg">
    <div class="s-inner">
      <div class="s-reveal" style="text-align:center;margin-bottom:2rem">
        <div class="s-label" style="justify-content:center">Módulos</div>
        <h2 class="s-title">Una suite completa de gestión</h2>
        <p class="s-desc" style="margin:1rem auto">Cada área del sistema de gestión tiene su propio módulo especializado.</p>
      </div>
      <div class="s-mods-grid s-reveal">
        <div class="s-mcard"><div class="s-mcard-icon">📊</div><div class="s-mcard-title">Cuadro de Mando</div><div class="s-mcard-norm">Dashboard Integral</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">📁</div><div class="s-mcard-title">Gestión Documental</div><div class="s-mcard-norm">ISO 9001 §7.5</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🔍</div><div class="s-mcard-title">Auditorías &amp; Acciones</div><div class="s-mcard-norm">ISO 19011</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🗺️</div><div class="s-mcard-title">Mapa de Procesos</div><div class="s-mcard-norm">ISO 9001 §4.4</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">📈</div><div class="s-mcard-title">KPIs de Proceso</div><div class="s-mcard-norm">Indicadores</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🧑‍🤝‍🧑</div><div class="s-mcard-title">Partes Interesadas</div><div class="s-mcard-norm">ISO §4.2</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🚦</div><div class="s-mcard-title">Gestión de Riesgos</div><div class="s-mcard-norm">ISO 31000</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🏆</div><div class="s-mcard-title">Satisfacción del Cliente</div><div class="s-mcard-norm">ISO 9001 §9.1.2</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🎓</div><div class="s-mcard-title">Eficacia de Formación</div><div class="s-mcard-norm">Kirkpatrick 4 niveles</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🛒</div><div class="s-mcard-title">Evaluación Proveedores</div><div class="s-mcard-norm">ISO 9001 §8.4</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🔒</div><div class="s-mcard-title">Incidentes de Seguridad</div><div class="s-mcard-norm">ISO 27001</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">💻</div><div class="s-mcard-title">Cambios TI</div><div class="s-mcard-norm">ISO 20000 / ITIL</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">📋</div><div class="s-mcard-title">Catálogo de Servicios TI</div><div class="s-mcard-norm">ISO 20000</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🌱</div><div class="s-mcard-title">Aspectos Ambientales</div><div class="s-mcard-norm">ISO 14001 §6.1.2</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🌡️</div><div class="s-mcard-title">Riesgos Climáticos</div><div class="s-mcard-norm">ISO 14064</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">⛑️</div><div class="s-mcard-title">Accidentes SST</div><div class="s-mcard-norm">ISO 45001 §10.2</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">📢</div><div class="s-mcard-title">Canal de Denuncias</div><div class="s-mcard-norm">ISO 37001 / 37301</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🎯</div><div class="s-mcard-title">Revisión por la Dirección</div><div class="s-mcard-norm">ISO §9.3</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">⚖️</div><div class="s-mcard-title">Requisitos Legales &amp; ENS</div><div class="s-mcard-norm">ENS / RGPD</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">🔭</div><div class="s-mcard-title">Análisis DAFO</div><div class="s-mcard-norm">ISO §4.1</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">📜</div><div class="s-mcard-title">Políticas del SGI</div><div class="s-mcard-norm">ISO §5.2</div></div>
        <div class="s-mcard"><div class="s-mcard-icon">📄</div><div class="s-mcard-title">Informes Ejecutivos</div><div class="s-mcard-norm">Previsualización PDF</div></div>
      </div>
    </div>
  </section>

  <!-- IA -->
  <section class="s-ai-bg">
    <div class="s-inner">
      <div class="s-ai-layout">
        <div class="s-reveal">
          <div class="s-aicard">
            <div class="s-scan"></div>
            <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:1.25rem;">
              <span style="font-size:1.5rem">🤖</span>
              <div><div style="font-weight:700;font-size:.9rem">Motor de IA — Auditoría Continua</div><div style="font-size:.72rem;color:var(--c-muted)">Escaneo activo</div></div>
              <div style="margin-left:auto;display:flex;align-items:center;gap:.4rem;font-size:.72rem;color:#10b981"><span style="width:7px;height:7px;background:#10b981;border-radius:50%;display:inline-block;animation:sige-pulse 2s infinite"></span>ACTIVO</div>
            </div>
            <div class="s-alert s-alert-ok"><div class="s-adot" style="background:#10b981"></div><div><strong style="color:#10b981">CONFORME</strong><br/><span style="color:var(--c-muted)">ISO 9001 §8.4 · Evaluación de proveedores al día. Puntuación media: 88/100.</span></div></div>
            <div class="s-alert s-alert-warn"><div class="s-adot" style="background:#f59e0b"></div><div><strong style="color:#f59e0b">ALERTA</strong><br/><span style="color:var(--c-muted)">RFC-2024-089 · Sin aprobación de cambio TI tras 5 días. Acción correctiva recomendada.</span></div></div>
            <div class="s-alert s-alert-info"><div class="s-adot" style="background:#3b82f6"></div><div><strong style="color:#3b82f6">MEJORA</strong><br/><span style="color:var(--c-muted)">Formación ISO 45001 · Eficacia 62%. Se sugiere refuerzo de unidad 3 (EPIs).</span></div></div>
            <div class="s-alert s-alert-ok"><div class="s-adot" style="background:#10b981"></div><div><strong style="color:#10b981">CONFORME</strong><br/><span style="color:var(--c-muted)">ENS · Nivel de seguridad ALTO mantenido. Auditoría interna superada sin hallazgos.</span></div></div>
          </div>
        </div>
        <div class="s-reveal">
          <div class="s-label">Inteligencia Artificial</div>
          <h2 class="s-title">Cumplimiento normativo<br />que se gestiona solo</h2>
          <p class="s-desc">El motor de IA analiza continuamente todos los datos para detectar incumplimientos antes de que se conviertan en no conformidades.</p>
          <ul class="s-ai-ul">
            <li><span style="color:#10b981;font-size:1rem">✦</span><div><strong>Escaneo periódico automático</strong><br/><span style="color:var(--c-muted);font-size:.85rem">Revisa planes de acción, proveedores, formación y cambios TI de forma continua.</span></div></li>
            <li><span style="color:#10b981;font-size:1rem">✦</span><div><strong>Alertas proactivas por desviación</strong><br/><span style="color:var(--c-muted);font-size:.85rem">Detecta umbrales de riesgo y genera recomendaciones antes de que el auditor llegue.</span></div></li>
            <li><span style="color:#10b981;font-size:1rem">✦</span><div><strong>Registro de evidencia automático</strong><br/><span style="color:var(--c-muted);font-size:.85rem">Cada alerta queda registrada con timestamp para uso en auditorías externas.</span></div></li>
            <li><span style="color:#10b981;font-size:1rem">✦</span><div><strong>Asistente chatbot normativo</strong><br/><span style="color:var(--c-muted);font-size:.85rem">Responde preguntas sobre requisitos ISO, cómo usar módulos y cómo resolver desviaciones.</span></div></li>
          </ul>
        </div>
      </div>
    </div>
  </section>

  <!-- NORMAS -->
  <section>
    <div class="s-inner">
      <div class="s-reveal" style="text-align:center;margin-bottom:1rem">
        <div class="s-label" style="justify-content:center">Normas de Referencia</div>
        <h2 class="s-title">10 normas. Una sola plataforma.</h2>
        <p class="s-desc" style="margin:1rem auto">Bor4SIGE cubre el ciclo de vida completo de cumplimiento para las principales normas internacionales y el esquema español de seguridad.</p>
      </div>
      <div class="s-std-grid">
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#2563eb"></div><div class="s-std-badge" style="background:#2563eb">ISO 9001</div><div class="s-std-name">Calidad</div><div class="s-std-desc">Gestión de la calidad y mejora continua de procesos.</div><div class="s-std-bar"><div class="s-std-fill" style="width:85%;background:linear-gradient(90deg,#2563eb,#60a5fa)"></div></div><div class="s-std-pct">85%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#16a34a"></div><div class="s-std-badge" style="background:#16a34a">ISO 14001</div><div class="s-std-name">Medio Ambiente</div><div class="s-std-desc">Gestión ambiental y reducción del impacto en el entorno.</div><div class="s-std-bar"><div class="s-std-fill" style="width:60%;background:linear-gradient(90deg,#16a34a,#4ade80)"></div></div><div class="s-std-pct">60%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#ea580c"></div><div class="s-std-badge" style="background:#ea580c">ISO 45001</div><div class="s-std-name">SST</div><div class="s-std-desc">Seguridad y salud en el trabajo para proteger a las personas.</div><div class="s-std-bar"><div class="s-std-fill" style="width:72%;background:linear-gradient(90deg,#ea580c,#fb923c)"></div></div><div class="s-std-pct">72%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#7c3aed"></div><div class="s-std-badge" style="background:#7c3aed">ISO 27001</div><div class="s-std-name">Seguridad Info.</div><div class="s-std-desc">Protección de la información y gestión de riesgos de seguridad.</div><div class="s-std-bar"><div class="s-std-fill" style="width:82%;background:linear-gradient(90deg,#7c3aed,#a78bfa)"></div></div><div class="s-std-pct">82%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#0891b2"></div><div class="s-std-badge" style="background:#0891b2">ISO 22301</div><div class="s-std-name">Continuidad</div><div class="s-std-desc">Continuidad de negocio y resiliencia ante interrupciones.</div><div class="s-std-bar"><div class="s-std-fill" style="width:76%;background:linear-gradient(90deg,#0891b2,#22d3ee)"></div></div><div class="s-std-pct">76%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#be185d"></div><div class="s-std-badge" style="background:#be185d">ISO 37001</div><div class="s-std-name">Anti-Soborno</div><div class="s-std-desc">Sistemas de gestión anti-soborno y prevención de la corrupción.</div><div class="s-std-bar"><div class="s-std-fill" style="width:84%;background:linear-gradient(90deg,#be185d,#f472b6)"></div></div><div class="s-std-pct">84%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#b45309"></div><div class="s-std-badge" style="background:#b45309">ISO 37301</div><div class="s-std-name">Compliance</div><div class="s-std-desc">Gestión del cumplimiento normativo y ético corporativo.</div><div class="s-std-bar"><div class="s-std-fill" style="width:78%;background:linear-gradient(90deg,#b45309,#fbbf24)"></div></div><div class="s-std-pct">78%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#0d9488"></div><div class="s-std-badge" style="background:#0d9488">ISO 20000</div><div class="s-std-name">ITSM</div><div class="s-std-desc">Gestión de servicios TI y catálogo ITIL-alineado.</div><div class="s-std-bar"><div class="s-std-fill" style="width:70%;background:linear-gradient(90deg,#0d9488,#2dd4bf)"></div></div><div class="s-std-pct">70%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#6d28d9"></div><div class="s-std-badge" style="background:#6d28d9">ISO 27701</div><div class="s-std-name">Privacidad</div><div class="s-std-desc">Protección de datos personales y cumplimiento RGPD.</div><div class="s-std-bar"><div class="s-std-fill" style="width:81%;background:linear-gradient(90deg,#6d28d9,#c4b5fd)"></div></div><div class="s-std-pct">81%</div></div>
        <div class="s-std-card s-reveal"><div class="s-std-glow" style="background:#1d4ed8"></div><div class="s-std-badge" style="background:#1d4ed8">ENS</div><div class="s-std-name">Esquema Nac. Seguridad</div><div class="s-std-desc">Cumplimiento ENS español en dimensiones C·I·D·A·T.</div><div class="s-std-bar"><div class="s-std-fill" style="width:78%;background:linear-gradient(90deg,#1d4ed8,#60a5fa)"></div></div><div class="s-std-pct">78%</div></div>
      </div>
    </div>
  </section>

  <!-- CHATBOT DEMO -->
  <section class="s-chat-bg">
    <div class="s-inner">
      <div class="s-chat-layout">
        <div class="s-reveal">
          <div class="s-label">Asistente Virtual</div>
          <h2 class="s-title">Pregunta cualquier cosa<br/>sobre las normas</h2>
          <p class="s-desc">El chatbot integrado responde preguntas sobre los módulos, requisitos de las normas ISO y cómo resolver desviaciones de cumplimiento.</p>
          <ul class="s-ai-ul" style="margin-top:2rem">
            <li><span style="color:#10b981">💬</span><span style="font-size:.85rem">Consultas sobre requisitos de normas ISO y ENS</span></li>
            <li><span style="color:#10b981">🔗</span><span style="font-size:.85rem">Navegación directa a los módulos desde el chat</span></li>
            <li><span style="color:#10b981">📋</span><span style="font-size:.85rem">Explicación de cómo registrar documentos, auditorías y más</span></li>
            <li><span style="color:#10b981">🧠</span><span style="font-size:.85rem">Respuestas contextualizadas al marco normativo de tu organización</span></li>
          </ul>
        </div>
        <div class="s-chat-win s-reveal">
          <div class="s-chat-hdr">
            <div class="s-chat-av">🤖</div>
            <div><div class="s-chat-name">Asistente Bor4SIGE</div><div class="s-chat-status">● En línea</div></div>
          </div>
          <div class="s-chat-body">
            <div class="s-cmsg"><div class="s-cbubble s-cbot">¡Hola! Soy tu asistente de Bor4SIGE. Puedo ayudarte con los módulos o explicarte requisitos de las normas ISO y ENS. ¿En qué puedo ayudarte?</div></div>
            <div class="s-cmsg user"><div class="s-cbubble s-cuser">¿Cómo gestiono una no conformidad en ISO 9001?</div></div>
            <div class="s-cmsg"><div class="s-cbubble s-cbot">Según la cláusula <strong>10.2 de ISO 9001</strong>, debes:<br/><br/>1️⃣ Registrar la no conformidad<br/>2️⃣ Determinar su causa raíz<br/>3️⃣ Implementar una acción correctiva (CAPA)<br/>4️⃣ Verificar la eficacia<br/><br/>Puedes hacerlo en el módulo <em>Auditorías &amp; Acciones</em>. ¿Quieres que te lleve allí?</div></div>
          </div>
          <div class="s-chat-in">
            <input class="s-chat-field" placeholder="Escribe tu pregunta..." type="text" readonly />
            <button class="s-chat-send">➤</button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- CTA -->
  <section class="s-cta" id="contacto-sige">
    <div class="s-inner">
      <div class="s-cta-box s-reveal">
        <div class="s-label" style="justify-content:center;margin-bottom:1.5rem">Comienza ahora</div>
        <h2>¿Listo para transformar<br/>tu gestión normativa?</h2>
        <p>Bor4SIGE funciona tanto en red local como offline desde un pendrive. Sin dependencias de nube, sin suscripciones. Tu dato, tu control.</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;margin-top:0">
          <a href="#" class="s-btn-p">🚀 Solicitar acceso a Bor4SIGE</a>
          <a href="#" class="s-btn-s">📖 Descargar Manual de Uso</a>
        </div>
        <div class="s-perks">
          <div class="s-perk"><span style="color:#10b981">✓</span> Instalación en 5 minutos</div>
          <div class="s-perk"><span style="color:#10b981">✓</span> Sin necesidad de internet</div>
          <div class="s-perk"><span style="color:#10b981">✓</span> Multiusuario en red local</div>
          <div class="s-perk"><span style="color:#10b981">✓</span> Paquete portable (pendrive)</div>
        </div>
      </div>
    </div>
  </section>

</div><!-- /.bor4sige-wp -->

<script>
(function(){
  /* ── SCROLL REVEAL ── */
  var revEls = document.querySelectorAll('.bor4sige-wp .s-reveal');
  var ro = new IntersectionObserver(function(entries){
    entries.forEach(function(e,i){
      if(e.isIntersecting){
        setTimeout(function(){ e.target.classList.add('visible'); }, i*80);
        ro.unobserve(e.target);
      }
    });
  },{threshold:0.08});
  revEls.forEach(function(el){ ro.observe(el); });

  /* ── COUNTER ── */
  function animCount(el,target,suffix,dur){
    var start=0, step=target/(dur/16);
    var t=setInterval(function(){
      start+=step;
      if(start>=target){ el.textContent=target+suffix; clearInterval(t); return; }
      el.textContent=Math.floor(start)+suffix;
    },16);
  }
  var statsEl = document.querySelector('.bor4sige-wp .s-stats-band');
  if(statsEl){
    var so = new IntersectionObserver(function(entries){
      if(entries[0].isIntersecting){
        animCount(document.getElementById('sige-c1'),30,'+',1800);
        animCount(document.getElementById('sige-c2'),10,'+',1800);
        animCount(document.getElementById('sige-c3'),75,'+',1800);
        animCount(document.getElementById('sige-c4'),100,'%',1800);
        so.disconnect();
      }
    },{threshold:0.3});
    so.observe(statsEl);
  }
})();
</script>

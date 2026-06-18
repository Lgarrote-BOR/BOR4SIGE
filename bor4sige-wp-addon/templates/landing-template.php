<?php
/**
 * landing-template.php
 * Plantilla interactiva y bilingüe para la landing page de Bor4D & BOR4SIGE.
 */
$initial_lang = 'lang-es';
if (isset($sige_lang) && $sige_lang === 'en') {
    $initial_lang = 'lang-en';
}
?>

<!-- Fuentes (Inter y Space Grotesk) -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

<style>
/* ── RESET Y CONFIGURACIÓN SCOPE ── */
.bor4sige-wp *, .bor4sige-wp *::before, .bor4sige-wp *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.bor4sige-wp {
  --c-bg:        #030712;
  --c-surface:   #0b0f19;
  --c-surface-lg: #111827;
  --c-border:    rgba(255, 255, 255, 0.06);
  --c-text:      #f3f4f6;
  --c-muted:     #9ca3af;
  --c-accent1:   #2563eb; /* Azul corporativo */
  --c-accent2:   #7c3aed; /* Violeta */
  --c-accent3:   #06b6d4; /* Turquesa */
  --c-green:     #10b981;
  --c-orange:    #f59e0b;
  --gradient-main: linear-gradient(135deg, #1e1b4b 0%, #030712 50%, #082f49 100%);
  --gradient-accent: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
  --gradient-card: linear-gradient(145deg, #0b0f19 0%, #111827 100%);
  --font-main: 'Inter', sans-serif;
  --font-head: 'Space Grotesk', sans-serif;

  font-family: var(--font-main);
  color: var(--c-text);
  line-height: 1.6;
  background: var(--c-bg);
  overflow-x: hidden;
  width: 100%;
  padding-bottom: 3rem;
}

/* ── VISIBILIDAD DE IDIOMAS ── */
.bor4sige-wp.lang-es .sige-lang-en { display: none !important; }
.bor4sige-wp.lang-en .sige-lang-es { display: none !important; }

/* ── NAVEGACIÓN Y CABECERA ── */
.bor4sige-wp .sige-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(3, 7, 18, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--c-border);
  padding: 1rem 2rem;
}
.bor4sige-wp .sige-nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.bor4sige-wp .sige-logo {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
}
.bor4sige-wp .sige-logo-icon {
  font-size: 1.5rem;
  background: var(--gradient-accent);
  padding: 0.3rem;
  border-radius: 8px;
  line-height: 1;
}
.bor4sige-wp .sige-logo-text {
  font-family: var(--font-head);
  font-weight: 800;
  font-size: 1.35rem;
  color: #fff;
  letter-spacing: -0.5px;
}
.bor4sige-wp .sige-logo-sub {
  font-size: 0.65rem;
  color: var(--c-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 700;
}
.bor4sige-wp .sige-nav-links {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  list-style: none;
}
.bor4sige-wp .sige-nav-link {
  font-family: var(--font-head);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--c-muted);
  padding: 0.5rem 0.9rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  background: transparent;
  border: none;
}
.bor4sige-wp .sige-nav-link:hover,
.bor4sige-wp .sige-nav-link.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}
.bor4sige-wp .sige-nav-link.active {
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  border-bottom: 2px solid var(--c-accent1);
}
.bor4sige-wp .sige-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.bor4sige-wp .sige-lang-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--c-border);
  color: #fff;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  transition: all 0.2s ease;
}
.bor4sige-wp .sige-lang-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.2);
}

/* ── PESTAÑAS (TABS CONTENT) ── */
.bor4sige-wp .sige-tab-content {
  display: none;
  opacity: 0;
  transform: translateY(15px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.bor4sige-wp .sige-tab-content.active {
  display: block;
  opacity: 1;
  transform: translateY(0);
}

/* ── ESTILOS COMPARTIDOS SECCIONES ── */
.bor4sige-wp .sige-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 2rem;
}
.bor4sige-wp .s-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(37, 99, 235, 0.12);
  border: 1px solid rgba(37, 99, 235, 0.25);
  border-radius: 100px;
  padding: 0.4rem 1rem;
  font-size: 0.75rem;
  font-weight: 700;
  color: #93c5fd;
  margin-bottom: 1.5rem;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.bor4sige-wp .s-badge-dot {
  width: 6px;
  height: 6px;
  background: #3b82f6;
  border-radius: 50%;
  box-shadow: 0 0 8px #3b82f6;
}
.bor4sige-wp .sige-title-lg {
  font-family: var(--font-head);
  font-size: clamp(2rem, 5vw, 3.8rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -1.5px;
  margin-bottom: 1rem;
}
.bor4sige-wp .sige-grad-text {
  background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #22d3ee 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.bor4sige-wp .sige-lead {
  font-size: clamp(1rem, 2vw, 1.15rem);
  color: var(--c-muted);
  max-width: 780px;
  margin-bottom: 2.5rem;
}

/* ── INICIO (HOME) ── */
.bor4sige-wp .home-hero {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 5rem;
  padding-bottom: 4rem;
  position: relative;
  overflow: hidden;
}
.bor4sige-wp .home-hero::before {
  content: '';
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 300px;
  background: radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%);
  filter: blur(50px);
  pointer-events: none;
}
.bor4sige-wp .home-hero-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 4rem;
}
.bor4sige-wp .s-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 2rem;
  border-radius: 12px;
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 0.95rem;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}
.bor4sige-wp .s-btn-primary {
  background: var(--gradient-accent);
  color: #fff;
  box-shadow: 0 4px 25px rgba(124, 58, 237, 0.35);
}
.bor4sige-wp .s-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 30px rgba(124, 58, 237, 0.5);
}
.bor4sige-wp .s-btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  color: var(--c-text);
  border: 1px solid var(--c-border);
}
.bor4sige-wp .s-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

/* COMPLIANCE SCANNER MOCK */
.bor4sige-wp .scanner-container {
  width: 100%;
  max-width: 900px;
  background: var(--gradient-card);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  padding: 2.2rem;
  text-align: left;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
  position: relative;
  overflow: hidden;
}
.bor4sige-wp .scanner-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, var(--c-accent3), transparent);
  animation: scanner-scan 4s linear infinite;
}
@keyframes scanner-scan {
  0% { top: 0; opacity: 0.1; }
  50% { top: 100%; opacity: 1; }
  100% { top: 0; opacity: 0.1; }
}
.bor4sige-wp .scanner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--c-border);
  padding-bottom: 1rem;
}
.bor4sige-wp .scanner-title {
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.bor4sige-wp .scanner-status {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--c-green);
  background: rgba(16, 185, 129, 0.12);
  padding: 0.3rem 0.75rem;
  border-radius: 30px;
  text-transform: uppercase;
}
.bor4sige-wp .scanner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}
.bor4sige-wp .scanner-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
}
.bor4sige-wp .scanner-item:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}
.bor4sige-wp .scanner-item-name {
  font-size: 0.85rem;
  font-weight: 600;
}
.bor4sige-wp .scanner-item-badge {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  text-transform: uppercase;
}
.bor4sige-wp .s-badge-ok { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.bor4sige-wp .s-badge-warn { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }

/* ── COMPAÑÍA (ABOUT US) ── */
.bor4sige-wp .about-grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}
.bor4sige-wp .about-card {
  background: var(--gradient-card);
  border: 1px solid var(--c-border);
  border-radius: 16px;
  padding: 2.2rem;
  position: relative;
  transition: all 0.3s ease;
}
.bor4sige-wp .about-card:hover {
  transform: translateY(-4px);
  border-color: rgba(124, 58, 237, 0.25);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);
}
.bor4sige-wp .about-card-icon {
  font-size: 2rem;
  margin-bottom: 1.25rem;
  background: rgba(255, 255, 255, 0.04);
  width: 52px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid var(--c-border);
}
.bor4sige-wp .about-card-title {
  font-family: var(--font-head);
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
}
.bor4sige-wp .about-card-desc {
  font-size: 0.9rem;
  color: var(--c-muted);
}
.bor4sige-wp .about-specs-title {
  font-family: var(--font-head);
  font-size: 1.8rem;
  font-weight: 800;
  margin-top: 5rem;
  margin-bottom: 2rem;
  text-align: center;
}
.bor4sige-wp .specs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.25rem;
}
.bor4sige-wp .spec-box {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.2s ease;
}
.bor4sige-wp .spec-box:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-2px);
}
.bor4sige-wp .spec-box-icon {
  font-size: 1.5rem;
  margin-bottom: 0.75rem;
}
.bor4sige-wp .spec-box-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.bor4sige-wp .spec-box-desc {
  font-size: 0.8rem;
  color: var(--c-muted);
}

/* ── PRODUCTO STAR (BOR4SIGE) ── */
.bor4sige-wp .product-ai-engine {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
  margin-top: 4rem;
}
.bor4sige-wp .ai-interactive-panel {
  background: var(--gradient-card);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}
.bor4sige-wp .ai-interactive-panel h4 {
  font-family: var(--font-head);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.bor4sige-wp .ai-alerts-box {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-height: 220px;
  max-height: 220px;
  overflow-y: auto;
  margin-bottom: 1.25rem;
}
.bor4sige-wp .ai-alert-card {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-size: 0.8rem;
  display: flex;
  gap: 0.6rem;
  align-items: flex-start;
  animation: slide-in-alert 0.3s ease;
}
@keyframes slide-in-alert {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}
.bor4sige-wp .ai-alert-ok { background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); }
.bor4sige-wp .ai-alert-warn { background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); }
.bor4sige-wp .ai-alert-dot { width: 7px; height: 7px; border-radius: 50%; margin-top: 5px; flex-shrink: 0; }
.bor4sige-wp .ai-alert-ok .ai-alert-dot { background: var(--c-green); }
.bor4sige-wp .ai-alert-warn .ai-alert-dot { background: var(--c-orange); }

.bor4sige-wp .ai-simulator-btn {
  background: var(--gradient-accent);
  color: #fff;
  width: 100%;
  border: none;
  padding: 0.75rem;
  border-radius: 10px;
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}
.bor4sige-wp .ai-simulator-btn:hover {
  opacity: 0.95;
  transform: translateY(-1px);
}
.bor4sige-wp .ai-desc-list {
  list-style: none;
}
.bor4sige-wp .ai-desc-list li {
  margin-bottom: 1.5rem;
  display: flex;
  gap: 0.8rem;
  align-items: flex-start;
}
.bor4sige-wp .ai-desc-check {
  color: var(--c-accent3);
  font-size: 1.25rem;
  line-height: 1;
}
.bor4sige-wp .ai-desc-title {
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}
.bor4sige-wp .ai-desc-text {
  font-size: 0.85rem;
  color: var(--c-muted);
}
.bor4sige-wp .product-modules-title {
  font-family: var(--font-head);
  font-size: 1.8rem;
  font-weight: 800;
  margin-top: 5rem;
  margin-bottom: 2rem;
  text-align: center;
}
.bor4sige-wp .product-modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1rem;
}
.bor4sige-wp .p-mod-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--c-border);
  border-radius: 12px;
  padding: 1.25rem;
  transition: all 0.2s ease;
}
.bor4sige-wp .p-mod-card:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}
.bor4sige-wp .p-mod-card-icon {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}
.bor4sige-wp .p-mod-card-title {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}
.bor4sige-wp .p-mod-card-desc {
  font-size: 0.75rem;
  color: var(--c-muted);
}

/* ── ECOSISTEMA DE SERVICIOS (FICHAS) ── */
.bor4sige-wp .services-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2.5rem;
  margin-top: 2rem;
}
.bor4sige-wp .services-sidebar {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.bor4sige-wp .service-side-btn {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--c-border);
  color: var(--c-muted);
  text-align: left;
  padding: 0.85rem 1.2rem;
  border-radius: 10px;
  font-family: var(--font-head);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.bor4sige-wp .service-side-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}
.bor4sige-wp .service-side-btn.active {
  color: #fff;
  background: var(--gradient-accent);
  border-color: transparent;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.2);
}
.bor4sige-wp .service-side-arrow {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.bor4sige-wp .service-side-btn.active .service-side-arrow {
  opacity: 1;
}

.bor4sige-wp .service-detail-container {
  background: var(--gradient-card);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  position: relative;
  min-height: 480px;
}
.bor4sige-wp .service-detail-tab {
  display: none;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.bor4sige-wp .service-detail-tab.active {
  display: block;
  opacity: 1;
}
.bor4sige-wp .service-detail-hdr {
  border-bottom: 1px solid var(--c-border);
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
}
.bor4sige-wp .service-detail-badge {
  display: inline-block;
  background: var(--c-accent1);
  color: #fff;
  font-family: var(--font-head);
  font-size: 0.75rem;
  font-weight: 800;
  padding: 0.25rem 0.6rem;
  border-radius: 6px;
  margin-bottom: 0.75rem;
}
.bor4sige-wp .service-detail-title {
  font-family: var(--font-head);
  font-size: 1.6rem;
  font-weight: 800;
}
.bor4sige-wp .service-block {
  margin-bottom: 1.5rem;
}
.bor4sige-wp .service-block-title {
  font-family: var(--font-head);
  font-weight: 700;
  font-size: 0.95rem;
  color: #3b82f6;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.bor4sige-wp .service-block-text {
  font-size: 0.85rem;
  color: var(--c-text);
  line-height: 1.7;
}
.bor4sige-wp .service-block-ul {
  list-style: none;
  margin-top: 0.5rem;
}
.bor4sige-wp .service-block-ul li {
  font-size: 0.85rem;
  color: var(--c-text);
  margin-bottom: 0.5rem;
  padding-left: 1.25rem;
  position: relative;
}
.bor4sige-wp .service-block-ul li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: var(--c-green);
  font-weight: bold;
}

/* ── CONTACTO ── */
.bor4sige-wp .contact-layout {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 4rem;
  margin-top: 3rem;
}
.bor4sige-wp .contact-info {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
.bor4sige-wp .contact-info-title {
  font-family: var(--font-head);
  font-size: 1.6rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}
.bor4sige-wp .contact-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}
.bor4sige-wp .contact-item-icon {
  font-size: 1.5rem;
  background: rgba(255, 255, 255, 0.04);
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--c-border);
}
.bor4sige-wp .contact-item-label {
  font-size: 0.75rem;
  color: var(--c-muted);
  font-weight: 700;
  text-transform: uppercase;
}
.bor4sige-wp .contact-item-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  margin-top: 0.15rem;
}
.bor4sige-wp .contact-form {
  background: var(--gradient-card);
  border: 1px solid var(--c-border);
  border-radius: 20px;
  padding: 2.2rem;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
}
.bor4sige-wp .contact-form-group {
  margin-bottom: 1.25rem;
}
.bor4sige-wp .contact-form-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--c-muted);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
}
.bor4sige-wp .contact-form-input,
.bor4sige-wp .contact-form-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--c-border);
  border-radius: 8px;
  padding: 0.75rem 1rem;
  color: var(--c-text);
  font-family: var(--font-main);
  font-size: 0.85rem;
  outline: none;
  transition: all 0.2s ease;
}
.bor4sige-wp .contact-form-input:focus,
.bor4sige-wp .contact-form-textarea:focus {
  border-color: var(--c-accent1);
  background: rgba(255, 255, 255, 0.05);
}

/* ── RESPONSIVE ── */
@media(max-width: 900px) {
  .bor4sige-wp .sige-nav-links { display: none; }
  .bor4sige-wp .product-ai-engine,
  .bor4sige-wp .services-layout,
  .bor4sige-wp .contact-layout {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
}
</style>

<!-- PORTAL COMPLETO DE CONTENIDO -->
<div class="bor4sige-wp <?php echo esc_attr($initial_lang); ?>" id="sige-showcase">

  <!-- CABECERA -->
  <header class="sige-header">
    <div class="sige-nav-container">
      <a href="#home" class="sige-logo" onclick="sigeSwitchTab('home', event)">
        <span class="sige-logo-icon">🛡️</span>
        <div>
          <span class="sige-logo-text">Bor4D</span>
          <div class="sige-logo-sub">Technology</div>
        </div>
      </a>
      
      <!-- Menú principal (Tabs switcher) -->
      <nav>
        <ul class="sige-nav-links">
          <li>
            <button class="sige-nav-link active" onclick="sigeSwitchTab('home', event)" id="nav-btn-home">
              <span class="sige-lang-es">Inicio</span>
              <span class="sige-lang-en">Home</span>
            </button>
          </li>
          <li>
            <button class="sige-nav-link" onclick="sigeSwitchTab('about', event)" id="nav-btn-about">
              <span class="sige-lang-es">Quiénes Somos</span>
              <span class="sige-lang-en">About Us</span>
            </button>
          </li>
          <li>
            <button class="sige-nav-link" onclick="sigeSwitchTab('product', event)" id="nav-btn-product">
              <span class="sige-lang-es">BOR4SIGE (Core &amp; AI)</span>
              <span class="sige-lang-en">BOR4SIGE (Core &amp; AI)</span>
            </button>
          </li>
          <li>
            <button class="sige-nav-link" onclick="sigeSwitchTab('services', event)" id="nav-btn-services">
              <span class="sige-lang-es">Ecosistema Servicios</span>
              <span class="sige-lang-en">Services Ecosystem</span>
            </button>
          </li>
          <li>
            <button class="sige-nav-link" onclick="sigeSwitchTab('contact', event)" id="nav-btn-contact">
              <span class="sige-lang-es">Contacto</span>
              <span class="sige-lang-en">Contact</span>
            </button>
          </li>
        </ul>
      </nav>

      <div class="sige-controls">
        <!-- Conmutador de idiomas -->
        <button class="sige-lang-btn" onclick="sigeToggleLanguage()" title="Cambiar idioma / Change language">
          🌐 <span class="sige-lang-es">EN</span><span class="sige-lang-en">ES</span>
        </button>
      </div>
    </div>
  </header>

  <!-- ================= TAB 1: INICIO (HOME) ================= -->
  <main class="sige-tab-content active" id="tab-home">
    <section class="sige-section home-hero">
      <div class="s-badge">
        <span class="s-badge-dot"></span>
        <span class="sige-lang-es">Evolución Tecnológica y Cumplimiento Normativo</span>
        <span class="sige-lang-en">Technological Evolution and Regulatory Compliance</span>
      </div>

      <h1 class="sige-title-lg">
        <span class="sige-lang-es">Gobernanza corporativa e <br/><span class="sige-grad-text">Inteligencia Artificial</span></span>
        <span class="sige-lang-en">Corporate Governance and <br/><span class="sige-grad-text">Artificial Intelligence</span></span>
      </h1>

      <p class="sige-lead">
        <span class="sige-lang-es"><strong>Bor4D</strong> diseña soluciones y servicios profesionales de vanguardia. Digitalizamos, automatizamos y unificamos la conformidad con las normativas ISO y el Esquema Nacional de Seguridad bajo nuestra plataforma diferencial <strong>BOR4SIGE</strong>, garantizando resiliencia y éxito organizativo.</span>
        <span class="sige-lang-en"><strong>Bor4D</strong> designs cutting-edge solutions and professional services. We digitalize, automate, and unify compliance with ISO standards and the Spanish National Security Scheme (ENS) under our flagship platform <strong>BOR4SIGE</strong>, guaranteeing resilience and organizational success.</span>
      </p>

      <div class="home-hero-actions">
        <button class="s-btn s-btn-primary" onclick="sigeSwitchTab('product', event)">
          <span class="sige-lang-es">Explorar BOR4SIGE</span>
          <span class="sige-lang-en">Explore BOR4SIGE</span>
        </button>
        <button class="s-btn s-btn-secondary" onclick="sigeSwitchTab('services', event)">
          <span class="sige-lang-es">Ecosistema de Servicios</span>
          <span class="sige-lang-en">Services Ecosystem</span>
        </button>
      </div>

      <!-- Compliance Scanner Preview -->
      <div class="scanner-container">
        <div class="scanner-glow"></div>
        <div class="scanner-header">
          <div class="scanner-title">
            🤖 <span class="sige-lang-es">Dashboard Corporativo de Cumplimiento Activo</span>
            <span class="sige-lang-en">Active Corporate Compliance Dashboard</span>
          </div>
          <div class="scanner-status">
            <span class="sige-lang-es">Sistema Conforme</span>
            <span class="sige-lang-en">System Compliant</span>
          </div>
        </div>
        <div class="scanner-grid">
          <div class="scanner-item">
            <span class="scanner-item-name">ISO 9001:2015</span>
            <span class="scanner-item-badge s-badge-ok">OK</span>
          </div>
          <div class="scanner-item">
            <span class="scanner-item-name">ISO 27001:2023</span>
            <span class="scanner-item-badge s-badge-ok">OK</span>
          </div>
          <div class="scanner-item">
            <span class="scanner-item-name">ENS RD 311/2022</span>
            <span class="scanner-item-badge s-badge-ok">OK</span>
          </div>
          <div class="scanner-item">
            <span class="scanner-item-name">RGPD UE</span>
            <span class="scanner-item-badge s-badge-ok">OK</span>
          </div>
          <div class="scanner-item">
            <span class="scanner-item-name">ISO 45001:2018</span>
            <span class="scanner-item-badge s-badge-warn">WARN</span>
          </div>
        </div>
      </div>
    </section>
  </main>

  <!-- ================= TAB 2: COMPAÑÍA (QUIÉNES SOMOS) ================= -->
  <div class="sige-tab-content" id="tab-about">
    <section class="sige-section">
      <div class="s-badge">
        <span class="s-badge-dot"></span>
        <span class="sige-lang-es">Bor4D Technology &amp; Professional Services</span>
        <span class="sige-lang-en">Bor4D Technology &amp; Professional Services</span>
      </div>

      <h2 class="sige-title-lg">
        <span class="sige-lang-es">Liderando la transición hacia la <br/><span class="sige-grad-text">Nueva Economía Inteligente</span></span>
        <span class="sige-lang-en">Leading the Transition towards the <br/><span class="sige-grad-text">New Smart Economy</span></span>
      </h2>

      <p class="sige-lead">
        <span class="sige-lang-es">El equipo fundador de Bor4D cuenta con una sólida y enriquecedora trayectoria multidisciplinar e internacional de más de veinte años en consultoría de desarrollo de negocio, internacionalización, servicios basados en tecnología, estructuración financiera de proyectos e infraestructuras inteligentes. Nos posicionamos en el mercado global como aliados estratégicos para la transformación integral de organizaciones públicas y privadas.</span>
        <span class="sige-lang-en">The founding team of Bor4D has accumulated over more than twenty years of diverse and enriching multidisciplinary and international experience in Business Development Consulting, Internationalization, Technology-Based Services and Solutions, Financial Structuring of Projects, and Smart Infrastructures. We position ourselves in the global market as an integral strategic partner for the transformation of public and private organizations.</span>
      </p>

      <!-- Compromiso y los 3 Pilares -->
      <div class="about-card" style="margin-bottom: 3rem;">
        <div class="about-card-title">
          <span class="sige-lang-es">Comprometidos con la "New Smart Economy"</span>
          <span class="sige-lang-en">Committed to the "New Smart Economy"</span>
        </div>
        <p class="about-card-desc" style="font-size: 0.95rem; line-height: 1.7; margin-bottom: 2rem;">
          <span class="sige-lang-es">En Bor4D estamos plenamente comprometidos con un modelo económico sostenible y avanzado que denominamos la "Nueva Economía Inteligente". Este modelo consiste en la gestión eficiente, responsable y absolutamente sostenible de los recursos organizacionales, utilizando la información estructurada y el conocimiento profundo como palancas definitivas para maximizar la productividad y la competitividad de los procesos de producción y servicios.</span>
          <span class="sige-lang-en">At Bor4D, we are fully committed to a sustainable and advanced economic model we call the "New Smart Economy". This model consists of the efficient, responsible, and sustainable management of resources, using structured information and deep knowledge as definitive levers to maximize productivity and competitiveness in production and service processes.</span>
        </p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
          <div class="spec-box">
            <div class="spec-box-title">📊 Info Management</div>
            <div class="spec-box-desc">
              <span class="sige-lang-es">Captura, integridad y explotación analítica de datos.</span>
              <span class="sige-lang-en">Capture, integrity, and analytical data exploitation.</span>
            </div>
          </div>
          <div class="spec-box">
            <div class="spec-box-title">⚙️ Advanced Technology</div>
            <div class="spec-box-desc">
              <span class="sige-lang-es">Automatización, Inteligencia Artificial y arquitecturas escalables.</span>
              <span class="sige-lang-en">Automation, Artificial Intelligence, and scalable architectures.</span>
            </div>
          </div>
          <div class="spec-box">
            <div class="spec-box-title">🧠 Knowledge Capitalization</div>
            <div class="spec-box-desc">
              <span class="sige-lang-es">Transferencia de la experiencia experta al núcleo del negocio.</span>
              <span class="sige-lang-en">Transfer of expert experience into the core of the business.</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Áreas de Especialización -->
      <h3 class="about-specs-title">
        <span class="sige-lang-es">Modelo Operacional y Áreas de Especialización</span>
        <span class="sige-lang-en">Operational Model and Areas of Specialization</span>
      </h3>
      <div class="about-grid-3">
        <div class="about-card">
          <div class="about-card-icon">📋</div>
          <div class="about-card-title">
            <span class="sige-lang-es">Sistemas de Gestión Avanzados</span>
            <span class="sige-lang-en">Advanced Management Systems</span>
          </div>
          <div class="about-card-desc">
            <span class="sige-lang-es">Consultoría y auditoría especializada para la optimización y certificación de marcos normativos internacionales y nacionales sobre la plataforma core BOR4SIGE.</span>
            <span class="sige-lang-en">Specialized consulting and auditing for the optimization and certification of international and national regulatory frameworks on the BOR4SIGE core platform.</span>
          </div>
        </div>

        <div class="about-card">
          <div class="about-card-icon">📈</div>
          <div class="about-card-title">
            <span class="sige-lang-es">Estrategia Corporativa</span>
            <span class="sige-lang-en">Corporate Strategy</span>
          </div>
          <div class="about-card-desc">
            <span class="sige-lang-es">Transformación organizacional, rediseño de estructuras de gobernanza, eficiencia de costes, auditoría financiera estratégica y proyecciones de resiliencia empresarial.</span>
            <span class="sige-lang-en">Organizational transformation, governance structure redesign, cost efficiency, strategic financial auditing, and corporate resilience projections.</span>
          </div>
        </div>

        <div class="about-card">
          <div class="about-card-icon">💻</div>
          <div class="about-card-title">
            <span class="sige-lang-es">Ecosistemas Digitales &amp; e-Commerce</span>
            <span class="sige-lang-en">Digital Ecosystems &amp; e-Commerce</span>
          </div>
          <div class="about-card-desc">
            <span class="sige-lang-es">Desarrollo de plataformas web robustas y escalables de última generación (React, Node.js, Next.js) y arquitecturas headless complejas.</span>
            <span class="sige-lang-en">Development of robust and scalable next-generation web platforms (React, Node.js, Next.js) and complex headless architectures.</span>
          </div>
        </div>

        <div class="about-card">
          <div class="about-card-icon">🤖</div>
          <div class="about-card-title">
            <span class="sige-lang-es">Soluciones de Inteligencia Artificial (AI)</span>
            <span class="sige-lang-en">Artificial Intelligence (AI) Solutions</span>
          </div>
          <div class="about-card-desc">
            <span class="sige-lang-es">Integración de capacidades predictivas, modelos de lenguaje avanzados (LLM), agentes conversacionales e inteligencia de negocio para la automatización inteligente.</span>
            <span class="sige-lang-en">Integration of predictive capabilities, advanced language models (LLMs), conversational agents, and business intelligence for smart automation.</span>
          </div>
        </div>

        <div class="about-card">
          <div class="about-card-icon">🏙️</div>
          <div class="about-card-title">
            <span class="sige-lang-es">Smart Cities e Infraestructuras</span>
            <span class="sige-lang-en">Smart Cities &amp; Infrastructures</span>
          </div>
          <div class="about-card-desc">
            <span class="sige-lang-es">Planificación, diseño estratégico y despliegue de modelos de ciudad inteligente, eficiencia energética y movilidad urbana avanzada.</span>
            <span class="sige-lang-en">Planning, strategic design, and deployment of smart city models, energy efficiency, and advanced urban mobility.</span>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- ================= TAB 3: PRODUCTO (BOR4SIGE) ================= -->
  <div class="sige-tab-content" id="tab-product">
    <section class="sige-section">
      <div class="s-badge">
        <span class="s-badge-dot"></span>
        <span class="sige-lang-es">Producto Estrella / Star Product</span>
        <span class="sige-lang-en">Product Core / Star Product</span>
      </div>

      <h2 class="sige-title-lg">
        <span class="sige-lang-es">La revolución digital en la automatización de <br/><span class="sige-grad-text">ISOs y Marcos de Seguridad</span></span>
        <span class="sige-lang-en">The digital revolution in the automation of <br/><span class="sige-grad-text">ISOs and Security Frameworks</span></span>
      </h2>

      <p class="sige-lead">
        <span class="sige-lang-es"><strong>BOR4SIGE</strong> representa la evolución inteligente del software pionero SIGE 1.0 concebido originalmente en 1999. Este ecosistema tecnológico unifica e integra bajo una potente capa de Inteligencia Artificial la gestión operativa de cualquier estándar normativo del mercado.</span>
        <span class="sige-lang-en"><strong>BOR4SIGE</strong> represents the smart evolution of the pioneering SIGE 1.0 software originally conceived in 1999. This technological ecosystem unifies and integrates under a powerful Artificial Intelligence layer the operational management of any regulatory standard in the market.</span>
      </p>

      <!-- AI Engine Section -->
      <div class="product-ai-engine">
        <div>
          <h3 style="font-family: var(--font-head); font-size: 1.8rem; font-weight: 800; margin-bottom: 1.5rem;">
            <span class="sige-lang-es">El Motor BOR4SIGE AI Engine</span>
            <span class="sige-lang-en">The BOR4SIGE AI Engine</span>
          </h3>
          <p style="color: var(--c-muted); margin-bottom: 2rem; font-size: 0.95rem; line-height: 1.7;">
            <span class="sige-lang-es">A diferencia de las herramientas genéricas del mercado que operan como meros repositorios documentales estáticos, el valor diferencial de BOR4SIGE radica en la profunda capa de conocimiento práctico embebida en su código. Su nuevo <strong>AI Evolution Dashboard</strong> actúa como un copiloto experto que supervisa el estado de salud global de la empresa en tiempo real:</span>
            <span class="sige-lang-en">Unlike generic tools on the market that act as mere static document repositories, the differential value of BOR4SIGE lies in the deep layer of practical knowledge embedded in its code. Its new <strong>AI Evolution Dashboard</strong> acts as an expert co-pilot that monitors the overall health status of the company in real time:</span>
          </p>

          <ul class="ai-desc-list">
            <li>
              <div class="ai-desc-check">✦</div>
              <div>
                <div class="ai-desc-title">
                  <span class="sige-lang-es">Análisis Predictivo de Riesgos</span>
                  <span class="sige-lang-en">Predictive Risk Analysis</span>
                </div>
                <div class="ai-desc-text">
                  <span class="sige-lang-es">Identificación proactiva de desviaciones operacionales y vulnerabilidades antes de que afecten a la conformidad del sistema.</span>
                  <span class="sige-lang-en">Proactive identification of operational deviations and vulnerabilities before they affect system compliance.</span>
                </div>
              </div>
            </li>
            <li>
              <div class="ai-desc-check">✦</div>
              <div>
                <div class="ai-desc-title">
                  <span class="sige-lang-es">Alertas Normativas de Alto Impacto</span>
                  <span class="sige-lang-en">High-Impact Regulatory Alerts</span>
                </div>
                <div class="ai-desc-text">
                  <span class="sige-lang-es">Monitorización automatizada de cambios legislativos, reformas laborales y actualizaciones normativas, emitiendo recomendaciones inmediatas de adaptación.</span>
                  <span class="sige-lang-en">Automated monitoring of legislative changes, labor reforms, and regulatory updates, issuing immediate adaptation recommendations.</span>
                </div>
              </div>
            </li>
            <li>
              <div class="ai-desc-check">✦</div>
              <div>
                <div class="ai-desc-title">
                  <span class="sige-lang-es">Triaje Automatizado de Incidencias</span>
                  <span class="sige-lang-en">Automated Incident Triaging</span>
                </div>
                <div class="ai-desc-text">
                  <span class="sige-lang-es">Clasificación y priorización inteligente de hallazgos, desviaciones y tareas de los sistemas de gestión integrados.</span>
                  <span class="sige-lang-en">Intelligent classification and prioritization of findings, deviations, and tasks of the integrated management systems.</span>
                </div>
              </div>
            </li>
          </ul>
        </div>

        <!-- AI Panel Simulador Interactivo -->
        <div class="ai-interactive-panel">
          <div class="scanner-glow"></div>
          <h4>
            🤖 <span class="sige-lang-es">Simulador del Copiloto BOR4SIGE AI</span>
            <span class="sige-lang-en">BOR4SIGE AI Co-pilot Simulator</span>
          </h4>
          <div class="ai-alerts-box" id="ai-sim-box">
            <div class="ai-alert-card ai-alert-ok">
              <div class="ai-alert-dot"></div>
              <div>
                <span class="sige-lang-es"><strong>SISTEMA PREPARADO</strong>: Selecciona "Escanear Organización" para iniciar simulación.</span>
                <span class="sige-lang-en"><strong>SYSTEM READY</strong>: Click "Scan Organization" to initiate the simulation.</span>
              </div>
            </div>
          </div>
          <button class="ai-simulator-btn" onclick="sigeTriggerAiSim()">
            <span>⚡</span>
            <span class="sige-lang-es">Ejecutar Escaneo de Auditoría Continua</span>
            <span class="sige-lang-en">Execute Continuous Audit Scan</span>
          </button>
        </div>
      </div>

      <!-- Módulos Core -->
      <h3 class="product-modules-title">
        <span class="sige-lang-es">Características Técnicas y Módulos Core</span>
        <span class="sige-lang-en">Technical Features and Core Modules</span>
      </h3>
      <div class="product-modules-grid">
        <div class="p-mod-card">
          <div class="p-mod-card-icon">🔄</div>
          <div class="p-mod-card-title">
            <span class="sige-lang-es">Gestión Basada en Procesos</span>
            <span class="sige-lang-en">Process-Based Management</span>
          </div>
          <div class="p-mod-card-desc">
            <span class="sige-lang-es">Mapeo holístico de flujos de trabajo, definición automatizada de entradas, salidas, KPIs y responsabilidades directas.</span>
            <span class="sige-lang-en">Holistic workflow mapping, automated definition of inputs, outputs, KPIs, and direct responsibilities.</span>
          </div>
        </div>

        <div class="p-mod-card">
          <div class="p-mod-card-icon">⚡</div>
          <div class="p-mod-card-title">
            <span class="sige-lang-es">Análisis de Contexto Dinámico</span>
            <span class="sige-lang-en">Dynamic Context Analysis</span>
          </div>
          <div class="p-mod-card-desc">
            <span class="sige-lang-es">Cuadros de mando integrales para la evaluación de partes interesadas, análisis DAFO interactivos y matrices de riesgos correlacionadas.</span>
            <span class="sige-lang-en">Integrated dashboards for stakeholder assessment, interactive SWOT analysis, and correlated risk matrices.</span>
          </div>
        </div>

        <div class="p-mod-card">
          <div class="p-mod-card-icon">👥</div>
          <div class="p-mod-card-title">
            <span class="sige-lang-es">Capital Humano y Competencias</span>
            <span class="sige-lang-en">Human Capital &amp; Competencies</span>
          </div>
          <div class="p-mod-card-desc">
            <span class="sige-lang-es">Fichas de personal avanzadas, perfiles por puesto y control automatizado de planes de formación continua para mitigar la brecha formativa.</span>
            <span class="sige-lang-en">Advanced staff files, job profiles, and automated tracking of continuous training plans to mitigate skill gaps.</span>
          </div>
        </div>

        <div class="p-mod-card">
          <div class="p-mod-card-icon">🔧</div>
          <div class="p-mod-card-title">
            <span class="sige-lang-es">Control de Infraestructuras</span>
            <span class="sige-lang-en">Infrastructure Control</span>
          </div>
          <div class="p-mod-card-desc">
            <span class="sige-lang-es">Inventario de equipamiento crítico de producción y seguimiento riguroso de planes de mantenimiento preventivo y calibración.</span>
            <span class="sige-lang-en">Critical production equipment inventory and rigorous tracking of preventive maintenance and calibration plans.</span>
          </div>
        </div>

        <div class="p-mod-card">
          <div class="p-mod-card-icon">🤝</div>
          <div class="p-mod-card-title">
            <span class="sige-lang-es">Control de Proveedores</span>
            <span class="sige-lang-en">Supplier Control</span>
          </div>
          <div class="p-mod-card-desc">
            <span class="sige-lang-es">Gestión del ciclo de vida de colaboradores externos mediante cuestionarios de evaluación cuantitativa e incidencias automatizadas.</span>
            <span class="sige-lang-en">External contributors' lifecycle management via quantitative assessment questionnaires and automated incidents.</span>
          </div>
        </div>

        <div class="p-mod-card">
          <div class="p-mod-card-icon">📂</div>
          <div class="p-mod-card-title">
            <span class="sige-lang-es">Gobierno Documental Absoluto</span>
            <span class="sige-lang-en">Absolute Document Governance</span>
          </div>
          <div class="p-mod-card-desc">
            <span class="sige-lang-es">Creación, revisión, control de versiones en vigor y archivo digital seguro con trazabilidad e integridad total de registros.</span>
            <span class="sige-lang-en">Creation, review, active version control, and secure digital archive with complete traceability and record integrity.</span>
          </div>
        </div>

        <div class="p-mod-card">
          <div class="p-mod-card-icon">🎯</div>
          <div class="p-mod-card-title">
            <span class="sige-lang-es">Mejora Continua Integrada</span>
            <span class="sige-lang-en">Integrated Improvement Cycle</span>
          </div>
          <div class="p-mod-card-desc">
            <span class="sige-lang-es">Gestión unificada de no conformidades, desviaciones, acciones de mejora, planes de auditoría interna y cuadros de mando analíticos.</span>
            <span class="sige-lang-en">Unified management of non-conformities, deviations, improvement actions, internal audit plans, and analytical dashboards.</span>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- ================= TAB 4: ECOSISTEMA DE SERVICIOS (FICHAS) ================= -->
  <div class="sige-tab-content" id="tab-services">
    <section class="sige-section">
      <div class="s-badge">
        <span class="s-badge-dot"></span>
        <span class="sige-lang-es">Ecosistema de Servicios</span>
        <span class="sige-lang-en">Services Ecosystem</span>
      </div>

      <h2 class="sige-title-lg">
        <span class="sige-lang-es">Fichas de Servicios y <br/><span class="sige-grad-text">Cumplimiento Normativo</span></span>
        <span class="sige-lang-en">Service Sheets and <br/><span class="sige-grad-text">Regulatory Compliance</span></span>
      </h2>

      <p class="sige-lead">
        <span class="sige-lang-es">Nuestros servicios de consultoría estratégica y tecnológica se apoyan sobre el núcleo de <strong>BOR4SIGE</strong> para digitalizar el cumplimiento y garantizar certificaciones exitosas.</span>
        <span class="sige-lang-en">Our strategic and technological consulting services rely on the core of <strong>BOR4SIGE</strong> to digitalize compliance and guarantee successful certifications.</span>
      </p>

      <div class="services-layout">
        <!-- Sidebar de Servicios -->
        <div class="services-sidebar">
          <button class="service-side-btn active" onclick="sigeSwitchService('ens')" id="srv-btn-ens">
            <span>🛡️ ENS RD 311/2022</span>
            <span class="service-side-arrow">→</span>
          </button>
          <button class="service-side-btn" onclick="sigeSwitchService('iso27001')" id="srv-btn-iso27001">
            <span>🔒 ISO 27001:2023</span>
            <span class="service-side-arrow">→</span>
          </button>
          <button class="service-side-btn" onclick="sigeSwitchService('iso22301')" id="srv-btn-iso22301">
            <span>🔄 ISO 22301:2020</span>
            <span class="service-side-arrow">→</span>
          </button>
          <button class="service-side-btn" onclick="sigeSwitchService('compliance')" id="srv-btn-compliance">
            <span>⚖️ Compliance &amp; Antisoborno</span>
            <span class="service-side-arrow">→</span>
          </button>
          <button class="service-side-btn" onclick="sigeSwitchService('privacy')" id="srv-btn-privacy">
            <span>👤 Privacidad &amp; RGPD</span>
            <span class="service-side-arrow">→</span>
          </button>
          <button class="service-side-btn" onclick="sigeSwitchService('iso9001')" id="srv-btn-iso9001">
            <span>🏅 ISO 9001:2015 (Calidad)</span>
            <span class="service-side-arrow">→</span>
          </button>
          <button class="service-side-btn" onclick="sigeSwitchService('iso14001')" id="srv-btn-iso14001">
            <span>🌱 ISO 14001:2015 (M. Amb.)</span>
            <span class="service-side-arrow">→</span>
          </button>
          <button class="service-side-btn" onclick="sigeSwitchService('iso45001')" id="srv-btn-iso45001">
            <span>⛑️ ISO 45001:2018 (SST)</span>
            <span class="service-side-arrow">→</span>
          </button>
        </div>

        <!-- Panel de Detalle del Servicio Activo -->
        <div class="service-detail-container">
          
          <!-- FICHA 1: ENS -->
          <div class="service-detail-tab active" id="srv-detail-ens">
            <div class="service-detail-hdr">
              <span class="service-detail-badge">RD 311/2022</span>
              <h3 class="service-detail-title">
                <span class="sige-lang-es">Esquema Nacional de Seguridad (ENS)</span>
                <span class="sige-lang-en">Spanish National Security Scheme (ENS)</span>
              </h3>
            </div>
            
            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Introducción y Contexto Legal</span>
                <span class="sige-lang-en">Introduction and Legal Context</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">La ciberseguridad y la protección de los activos digitales son prioridades estratégicas ineludibles. El Real Decreto 311/2022 impone un paradigma de "Vigilancia Continua" y prevención proactiva. Su cumplimiento es obligatorio para las administraciones públicas en España y todas las empresas del sector privado que les presten servicios tecnológicos, afectando a toda la cadena de suministro.</span>
                <span class="sige-lang-en">Cybersecurity and digital asset protection are inescapable strategic priorities. Royal Decree 311/2022 imposes a paradigm of "Continuous Vigilance" and proactive prevention. Compliance is strictly mandatory for public administrations in Spain and all private sector companies providing them with technological services, affecting the entire supply chain.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Principios y Requisitos del Servicio</span>
                <span class="sige-lang-en">Principles and Service Requirements</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Nuestros proyectos de implantación garantizan los 7 principios básicos y 15 requisitos mínimos: control de accesos por mínimo privilegio, autenticación multifactor (MFA), protección de datos almacenados y en tránsito, registro pormenorizado de la actividad (logs), detección de código dañino y reporte inmediato de incidentes en un plazo máximo de 72 horas.</span>
                <span class="sige-lang-en">Our implementation projects guarantee the 7 basic principles and 15 minimum requirements: access control by minimum privilege, multi-factor authentication (MFA), protection of data in transit and at rest, activity logging, malware detection, and mandatory incident notification within 72 hours.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Despliegue Automatizado con la Plataforma BOR4SIGE</span>
                <span class="sige-lang-en">Automated Deployment with BOR4SIGE Platform</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Evitamos las metodologías en papel tradicionales estructurando el ENS en la plataforma BOR4SIGE en cuatro fases guiadas:</span>
                <span class="sige-lang-en">We avoid traditional paper-based methodologies by structuring the ENS in the BOR4SIGE platform in four guided phases:</span>
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es"><strong>Plan de Adecuación</strong>: Categorización automatizada (Básica, Media, Alta) y Declaración de Aplicabilidad provisional.</span>
                    <span class="sige-lang-en"><strong>Adequacy Plan</strong>: Automated categorization (Basic, Medium, High) and provisional Statement of Applicability.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Gestión de Riesgos</strong>: Análisis de riesgos integrado bajo metodología MAGERIT.</span>
                    <span class="sige-lang-en"><strong>Risk Management</strong>: Integrated risk analysis using the MAGERIT methodology.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Implantación del Marco Digital</strong>: Despliegue automático de las 40 medidas de seguridad del Anexo II.</span>
                    <span class="sige-lang-en"><strong>Digital Framework Implementation</strong>: Automated deployment of the 40 security measures of Annex II.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Gobernanza INES</strong>: Generación automática de las métricas e indicadores requeridos por el Centro Criptológico Nacional (CCN).</span>
                    <span class="sige-lang-en"><strong>INES Governance</strong>: Automatic generation of metrics and indicators required by the National Cryptologic Center (CCN).</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Beneficios Corporativos Obtenidos</span>
                <span class="sige-lang-en">Corporate Benefits Obtained</span>
              </div>
              <div class="service-block-text">
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es">Acceso obligatorio a licitaciones y contratos públicos en España.</span>
                    <span class="sige-lang-en">Mandatory access to public tenders and contracts in Spain.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Garantía total de resiliencia y blindaje ante ciberataques.</span>
                    <span class="sige-lang-en">Total guarantee of resilience and shielding against cyberattacks.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Tasa de éxito de certificación externa cercana al 100%.</span>
                    <span class="sige-lang-en">External certification success rate close to 100%.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FICHA 2: ISO 27001 -->
          <div class="service-detail-tab" id="srv-detail-iso27001">
            <div class="service-detail-hdr">
              <span class="service-detail-badge">ISO/IEC 27001:2023</span>
              <h3 class="service-detail-title">
                <span class="sige-lang-es">Gestión de la Seguridad de la Información (SGSI)</span>
                <span class="sige-lang-en">Information Security Management (ISMS)</span>
              </h3>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Contexto Operacional y Normativo</span>
                <span class="sige-lang-en">Operational and Normative Context</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">La información corporativa es el activo más valioso. La norma internacional UNE-EN ISO/IEC 27001:2023 representa el estándar global para implementar un Sistema de Gestión de la Seguridad de la Información (SGSI) sólido, protegiendo el Know-How estratégico y asegurando la conformidad regulatoria (RGPD, HIPAA, PCI-DSS).</span>
                <span class="sige-lang-en">Corporate information is the most valuable asset. The international standard UNE-EN ISO/IEC 27001:2023 represents the global standard for implementing a robust Information Security Management System (ISMS), protecting strategic Know-How and ensuring regulatory compliance (GDPR, HIPAA, PCI-DSS).</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">La Tríada de Seguridad CID</span>
                <span class="sige-lang-en">The CID Security Triad</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Nuestros proyectos garantizan la protección de la Tríada CID: Confidencialidad (acceso solo a usuarios autorizados), Integridad (exactitud e inalterabilidad de los datos) y Disponibilidad (acceso a los recursos cuando se precise), junto con mecanismos de trazabilidad, autenticidad y no repudio.</span>
                <span class="sige-lang-en">Our projects guarantee the protection of the CID Triad: Confidentiality (access restricted to authorized users), Integrity (data accuracy and unalterability), and Availability (immediate access to resources when needed), alongside traceability, authenticity, and non-repudiation mechanisms.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Despliegue Automatizado con la Plataforma BOR4SIGE</span>
                <span class="sige-lang-en">Automated Deployment with BOR4SIGE Platform</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">La consultoría de Bor4D digitaliza el SGSI a través de BOR4SIGE para superar los 93 controles normativos de forma ágil:</span>
                <span class="sige-lang-en">Bor4D consulting digitalizes the ISMS through BOR4SIGE to easily clear the 93 regulatory controls:</span>
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es"><strong>Inventario de Activos</strong>: Identificación y registro dinámico de todos los activos de información.</span>
                    <span class="sige-lang-en"><strong>Asset Inventory</strong>: Dynamic identification and registration of all information assets.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Clasificación y Etiquetado</strong>: Establecimiento de matrices de seguridad automatizadas basadas en impacto.</span>
                    <span class="sige-lang-en"><strong>Classification &amp; Labeling</strong>: Establishment of automated security matrices based on impact.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Análisis de Riesgos</strong>: Evaluación automatizada de vulnerabilidades y amenazas bajo metodología MAGERIT.</span>
                    <span class="sige-lang-en"><strong>Risk Analysis</strong>: Automated assessment of vulnerabilities and threats using the MAGERIT methodology.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Declaración de Aplicabilidad (SOA)</strong>: Generación automática del documento oficial requerido por certificadoras.</span>
                    <span class="sige-lang-en"><strong>Statement of Applicability (SOA)</strong>: Automatic generation of the official document required by certification bodies.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Beneficios Corporativos Obtenidos</span>
                <span class="sige-lang-en">Corporate Benefits Obtained</span>
              </div>
              <div class="service-block-text">
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es">Reducción drástica de incidentes y brechas de seguridad informática.</span>
                    <span class="sige-lang-en">Drastic reduction in IT security incidents and data breaches.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Blindaje de la confianza de clientes corporativos y socios comerciales.</span>
                    <span class="sige-lang-en">Shielding trust of corporate clients and business partners.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Integración fluida con el Esquema Nacional de Seguridad (ENS).</span>
                    <span class="sige-lang-en">Seamless integration with the National Security Scheme (ENS).</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FICHA 3: ISO 22301 -->
          <div class="service-detail-tab" id="srv-detail-iso22301">
            <div class="service-detail-hdr">
              <span class="service-detail-badge">ISO 22301:2020</span>
              <h3 class="service-detail-title">
                <span class="sige-lang-es">Continuidad de Negocio y Resiliencia</span>
                <span class="sige-lang-en">Business Continuity and Resilience</span>
              </h3>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Introducción y Resiliencia Corporativa</span>
                <span class="sige-lang-en">Introduction and Corporate Resilience</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">La inactividad operativa prolongada debido a incidentes tecnológicos, desastres naturales o crisis de suministro puede causar pérdidas catastróficas. La norma UNE-EN ISO 22301:2020 constituye el estándar internacional de excelencia para dotar a las empresas de una resiliencia avanzada.</span>
                <span class="sige-lang-en">Prolonged operational downtime due to technological incidents, natural disasters, or supply crises can cause catastrophic losses. The UNE-EN ISO 22301:2020 standard constitutes the international standard of excellence to provide companies with advanced resilience.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Pilares de la Continuidad</span>
                <span class="sige-lang-en">Pillars of Continuity</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Diseñamos una arquitectura de respuesta estructurada en tres componentes esenciales: Respuesta Temprana ante Emergencias (salvaguardar recursos), Manejo de Crisis (gobernanza y comités de crisis) y Continuidad y Recuperación Operativa (reanudación normal de procesos clave).</span>
                <span class="sige-lang-en">We design a response architecture structured into three essential components: Early Emergency Response (resource safeguarding), Crisis Management (governance and crisis committees), and Operational Continuity &amp; Recovery (normal resumption of key processes).</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Despliegue Automatizado con la Plataforma BOR4SIGE</span>
                <span class="sige-lang-en">Automated Deployment with BOR4SIGE Platform</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Bor4D optimiza los plazos de implantación del SGCN integrando herramientas metodológicas avanzadas dentro de BOR4SIGE:</span>
                <span class="sige-lang-en">Bor4D optimizes BCMS implementation timelines by integrating advanced methodological tools inside BOR4SIGE:</span>
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es"><strong>BIA Automatizado (Business Impact Analysis)</strong>: Cuantificación del impacto de la interrupción y definición de tiempos objetivos de recuperación (RTO/RPO).</span>
                    <span class="sige-lang-en"><strong>Automated BIA (Business Impact Analysis)</strong>: Quantification of interruption impact and definition of recovery time objectives (RTO/RPO).</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Evaluación de Riesgos</strong>: Identificación proactiva de debilidades de infraestructura y cadena de suministro según ISO 31000.</span>
                    <span class="sige-lang-en"><strong>Risk Assessment</strong>: Proactive identification of infrastructure and supply chain weaknesses according to ISO 31000.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Orquestación de Planes de Continuidad (PCN)</strong>: Generación automatizada de planes y guías paso a paso para el personal técnico.</span>
                    <span class="sige-lang-en"><strong>Continuity Plans Orchestration (BCP)</strong>: Automated generation of plans and step-by-step guides for technical personnel.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Simulacros y Mantenimiento</strong>: Planificación periódica de pruebas y métricas de efectividad de simulacros.</span>
                    <span class="sige-lang-en"><strong>Drills &amp; Maintenance</strong>: Periodic planning of tests and drill effectiveness metrics.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Beneficios Corporativos Obtenidos</span>
                <span class="sige-lang-en">Corporate Benefits Obtained</span>
              </div>
              <div class="service-block-text">
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es">Garantía absoluta de sostenibilidad operativa durante disrupciones severas.</span>
                    <span class="sige-lang-en">Absolute guarantee of operational sustainability during severe disruptions.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Ahorro y minimización de pérdidas económicas por inactividad.</span>
                    <span class="sige-lang-en">Savings and minimization of economic losses due to downtime.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Ventaja competitiva y tranquilidad contractual para clientes críticos.</span>
                    <span class="sige-lang-en">Competitive advantage and contractual peace of mind for critical clients.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FICHA 4: COMPLIANCE -->
          <div class="service-detail-tab" id="srv-detail-compliance">
            <div class="service-detail-hdr">
              <span class="service-detail-badge">ISO 37301 &amp; ISO 37001</span>
              <h3 class="service-detail-title">
                <span class="sige-lang-es">Compliance Penal y Gestión Antisoborno</span>
                <span class="sige-lang-en">Criminal Compliance and Anti-Bribery</span>
              </h3>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Introducción y Contexto Legal</span>
                <span class="sige-lang-en">Introduction and Legal Context</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">El endurecimiento de los códigos penales y las exigencias de buen gobierno corporativo exigen la implantación de modelos estrictos de prevención del riesgo legal. Los estándares ISO 37301 (Compliance) e ISO 37001 (Antisoborno) configuran el marco de prevención del delito, evitando multas millonarias, inhabilitación pública y la responsabilidad penal personal de directivos.</span>
                <span class="sige-lang-en">The tightening of criminal codes and demands for good corporate governance require the implementation of strict models for legal risk prevention. The standards ISO 37301 (Compliance) and ISO 37001 (Anti-Bribery) set the crime prevention framework, avoiding millionaire fines, public debarment, and personal criminal liability for directors.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Pilares del Modelo de Cumplimiento</span>
                <span class="sige-lang-en">Pillars of the Compliance Model</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Construimos un escudo ético integral sustentado en: identificación y mapeo del alcance regulatorio, evaluación sistemática de riesgos penales y antisoborno, independencia de la función de compliance y promoción de una cultura de integridad y transparencia.</span>
                <span class="sige-lang-en">We build a comprehensive ethical shield sustained by: identification and mapping of regulatory scope, systematic evaluation of criminal and anti-bribery risks, independence of the compliance function, and promotion of a culture of integrity and transparency.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Despliegue Automatizado con la Plataforma BOR4SIGE</span>
                <span class="sige-lang-en">Automated Deployment with BOR4SIGE Platform</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Los sistemas de Compliance encuentran en BOR4SIGE su máximo aliado operativo:</span>
                <span class="sige-lang-en">Compliance systems find their greatest operational ally in BOR4SIGE:</span>
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es"><strong>Compliance AI Dashboard</strong>: Cuadro de mandos centralizado que muestra de manera unificada el nivel de riesgo global.</span>
                    <span class="sige-lang-en"><strong>Compliance AI Dashboard</strong>: Centralized dashboard showing the overall global risk level in a unified manner.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Canal de Denuncias Seguro</strong>: Inclusión nativa de una plataforma digital confidencial conforme a las normativas de protección del informante.</span>
                    <span class="sige-lang-en"><strong>Secure Whistleblowing Channel</strong>: Native inclusion of a confidential digital platform in compliance with whistleblower protection regulations.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Filtros de Alertas Normativas</strong>: Automatización en la detección de cambios legales que afecten al mapa de riesgos penales.</span>
                    <span class="sige-lang-en"><strong>Regulatory Alert Filters</strong>: Automation in detecting legal changes affecting the criminal risk map.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Trazabilidad Documental Inalterable</strong>: Registro inalterable de evidencias de debida diligencia de terceros para demostración ante tribunales.</span>
                    <span class="sige-lang-en"><strong>Unalterable Document Traceability</strong>: Unalterable record of third-party due diligence evidence for presentation in court.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Beneficios Corporativos Obtenidos</span>
                <span class="sige-lang-en">Corporate Benefits Obtained</span>
              </div>
              <div class="service-block-text">
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es">Eximente o atenuante legal de responsabilidad penal de la persona jurídica.</span>
                    <span class="sige-lang-en">Legal exemption or mitigation of criminal liability for the legal entity.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Protección total de directivos y consejeros delegados frente a imputaciones.</span>
                    <span class="sige-lang-en">Total protection of directors and CEOs against legal charges.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Diferenciación y ventaja competitiva en licitaciones internacionales exigentes.</span>
                    <span class="sige-lang-en">Differentiation and competitive advantage in demanding international tenders.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FICHA 5: PRIVACIDAD Y RGPD -->
          <div class="service-detail-tab" id="srv-detail-privacy">
            <div class="service-detail-hdr">
              <span class="service-detail-badge">RGPD / Ley Orgánica 3/2018</span>
              <h3 class="service-detail-title">
                <span class="sige-lang-es">Privacidad y Protección de Datos Personales</span>
                <span class="sige-lang-en">Privacy and Personal Data Protection</span>
              </h3>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Introducción y Contexto Regulatorio</span>
                <span class="sige-lang-en">Introduction and Regulatory Context</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">El Reglamento General de Protección de Datos (RGPD) en la UE y la LOPDGDD en España exigen la responsabilidad proactiva (principio de accountability). Las organizaciones deben demostrar de forma fehaciente que cumplen el reglamento, documentando detalladamente cada tratamiento de datos personales de clientes, empleados y terceros.</span>
                <span class="sige-lang-en">The General Data Protection Regulation (GDPR) in the EU and LOPDGDD in Spain demand proactive responsibility (accountability principle). Organizations must convincingly demonstrate that they comply with the regulation, detailing every processing activity of customers, employees, and third-party personal data.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Pilares y Flujos de Datos Transparentes</span>
                <span class="sige-lang-en">Pillars and Transparent Data Flows</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Garantizamos el cumplimiento estructurando: la Privacidad desde el Diseño y por Defecto (cifrado, minimización), licitud en la obtención del consentimiento, ejercicio de derechos de los interesados (ARSULIPO) y regulación formal contractual de encargados de tratamiento (Art. 28).</span>
                <span class="sige-lang-en">We guarantee compliance by structuring: Privacy by Design and by Default (encryption, minimization), lawfulness in obtaining consent, exercise of data subjects' rights (ARSULIPO), and formal contractual regulation of data processors (Art. 28).</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Despliegue Automatizado con la Plataforma BOR4SIGE</span>
                <span class="sige-lang-en">Automated Deployment with BOR4SIGE Platform</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Bor4D despliega el expediente documental dinámico de protección de datos sobre BOR4SIGE:</span>
                <span class="sige-lang-en">Bor4D deploys the dynamic data protection documentary file on BOR4SIGE:</span>
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es"><strong>Registro de Actividades de Tratamiento (RAT)</strong>: Mapeo digital de flujos de datos, fines de tratamiento y plazos de supresión.</span>
                    <span class="sige-lang-en"><strong>Record of Processing Activities (ROPA)</strong>: Digital mapping of data flows, processing purposes, and suppression periods.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Evaluaciones de Impacto (EIPD / PIA)</strong>: Herramienta analítica de riesgos integrada para analizar tratamientos de datos sensibles o masivos.</span>
                    <span class="sige-lang-en"><strong>Data Protection Impact Assessments (DPIA / PIA)</strong>: Integrated analytical risk tool to analyze sensitive or large-scale data processing.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Protocolo de Brechas de Seguridad</strong>: Sistema de alerta rápida para asegurar la notificación a la AEPD en el plazo legal improrrogable de 72 horas.</span>
                    <span class="sige-lang-en"><strong>Data Breach Protocol</strong>: Rapid alert system to ensure notification to the AEPD within the non-extendable legal limit of 72 hours.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Control de Derechos ARSULIPO</strong>: Registro de peticiones con temporizador legal de 30 días de respuesta.</span>
                    <span class="sige-lang-en"><strong>ARSULIPO Rights Control</strong>: Registration of requests with a 30-day legal response timer.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Beneficios Corporativos Obtenidos</span>
                <span class="sige-lang-en">Corporate Benefits Obtained</span>
              </div>
              <div class="service-block-text">
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es">Eliminación del riesgo de sanciones económicas severas por incumplimiento del RGPD.</span>
                    <span class="sige-lang-en">Elimination of the risk of severe financial sanctions for GDPR non-compliance.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Tranquilidad jurídica e institucional absoluta ante requerimientos de la Agencia.</span>
                    <span class="sige-lang-en">Absolute legal and institutional peace of mind in case of agency requirements.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Alineamiento directo con el SGSI de BOR4SIGE (ISO 27701).</span>
                    <span class="sige-lang-en">Direct alignment with the BOR4SIGE ISMS (ISO 27701).</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FICHA 6: ISO 9001 -->
          <div class="service-detail-tab" id="srv-detail-iso9001">
            <div class="service-detail-hdr">
              <span class="service-detail-badge">ISO 9001:2015</span>
              <h3 class="service-detail-title">
                <span class="sige-lang-es">Sistema de Gestión de Calidad (SGC)</span>
                <span class="sige-lang-en">Quality Management System (QMS)</span>
              </h3>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Introducción y Enfoque Operacional</span>
                <span class="sige-lang-en">Introduction and Operational Focus</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">La calidad en la prestación de servicios y el desarrollo de productos es el pilar de la competitividad. El estándar internacional UNE-EN ISO 9001:2015 proporciona la metodología definitiva para garantizar la plena satisfacción del cliente y la optimización continua de todos los procesos de la empresa.</span>
                <span class="sige-lang-en">Quality in service provision and product development is the pillar of competitiveness. The international standard UNE-EN ISO 9001:2015 provides the definitive methodology to guarantee full customer satisfaction and the continuous optimization of all processes in the company.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Los Principios Rectores de la Calidad</span>
                <span class="sige-lang-en">The Guiding Principles of Quality</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Transformamos la cultura organizativa basándonos en: enfoque al cliente, liderazgo activo, compromiso del equipo, enfoque basado en procesos, mejora continua mediante ciclo PDCA y la toma de decisiones fundamentada en evidencias.</span>
                <span class="sige-lang-en">We transform the organizational culture based on: customer focus, active leadership, team commitment, process-based approach, continuous improvement via PDCA cycles, and evidence-based decision making.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Despliegue Automatizado con la Plataforma BOR4SIGE</span>
                <span class="sige-lang-en">Automated Deployment with BOR4SIGE Platform</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">El SGC de la empresa abandona la burocracia tradicional en papel gracias a BOR4SIGE:</span>
                <span class="sige-lang-en">The QMS of the company abandons traditional paper bureaucracy thanks to BOR4SIGE:</span>
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es"><strong>Mapeo de Procesos</strong>: Desglose automatizado en entradas, salidas, indicadores (KPIs) y responsables.</span>
                    <span class="sige-lang-en"><strong>Process Mapping</strong>: Automated breakdown of inputs, outputs, KPIs, and owners.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Dashboard de KPIs en Tiempo Real</strong>: Monitorización y evaluación constante del rendimiento operativo.</span>
                    <span class="sige-lang-en"><strong>Real-Time KPIs Dashboard</strong>: Constant monitoring and evaluation of operational performance.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Riesgos Operativos</strong>: Identificación y planificación de controles preventivos mediante matrices de riesgo.</span>
                    <span class="sige-lang-en"><strong>Operational Risks</strong>: Identification and planning of preventive controls via risk matrices.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Flujos de Auditoría</strong>: Herramientas de autoevaluación guiadas para preparar al equipo interno antes de la certificación.</span>
                    <span class="sige-lang-en"><strong>Audit Workflows</strong>: Guided self-assessment tools to prepare the internal team prior to certification.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Beneficios Corporativos Obtenidos</span>
                <span class="sige-lang-en">Corporate Benefits Obtained</span>
              </div>
              <div class="service-block-text">
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es">Homologación comercial e indispensable para licitaciones públicas y grandes contratos.</span>
                    <span class="sige-lang-en">Commercial and indispensable approval for public tenders and major contracts.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Prestigio de marca internacional de cara a clientes y proveedores.</span>
                    <span class="sige-lang-en">International brand prestige facing customers and suppliers.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Aumento evidente de la eficiencia operativa y reducción de costes por ineficacias.</span>
                    <span class="sige-lang-en">Clear increase in operational efficiency and reduction in costs from inefficiencies.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FICHA 7: ISO 14001 -->
          <div class="service-detail-tab" id="srv-detail-iso14001">
            <div class="service-detail-hdr">
              <span class="service-detail-badge">ISO 14001:2015</span>
              <h3 class="service-detail-title">
                <span class="sige-lang-es">Sistema de Gestión Ambiental (SGA)</span>
                <span class="sige-lang-en">Environmental Management System (EMS)</span>
              </h3>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Introducción y Sostenibilidad Financiera</span>
                <span class="sige-lang-en">Introduction and Financial Sustainability</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Preservar el medio ambiente es un deber ético y una estrategia de alto impacto financiero. Los residuos, emisiones y excesos de consumo energético son en realidad ineficiencias de los procesos internos. La norma UNE-EN ISO 14001:2015 proporciona la guía definitiva para hacer que las operaciones sean sostenibles.</span>
                <span class="sige-lang-en">Preserving the environment is an ethical duty and a high financial impact strategy. Waste, emissions, and energy consumption excesses are actually internal process inefficiencies. The UNE-EN ISO 14001:2015 standard provides the definitive guide to make operations sustainable.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Principios de la Gestión Ambiental</span>
                <span class="sige-lang-en">Environmental Management Principles</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Lideramos el diseño del SGA basándonos en: declaración formal de política ambiental, evaluación detallada de aspectos ambientales, garantía absoluta de cumplimiento legislativo y sensibilización de todos los empleados de la organización.</span>
                <span class="sige-lang-en">We lead the EMS design based on: formal environmental policy statement, detailed evaluation of environmental aspects, absolute guarantee of legislative compliance, and awareness training for all organization employees.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Despliegue Automatizado con la Plataforma BOR4SIGE</span>
                <span class="sige-lang-en">Automated Deployment with BOR4SIGE Platform</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Automatizamos la gobernanza ambiental desplegando el SGA sobre BOR4SIGE:</span>
                <span class="sige-lang-en">We automate environmental governance by deploying the EMS on BOR4SIGE:</span>
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es"><strong>Aspectos Ambientales Significativos</strong>: Evaluación inicial detallada de procesos para registrar impactos ambientales.</span>
                    <span class="sige-lang-en"><strong>Significant Environmental Aspects</strong>: Initial detailed processes evaluation to record environmental impacts.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Registro de Consumos y Residuos</strong>: Monitorización digital de consumos energéticos, hídricos y residuos industriales.</span>
                    <span class="sige-lang-en"><strong>Energy &amp; Waste Records</strong>: Digital monitoring of energy, water consumption, and industrial waste.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Planes de Emergencia Ambiental</strong>: Control de procedimientos y simulacros para situaciones de riesgo ambiental.</span>
                    <span class="sige-lang-en"><strong>Environmental Emergency Plans</strong>: Control of procedures and drills for environmental risk situations.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Informes de Desempeño</strong>: Cuadros de mando y estados de objetivos para facilitar revisiones periódicas por la dirección.</span>
                    <span class="sige-lang-en"><strong>Performance Reports</strong>: Dashboards and objective status reports to facilitate periodic reviews by management.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Beneficios Corporativos Obtenidos</span>
                <span class="sige-lang-en">Corporate Benefits Obtained</span>
              </div>
              <div class="service-block-text">
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es">Reducción drástica de costes de consumo de recursos y gestión de residuos.</span>
                    <span class="sige-lang-en">Drastic reduction in resource consumption and waste management costs.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Evitación de multas y expedientes de paralización administrativa.</span>
                    <span class="sige-lang-en">Avoidance of fines and administrative suspension files.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Posicionamiento comercial verde y responsable frente a clientes comerciales.</span>
                    <span class="sige-lang-en">Green and responsible business positioning facing commercial clients.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- FICHA 8: ISO 45001 -->
          <div class="service-detail-tab" id="srv-detail-iso45001">
            <div class="service-detail-hdr">
              <span class="service-detail-badge">ISO 45001:2018</span>
              <h3 class="service-detail-title">
                <span class="sige-lang-es">Seguridad y Salud en el Trabajo (SGSST)</span>
                <span class="sige-lang-en">Occupational Health and Safety (OHSMS)</span>
              </h3>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Introducción y Contexto Preventivo</span>
                <span class="sige-lang-en">Introduction and Preventive Context</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Proteger la integridad física y mental del equipo humano es una prioridad legal y estratégica ineludible. La norma UNE-EN ISO 45001:2018 proporciona las directrices para estructurar un SGSST proactivo, desplazando los modelos reactivos de siniestralidad hacia una cultura corporativa de prevención y bienestar integral.</span>
                <span class="sige-lang-en">Protecting the physical and mental integrity of the human team is an unavoidable legal and strategic priority. The UNE-EN ISO 45001:2018 standard provides guidelines to structure a proactive OHSMS, shifting reactive accident rate models to a corporate culture of prevention and holistic well-being.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Pilares de la Salud y Seguridad Laboral</span>
                <span class="sige-lang-en">Pillars of Occupational Health and Safety</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Nuestros proyectos se fundamentan en: participación y consulta activa de los trabajadores, identificación proactiva de peligros y evaluación de riesgos laborales (ergonomía, psicosociales) y orquestación de planes de preparación ante emergencias médicas.</span>
                <span class="sige-lang-en">Our projects are based on: active worker participation and consultation, proactive hazard identification and occupational risk evaluation (ergonomic, psychosocial), and orchestration of medical emergency preparedness plans.</span>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Despliegue Automatizado con la Plataforma BOR4SIGE</span>
                <span class="sige-lang-en">Automated Deployment with BOR4SIGE Platform</span>
              </div>
              <div class="service-block-text">
                <span class="sige-lang-es">Agilizamos la implantación preventiva integrando los módulos de salud laboral de BOR4SIGE:</span>
                <span class="sige-lang-en">We streamline preventive implementation by integrating the occupational health modules of BOR4SIGE:</span>
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es"><strong>Riesgos por Puesto</strong>: Parametrización digital de las características de cada puesto de trabajo.</span>
                    <span class="sige-lang-en"><strong>Job-Specific Risks</strong>: Digital parameterization of the characteristics of each workstation.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Acción Preventiva Digital</strong>: Generación automática de planes de acción correctiva con asignación de recursos y responsables.</span>
                    <span class="sige-lang-en"><strong>Digital Preventive Action</strong>: Automatic generation of corrective action plans with resources and owner assignments.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Equipos de Protección (EPIs)</strong>: Control riguroso de entrega de equipos e inspección de instalaciones críticas.</span>
                    <span class="sige-lang-en"><strong>Protection Equipment (PPE)</strong>: Rigorous control of equipment delivery and critical facilities inspection.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es"><strong>Formación y Aptitud Médica</strong>: Control y alertas automatizadas de vencimiento de reconocimientos médicos y capacitaciones obligatorias.</span>
                    <span class="sige-lang-en"><strong>Training &amp; Medical Fitness</strong>: Automatic alerts for medical checks expiration and mandatory training completions.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div class="service-block">
              <div class="service-block-title">
                <span class="sige-lang-es">Beneficios Corporativos Obtenidos</span>
                <span class="sige-lang-en">Corporate Benefits Obtained</span>
              </div>
              <div class="service-block-text">
                <ul class="service-block-ul">
                  <li>
                    <span class="sige-lang-es">Reducción drástica de siniestralidad, accidentes y costes derivados del absentismo.</span>
                    <span class="sige-lang-en">Drastic reduction in accident rates, accidents, and costs from absenteeism.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Seguridad jurídica y blindaje ante inspecciones de trabajo y responsabilidades.</span>
                    <span class="sige-lang-en">Legal security and protection against labor inspections and liabilities.</span>
                  </li>
                  <li>
                    <span class="sige-lang-es">Mejora sustancial del clima laboral y compromiso interno de la plantilla.</span>
                    <span class="sige-lang-en">Substantial improvement in workplace climate and team commitment.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  </div>

  <!-- ================= TAB 5: CONTACTO ================= -->
  <div class="sige-tab-content" id="tab-contact">
    <section class="sige-section">
      <div class="s-badge">
        <span class="s-badge-dot"></span>
        <span class="sige-lang-es">Contacto Comercial</span>
        <span class="sige-lang-en">Commercial Contact</span>
      </div>

      <h2 class="sige-title-lg">
        <span class="sige-lang-es">Impulsa tu organización hacia <br/><span class="sige-grad-text">el siguiente nivel</span></span>
        <span class="sige-lang-en">Drive your organization to <br/><span class="sige-grad-text">the next level</span></span>
      </h2>

      <div class="contact-layout">
        <div class="contact-info">
          <div>
            <h3 class="contact-info-title">
              <span class="sige-lang-es">Bor4D Technology &amp; Professional Services S.L.</span>
              <span class="sige-lang-en">Bor4D Technology &amp; Professional Services S.L.</span>
            </h3>
            <p style="color: var(--c-muted); font-size: 0.9rem;">
              <span class="sige-lang-es">Estamos a tu disposición para asesorarte en la implantación y digitalización de tus sistemas de gestión con la plataforma estrella BOR4SIGE.</span>
              <span class="sige-lang-en">We are at your disposal to advise you on the implementation and digitalization of your management systems using the star platform BOR4SIGE.</span>
            </p>
          </div>

          <div class="contact-item">
            <div class="contact-item-icon">📍</div>
            <div>
              <div class="contact-item-label">
                <span class="sige-lang-es">Dirección</span>
                <span class="sige-lang-en">Address</span>
              </div>
              <div class="contact-item-value">Madrid, España / London, United Kingdom</div>
            </div>
          </div>

          <div class="contact-item">
            <div class="contact-item-icon">📧</div>
            <div>
              <div class="contact-item-label">Email</div>
              <div class="contact-item-value">contacto@bor4d-technology.com</div>
            </div>
          </div>

          <div class="contact-item">
            <div class="contact-item-icon">📞</div>
            <div>
              <div class="contact-item-label">
                <span class="sige-lang-es">Teléfono</span>
                <span class="sige-lang-en">Phone</span>
              </div>
              <div class="contact-item-value">+34 910 000 000 / +44 20 7946 0958</div>
            </div>
          </div>
        </div>

        <!-- Formulario Mockup -->
        <div class="contact-form">
          <div class="contact-form-group">
            <label class="contact-form-label">
              <span class="sige-lang-es">Nombre Completo</span>
              <span class="sige-lang-en">Full Name</span>
            </label>
            <input type="text" class="contact-form-input" placeholder="John Doe" />
          </div>
          <div class="contact-form-group">
            <label class="contact-form-label">Email</label>
            <input type="email" class="contact-form-input" placeholder="john.doe@mi-empresa.com" />
          </div>
          <div class="contact-form-group">
            <label class="contact-form-label">
              <span class="sige-lang-es">Mensaje o Consulta</span>
              <span class="sige-lang-en">Message or Inquiry</span>
            </label>
            <textarea class="contact-form-textarea" rows="4" placeholder="..."></textarea>
          </div>
          <button class="s-btn s-btn-primary" style="width: 100%; justify-content: center;" onclick="alert('Mensaje enviado (Simulación). ¡Muchas gracias por contactar con Bor4D!')">
            <span class="sige-lang-es">Enviar Consulta</span>
            <span class="sige-lang-en">Submit Inquiry</span>
          </button>
        </div>
      </div>
    </section>
  </div>

</div>

<!-- ── COMPORTAMIENTO INTERACTIVO JAVASCRIPT ── -->
<script>
/**
 * Conmutador dinámico de idioma client-side
 */
function sigeToggleLanguage() {
  const container = document.getElementById('sige-showcase');
  if (container.classList.contains('lang-es')) {
    container.classList.remove('lang-es');
    container.classList.add('lang-en');
  } else {
    container.classList.remove('lang-en');
    container.classList.add('lang-es');
  }
}

/**
 * Conmutador dinámico de pestañas
 */
function sigeSwitchTab(tabId, event) {
  if (event) event.preventDefault();
  
  // Activar link en navbar
  const links = document.querySelectorAll('#sige-showcase .sige-nav-link');
  links.forEach(link => link.classList.remove('active'));
  
  const activeLink = document.getElementById(`nav-btn-${tabId}`);
  if (activeLink) activeLink.classList.add('active');

  // Activar contenedor de tab
  const tabs = document.querySelectorAll('#sige-showcase .sige-tab-content');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });

  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) {
    activeTab.classList.add('active');
  }
}

/**
 * Conmutador dinámico de fichas de servicios
 */
function sigeSwitchService(serviceId) {
  // Activar botón en sidebar
  const buttons = document.querySelectorAll('#sige-showcase .service-side-btn');
  buttons.forEach(btn => btn.classList.remove('active'));

  const activeBtn = document.getElementById(`srv-btn-${serviceId}`);
  if (activeBtn) activeBtn.classList.add('active');

  // Activar detalle
  const details = document.querySelectorAll('#sige-showcase .service-detail-tab');
  details.forEach(tab => tab.classList.remove('active'));

  const activeDetail = document.getElementById(`srv-detail-${serviceId}`);
  if (activeDetail) {
    activeDetail.classList.add('active');
  }
}

/**
 * Simulador interactivo de Inteligencia Artificial
 */
let simStep = 0;
function sigeTriggerAiSim() {
  const box = document.getElementById('ai-sim-box');
  if (!box) return;

  const logs = {
    es: [
      "🔄 <strong>ESCANEO INICIADO</strong>: Analizando base de datos local y almacén de datos...",
      "🔍 <strong>ANÁLISIS DE CONTEXTO</strong>: DAFO actualizado hace 4 días. Estado: Conforme.",
      "⚠️ <strong>ALERTA DE SEGURIDAD (ISO 27001)</strong>: 1 no conformidad en control de accesos sin plan correctivo. Generando CAPA recomendada...",
      "🌱 <strong>ALERTA DE MEDIO AMBIENTE (ISO 14001)</strong>: Residuos industriales superaron umbral crítico de alerta. Recomendación: Revisar módulo de almacenamiento.",
      "🏅 <strong>CALIDAD (ISO 9001)</strong>: Evaluación de proveedores en orden. Tasa de satisfacción: 94%.",
      "✅ <strong>ANÁLISIS FINALIZADO</strong>: 2 advertencias generadas en el copiloto de auditoría."
    ],
    en: [
      "🔄 <strong>SCAN INITIATED</strong>: Analyzing local databases and active data stores...",
      "🔍 <strong>CONTEXT ANALYSIS</strong>: SWOT updated 4 days ago. Status: Compliant.",
      "⚠️ <strong>SECURITY ALERT (ISO 27001)</strong>: 1 non-conformity in access controls lacks a corrective plan. Generating recommended CAPA...",
      "🌱 <strong>ENVIRONMENT ALERT (ISO 14001)</strong>: Industrial waste exceeded critical threshold. Action: Check waste storage module.",
      "🏅 <strong>QUALITY (ISO 9001)</strong>: Supplier evaluations up-to-date. Satisfaction rate: 94%.",
      "✅ <strong>SCAN COMPLETED</strong>: 2 warnings generated on the audit co-pilot dashboard."
    ]
  };

  const container = document.getElementById('sige-showcase');
  const isEn = container.classList.contains('lang-en');
  const currentLogs = isEn ? logs.en : logs.es;

  // Limpiar en el paso inicial
  if (simStep === 0) {
    box.innerHTML = '';
  }

  if (simStep < currentLogs.length) {
    const isOk = currentLogs[simStep].includes("✅") || currentLogs[simStep].includes("🏅") || currentLogs[simStep].includes("🔍");
    const isWarn = currentLogs[simStep].includes("⚠️") || currentLogs[simStep].includes("🌱");
    const isStart = currentLogs[simStep].includes("🔄");
    
    let cardClass = 'ai-alert-ok';
    if (isWarn) cardClass = 'ai-alert-warn';
    if (isStart) cardClass = 'ai-alert-ok';

    const card = document.createElement('div');
    card.className = `ai-alert-card ${cardClass}`;
    card.innerHTML = `<div class="ai-alert-dot"></div><div>${currentLogs[simStep]}</div>`;
    box.appendChild(card);
    
    // Auto-scroll
    box.scrollTop = box.scrollHeight;
    
    simStep++;
    
    // Auto-ejecutar pasos
    setTimeout(sigeTriggerAiSim, 850);
  } else {
    // Resetear simulación
    simStep = 0;
  }
}
</script>

# DOSSIER TÉCNICO Y DE CUMPLIMIENTO: Bor4SIGE

Este documento consolida la arquitectura técnica, la estructura de módulos funcionales, el mapeo de normativas de cumplimiento (ISO y ENS) y la guía de despliegue del sistema **Bor4SIGE** (anteriormente SIGE 2.0). Está estructurado y optimizado específicamente para servir como documento de origen en **Google NotebookLM**, facilitando la interacción conversacional, la generación de resúmenes estructurados y la creación de guías formativas de audio (podcasts).

---

## 1. RESUMEN EJECUTIVO

**Bor4SIGE** es un portal web interactivo de tipo SPA (Single Page Application) diseñado para centralizar la gestión de Sistemas Integrados de Gestión (SIG) en organizaciones empresariales. Cubre los requisitos operativos y de registro exigidos por las normas de calidad, medio ambiente, seguridad de la información y privacidad.

El sistema se basa en un diseño modular donde cada área de cumplimiento (calidad, ambiental, laboral, seguridad y privacidad) cuenta con interfaces dedicadas e interactivas, sincronizadas de forma transparente con un servidor local que garantiza el almacenamiento persistente y el aislamiento de datos (multi-tenant) por cliente.

---

## 2. ARQUITECTURA TÉCNICA DEL SISTEMA

El sistema opera bajo un enfoque desacoplado y ligero que maximiza la compatibilidad y la velocidad de ejecución:

### A. Frontend (Interfaz de Usuario)
* **Estructura SPA**: Cada módulo operativo reside en su propio directorio con un archivo principal `code.html` que contiene la estructura HTML, las reglas CSS y el comportamiento JavaScript del módulo.
* **Sistema de Diseño (CSS)**: Se utiliza **Tailwind CSS** (inyectado dinámicamente) y las fuentes tipográficas del sistema (**Inter** e **IBM Plex Sans**) junto con los iconos vectoriales de **Google Material Symbols**.
* **Esquema de Colores (Bor4SIGE Premium)**:
  * `primary` (Azul Marino Profundo): `#003366`
  * `secondary` (Azul Interactivo): `#0060ac`
  * `background` (Gris Neutro Claro): `#f8f9fb`
  * `surface` (Blanco Puro): `#ffffff`
  * Indicadores semánticos para `success` (Verde), `warn` (Ámbar/Naranja) y `danger` (Rojo).

### B. Capa de Datos y Sincronización Transparentes (`api-sync.js`)
* **Interceptor de LocalStorage**: El script corporativo `api-sync.js` intercepta dinámicamente todas las lecturas y escrituras de `localStorage` que hacen los módulos individuales.
* **Aislamiento Multi-Tenant**: Si el módulo corre embebido en un `iframe` dentro del portal principal, `api-sync.js` añade automáticamente un sufijo correspondiente a la organización activa (por defecto, `alfa`). Esto asegura que múltiples empresas o sucursales almacenen sus datos de forma totalmente independiente bajo el mismo navegador.
* **Fallback Seguro**: Si el servidor API está inactivo o el módulo se abre de manera independiente, el script reconduce el almacenamiento al `localStorage` tradicional del navegador, asegurando que el sistema permanezca operativo (offline).

### C. Servidor Backend (`server.js`) y Base de Datos (`db.json`)
* **Servidor Node.js**: Un servicio Express ligero en el puerto `3000` gestiona las APIs del sistema.
* **Base de Datos Plana (`db.json`)**: Los datos del sistema se almacenan en un archivo JSON en disco. Para maximizar la velocidad de respuesta, el servidor carga los datos en memoria caché (`dbCache`).
* **Escritura Atómica**: Cada modificación genera una escritura en un archivo temporal (`db.json.tmp`) que luego se renombra de manera atómica para evitar cualquier pérdida o corrupción de datos si ocurre un corte eléctrico.
* **Integración con Inteligencia Artificial**: El backend incluye un endpoint `/api/generate` que conecta de forma transparente con un servidor local de modelos de lenguaje (como Ollama) para generar automáticamente análisis de conformidad y propuestas de planes de acción correctiva (CAPA).

---

## 3. MAPEO DE NORMAS ISO Y CUMPLIMIENTO LEGAL

El núcleo de Bor4SIGE está diseñado para dar cumplimiento directo a cláusulas específicas de estándares internacionales e internacionales:

| Estándar de Referencia | Área de Aplicación | Módulo Relacionado | Cláusula Específica y Cumplimiento |
| :--- | :--- | :--- | :--- |
| **ISO 9001:2015** | Gestión de Calidad | `compras_y_evaluacion_proveedores`, `satisfaccion_cliente_ims`, `gestor_de_auditor_as`, `auditor_as_y_acciones` | * **§7.1.5**: Recursos de seguimiento y medición (equipos).<br>* **§8.4**: Control de procesos suministrados externamente (proveedores).<br>* **§9.1.2**: Satisfacción del cliente.<br>* **§9.2**: Auditorías internas.<br>* **§10.2**: No conformidades y acciones correctivas (CAPA). |
| **ISO 14001:2015** | Gestión Ambiental | `evaluaci_n_aspectos_ambientales`, `control_de_operaciones_ambientales`, `riesgos_cambio_climatico` | * **§6.1.2**: Aspectos ambientales significativos.<br>* **§6.1.3**: Requisitos legales ambientales.<br>* **§8.1**: Planificación y control operacional. |
| **ISO 45001:2018** | Seguridad y Salud Laboral | `participacion_trabajadores`, `investigaci_n_accidentes_sst` | * **§5.4**: Consulta y participación de los trabajadores.<br>* **§10.2**: Incidentes, no conformidades y acciones correctivas. |
| **ISO 27001:2022** | Seguridad de la Información | `requisitos_legales_y_ens`, `incidentes_de_seguridad`, `declaracion_aplicabilidad` | * **§A.5.7**: Inteligencia de amenazas.<br>* **§A.5.24**: Gestión de incidentes de seguridad de la información.<br>* **§A.5.36**: Cumplimiento de requisitos legales y contractuales. |
| **ISO 27701:2019 / RGPD** | Privacidad de los Datos | `proteccion_datos_rgpd`, `canal_de_denuncias` | * **Art. 30 RGPD**: Registro de Actividades de Tratamiento (RAT).<br>* **Art. 33 RGPD**: Notificación de brechas de seguridad a la AEPD en un plazo máximo de 72 horas.<br>* **Art. 35 RGPD**: Evaluación de Impacto relativa a la Protección de Datos (EIPD / PIA).<br>* **Derechos ARCO-POL**: Registro de solicitudes con cuenta atrás legal de 30 días para respuesta.<br>* **Art. 28 RGPD**: Contratos con encargados de tratamiento (proveedores). |
| **ENS (España)** | Esquema Nacional de Seguridad | `requisitos_legales_y_ens` | * Cumplimiento de la declaración de aplicabilidad de medidas de seguridad organizativas y técnicas exigidas para proveedores del sector público. |

---

## 4. DIRECTORIO DE MÓDULOS OPERATIVOS

El portal consta de las siguientes pantallas principales integradas:

* **Portal Principal (`index.html`)**: Contenedor maestro con menú de navegación, selector multi-tenant y un *compliance scanner* automático que analiza el estado general del sistema, alertando sobre auditorías vencidas, descalibraciones o brechas RGPD activas.
* **Módulo RGPD (`proteccion_datos_rgpd/code.html`)**:
  * **RAT**: Formulario y tabla de tratamiento de datos personales.
  * **EIPD / PIA**: Evaluaciones de riesgo de privacidad con matrices visuales.
  * **Derechos ARCO-POL**: Seguimiento en tiempo real de derechos ejercidos con una barra de progreso que indica los días restantes frente al plazo legal de 30 días.
  * **Encargados de Tratamiento**: Gestión de contratos y firma bajo el Art. 28 del RGPD.
* **Incidentes de Seguridad (`incidentes_de_seguridad/code.html`)**:
  * Registro detallado de brechas de seguridad de datos.
  * Cronómetro visual dinámico que resalta las 72 horas legales para la notificación a la AEPD.
* **Requisitos Legales y ENS (`requisitos_legales_y_ens/code.html`)**:
  * Matriz de cumplimiento legal específica que incluye las normas del Esquema Nacional de Seguridad.
* **Canal de Denuncias (`canal_de_denuncias/code.html`)**:
  * Interfaz confidencial y segura con cifrado visual para denuncias internas anónimas conforme a la Directiva de Denunciantes (EU Whistleblowing Directive).
* **Gestor de Auditorías e Informes (`gestor_de_auditor_as/code.html`)**:
  * Programación de auditorías internas, asignación de auditores y control de hallazgos.
* **Acciones Correctivas y CAPA (`auditor_as_y_acciones/code.html`)**:
  * Registrador de no conformidades con vinculación automática de acciones de mejora y correctoras.

---

## 5. GUÍA DE DESPLIEGUE Y EMPAQUETADO

Bor4SIGE se despliega mediante 4 paquetes estandarizados en formato `.zip`, ubicados en la raíz del proyecto:

1. **`bor4sige-wp-addon.zip`**: Plugin instalable para WordPress. Carga Bor4SIGE de manera segura en el backend de administración de WordPress mediante un sistema de shortcodes e iFrames y proporciona un portal de ajustes de administrador para los endpoints de sincronización de datos.
2. **`bor4sige_web_presentacion.zip`**: Contiene la web estática promocional del sistema para clientes e inversionistas, sirviendo como landing page.
3. **`bor4sige_webapp_instalable.zip`**: Versión autónoma empaquetada lista para desplegarse localmente o en un contenedor Nginx/Apache.
4. **`bor4sige_webapp_instalable_sgi.zip`**: Versión corporativa extendida con herramientas específicas para la Gestión de Integración Avanzada (SGI).

---

## 6. IDEAS DE PROMPTS PARA INTERACTUAR EN NOTEBOOKLM

Una vez subido este documento a tu libreta corporativa de NotebookLM, puedes utilizar los siguientes prompts optimizados para extraer información de alto valor:

* **Auditoría de Cumplimiento**:
  > *"Actúa como un auditor de sistemas de gestión. Basándote en el módulo RGPD de Bor4SIGE, ¿qué campos e información de seguimiento me ofrece el sistema para garantizar el cumplimiento del Artículo 30 del RGPD (Registro de Actividades de Tratamiento) y cómo se asegura el control de los plazos de respuesta ante un derecho de acceso ARCO?"*
* **Guía Operativa**:
  > *"Explícame cómo interactúan el script de sincronización `api-sync.js` y la base de datos `db.json` en el backend para permitir que múltiples sucursales de mi empresa operen de forma independiente (aislamiento multi-tenant) sin mezclar sus registros."*
* **Pregunta de Certificación**:
  > *"¿Cómo apoya el módulo de incidentes de seguridad de Bor4SIGE al cumplimiento de la norma ISO 27001:2022 y la directriz del RGPD sobre las 72 horas para notificar brechas de datos?"*
* **Generación de Podcast**:
  > Selecciona la opción de **Generar Audio Overview** en NotebookLM para escuchar a dos locutores IA debatir y explicar cómo Bor4SIGE simplifica la integración de las normas ISO 9001, 14001, 45001, 27001 y 27701 bajo una única interfaz unificada.

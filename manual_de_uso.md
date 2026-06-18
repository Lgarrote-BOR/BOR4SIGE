# Manual de Usuario — Bor4SIGE
## Sistema Integrado de Gestión Empresarial

> **Versión:** 2.0 | **Fecha:** Junio 2026 | **Destinatarios:** Usuarios del sistema

---

## Índice

1. [Primeros pasos: cómo acceder al sistema](#1-primeros-pasos-cómo-acceder-al-sistema)
2. [Navegación general](#2-navegación-general)
3. [Cuadro de Mando (Dashboard)](#3-cuadro-de-mando-dashboard)
4. [Gestión Documental](#4-gestión-documental)
5. [Gestión de Auditorías y Acciones Correctivas (CAPA)](#5-gestión-de-auditorías-y-acciones-correctivas-capa)
6. [Gestión de Riesgos](#6-gestión-de-riesgos)
7. [Gestión de Cambios TI (RFC)](#7-gestión-de-cambios-ti-rfc)
8. [Gestión de Compras y Evaluación de Proveedores](#8-gestión-de-compras-y-evaluación-de-proveedores)
9. [Eficacia de la Formación](#9-eficacia-de-la-formación)
10. [Satisfacción del Cliente](#10-satisfacción-del-cliente)
11. [Incidentes de Seguridad](#11-incidentes-de-seguridad)
12. [Seguridad y Salud en el Trabajo (SST)](#12-seguridad-y-salud-en-el-trabajo-sst)
13. [Gestión Ambiental](#13-gestión-ambiental)
14. [Canal de Denuncias](#14-canal-de-denuncias)
15. [Cumplimiento Legal y ENS](#15-cumplimiento-legal-y-ens)
16. [Revisión por la Dirección](#16-revisión-por-la-dirección)
17. [Mapa de Procesos y KPIs](#17-mapa-de-procesos-y-kpis)
18. [Análisis DAFO y Partes Interesadas](#18-análisis-dafo-y-partes-interesadas)
19. [Catálogo Unificado de Productos y Servicios](#19-catálogo-unificado-de-productos-y-servicios)
20. [Producción y Gestión de Capacidad (ISO 20000-1)](#20-producción-y-gestión-de-capacidad-iso-20000-1)
21. [Seguimiento por IA — Panel de Cumplimiento Automático](#21-seguimiento-por-ia--panel-de-cumplimiento-automático)
22. [Asistente Virtual (Chatbot)](#22-asistente-virtual-chatbot)
23. [Preguntas Frecuentes](#23-preguntas-frecuentes)

---

## 1. Primeros pasos: cómo acceder al sistema

### Acceso en modo servidor (recomendado para equipos)

1. Asegúrate de que el servidor Bor4SIGE está en marcha. El administrador del sistema te proporcionará la URL de acceso, normalmente en formato:
   ```
   http://<IP-del-servidor>:3000/
   ```
2. Abre esa dirección en tu navegador web (Chrome, Edge o Firefox actualizados).
3. La página principal (Portal Bor4SIGE) se cargará automáticamente.

### Acceso en modo local (desde pendrive o equipo propio)

1. Navega a la carpeta de instalación de Bor4SIGE en tu equipo o pendrive.
2. Haz doble clic en `iniciar_servidor.bat` (Windows) para arrancar el servidor local.
3. Una vez iniciado, abre tu navegador y accede a `http://localhost:3000/`.
4. Como alternativa rápida, puedes abrir directamente el archivo `index.html` con tu navegador, aunque en este modo la información se guardará solo en ese navegador.

> **Tip:** Se recomienda usar siempre el servidor local (`iniciar_servidor.bat`) para que todos los datos se guarden correctamente y sean accesibles por otros usuarios de la misma red.

---

## 2. Navegación general

### La barra lateral izquierda

Nada más entrar verás la barra lateral de navegación a la izquierda de la pantalla. Desde ella puedes acceder a todos los módulos del sistema, organizados por área temática:

- **Estrategia**: DAFO, Partes Interesadas, Mapa de Procesos, KPIs, Ficha de Proceso.
- **Operaciones y Calidad**: Satisfacción del Cliente, Proveedores, Compras, Formación.
- **Cumplimiento y Legal**: Requisitos Legales, ENS, Políticas, Catálogo de Requisitos.
- **Seguridad TI**: Incidentes, Cambios TI, Catálogo de Servicios TI.
- **Medio Ambiente y SST**: Aspectos Ambientales, Cambio Climático, Accidentes SST.
- **Documentación**: Gestión Documental, Explorador de Documentos, Informes.
- **Cumplimiento y Compliance**: Canal de Denuncias, Auditorías, CAPA, Revisión Dirección.
- **Dashboard**: Cuadro de Mando Integral.

### Cómo buscar un módulo

En la parte superior de la barra lateral encontrarás un **buscador**. Escribe cualquier palabra clave (por ejemplo, "proveedor", "riesgo", "auditoría") y el sistema filtrará los módulos disponibles en tiempo real.

### Cambiar de organización (multi-empresa)

Si tu instalación gestiona varias sedes u organizaciones, verás un **selector de organización** en la barra lateral. Al cambiar de organización, el tablero y todos los datos se filtrarán automáticamente para mostrar únicamente la información de esa entidad.

### Colapsar la barra lateral

Haz clic en el icono de menú (☰) en la parte superior izquierda para ocultar o mostrar la barra lateral y ganar espacio de trabajo.

---

## 3. Cuadro de Mando (Dashboard)

El **Cuadro de Mando Integral** es la pantalla principal de Bor4SIGE. Ofrece una visión ejecutiva del estado del sistema de gestión en tiempo real.

### Qué verás en el Dashboard

| Tarjeta | Qué mide |
|---------|----------|
| **Índice Global de Cumplimiento** | Puntuación media de todas las normas activas (0–100%) |
| **Acciones CAPA abiertas** | No conformidades pendientes de cierre |
| **Riesgos críticos** | Riesgos con nivel alto no mitigados |
| **Auditorías planificadas** | Auditorías próximas con su estado |

### Matriz ENS (CIDAT)

En el panel del ENS encontrarás los selectores para las 5 dimensiones de seguridad:

- **C** — Confidencialidad
- **I** — Integridad
- **D** — Disponibilidad
- **A** — Autenticidad
- **T** — Trazabilidad

**Cómo usarla:**
1. Selecciona el nivel (Bajo / Medio / Alto) para cada dimensión según la sensibilidad de los datos y servicios de tu organización.
2. El sistema calcula automáticamente la **categoría ENS global** (Básica / Media / Alta) conforme al RD 311/2022.
3. Esta categoría determina las medidas de seguridad obligatorias para tu organización.

### Gráficos de evolución

Los gráficos de la parte inferior del Dashboard muestran la evolución histórica de los indicadores clave. Puedes pasar el cursor por encima de cada punto para ver el valor exacto de ese período.

---

## 4. Gestión Documental

Este módulo te permite controlar toda la documentación del sistema de gestión: manuales, procedimientos, instrucciones técnicas, registros y formatos.

### Cómo registrar un nuevo documento

1. Accede a **Gestión Documental** desde la barra lateral.
2. Haz clic en el botón **"+ Nuevo Documento"**.
3. Rellena los campos del formulario:
   - **Código**: Identificador único del documento (ej: `PR-CAL-001`).
   - **Título**: Nombre descriptivo del documento.
   - **Tipo**: Manual, Procedimiento, Instrucción técnica, Formato/Registro, etc.
   - **Ámbito**: Norma o área a la que pertenece (ej: `Calidad (ISO 9001)`).
   - **Versión**: Número de versión actual (ej: `v1.0`).
   - **Fecha**: Fecha de aprobación o entrada en vigor.
   - **Estado**: Vigente, En Revisión, Obsoleto.
   - **Responsable**: Persona o cargo responsable del documento.
4. Haz clic en **"Guardar"**.

### Cómo actualizar un documento existente

1. Localiza el documento en la tabla (puedes filtrar por tipo, estado o ámbito).
2. Haz clic en el icono de **edición** (✏️) en la fila correspondiente.
3. Modifica los campos que corresponda (normalmente la versión y la fecha).
4. Haz clic en **"Guardar"** para aplicar los cambios.

### Cómo marcar un documento como obsoleto

1. Edita el documento y cambia su **Estado** a `Obsoleto`.
2. Guarda los cambios. El documento permanecerá visible en el historial pero diferenciado visualmente del resto.

### Estados de un documento

| Estado | Significado |
|--------|-------------|
| **Vigente** | Documento en uso, aprobado y aplicable |
| **En Revisión** | Está siendo actualizado o pendiente de aprobación |
| **Obsoleto** | Sustituido por una versión posterior, no aplicable |

---

## 5. Gestión de Auditorías y Acciones Correctivas (CAPA)

### Módulo Auditorías & Acciones

Este módulo centraliza el registro de hallazgos de auditoría, no conformidades y las acciones correctivas derivadas.

#### Cómo registrar una no conformidad

1. Accede a **Auditorías & Acciones** en la barra lateral.
2. Haz clic en **"+ Nueva No Conformidad"**.
3. Completa los campos:
   - **Descripción**: Qué se ha detectado.
   - **Origen**: Auditoría interna, queja de cliente, inspección, etc.
   - **Norma / Cláusula afectada**: Ej: `ISO 9001 §8.4.1`.
   - **Responsable de resolución**: Persona encargada de corregirla.
   - **Fecha límite**: Plazo para resolver la no conformidad.
4. Guarda la no conformidad. Su estado inicial será **"Abierta"**.

#### Cómo registrar una acción correctiva (CAPA)

Una vez abierta la no conformidad, debes asignarle una acción correctiva:

1. Abre la no conformidad existente.
2. En la sección **Acción Correctiva**, rellena:
   - **Análisis de causa raíz**: Utiliza los 5 Porqués o el Diagrama de Ishikawa para identificar la causa real.
   - **Acción a implementar**: Qué se va a hacer para corregirlo.
   - **Evidencias de cierre**: Documento o prueba de que la acción fue ejecutada.
3. Cuando la acción esté completada, cambia el estado a **"Cerrada"** e indica la fecha de cierre.

#### Estados de una no conformidad

| Estado | Significado |
|--------|-------------|
| **Abierta** | Detectada pero sin acción asignada o en curso |
| **En curso** | Acción correctiva en progreso |
| **Cerrada** | Resuelta y con evidencia de cierre |

---

## 6. Gestión de Riesgos

### Cómo registrar un riesgo

1. Accede al módulo **Gestión de Riesgos** desde la barra lateral.
2. Haz clic en **"+ Nuevo Riesgo"**.
3. Rellena los campos:
   - **Descripción del riesgo**: Qué puede ocurrir y por qué.
   - **Área / Proceso afectado**.
   - **Tipo**: Operativo, Seguridad de la información, Ambiental, Compliance, etc.
   - **Probabilidad**: Baja / Media / Alta.
   - **Impacto**: Bajo / Medio / Alto.
4. El sistema calculará automáticamente el **nivel de riesgo** (Bajo / Medio / Alto / Crítico) en función de la combinación de probabilidad e impacto.

### Cómo tratar un riesgo

1. Selecciona el riesgo y edítalo.
2. En la sección **Tratamiento**, indica:
   - **Tipo de tratamiento**: Eliminar, Reducir, Transferir, Aceptar.
   - **Controles o salvaguardas aplicados**: Medidas técnicas u organizativas implementadas.
   - **Riesgo residual**: Nivel de riesgo que queda tras aplicar los controles.
3. Guarda los cambios.

### Mapa de calor de riesgos

En la parte superior del módulo encontrarás la **Matriz de Riesgos** (mapa de calor). Muestra todos los riesgos posicionados según su probabilidad e impacto:
- 🟢 Verde: Riesgo bajo (aceptable).
- 🟡 Amarillo: Riesgo medio (requiere vigilancia).
- 🔴 Rojo: Riesgo alto / crítico (requiere tratamiento inmediato).

---

## 7. Gestión de Cambios TI (RFC)

Este módulo gestiona todas las solicitudes de cambio en los sistemas informáticos de la organización, conforme a ISO 20000 e ITIL.

### Cómo abrir una Solicitud de Cambio (RFC)

1. Accede a **Gestión de Cambios TI** en la barra lateral.
2. Haz clic en **"+ Nueva RFC"**.
3. Rellena el formulario:
   - **Título del cambio**: Descripción breve del cambio propuesto.
   - **Tipo de cambio**:
     - *Estándar*: Cambios preaprobados y de bajo riesgo (ej: actualizar una contraseña).
     - *Normal*: Cambios planificados que requieren aprobación del CAB.
     - *Emergencia*: Cambios urgentes que necesitan autorización inmediata.
   - **Justificación técnica**: Por qué es necesario este cambio.
   - **Plan de pruebas previas**: Qué pruebas se harán antes de implementar.
   - **Plan de reversión (Rollback)**: Cómo se deshará el cambio si algo va mal.
   - **Responsable técnico**: Quién lo va a ejecutar.
   - **Fecha de implementación prevista**.

> ⚠️ **Importante:** Los campos de Plan de Pruebas y Plan de Rollback son **obligatorios**. El agente de IA de Bor4SIGE detectará automáticamente las RFCs que carezcan de ellos y generará una alerta.

### Estados de una RFC

| Estado | Significado |
|--------|-------------|
| **Pendiente de aprobación** | En espera de revisión por el CAB o el responsable |
| **Aprobada** | Lista para ser implementada |
| **En implementación** | Cambio en curso |
| **Completada** | Cambio implementado y verificado con éxito |
| **Rechazada** | El CAB ha denegado el cambio |
| **Revertida** | Se aplicó el plan de rollback |

---

## 8. Gestión de Compras y Evaluación de Proveedores

Este módulo centraliza la homologación y control de proveedores externos junto con la emisión e inspección de pedidos de compras, garantizando el cumplimiento de **ISO 9001 §8.4**.

### Catálogo y Homologación de Proveedores

1. Accede a **Compras y Proveedores** desde la barra lateral.
2. Selecciona un proveedor de la lista o añade uno con **"+ Nuevo Proveedor"**.
3. El sistema evalúa automáticamente el estado de homologación basado en su historial:
   - **Homologado**: Proveedor apto con nota media alta y suministros conformes.
   - **Bajo Evaluación**: Proveedor nuevo o en reevaluación.
   - **Suspendido**: Proveedor no apto debido a incidencias graves o baja calificación.
   - **Seguimiento Especial**: Proveedor con incidencias pero que es único y crítico (sin alternativas viables).
   - **Inactivo (Baja)**: Proveedor que ha sido dado de baja por inactividad prolongada (más de 3 años sin suministros). Se incluye un botón **"Control de Inactividad"** para ejecutar el análisis en lote.

### Registro de Pedidos de Compras

1. Ve a la pestaña **Pedidos y Compras** y haz clic en **"+ Nuevo Pedido de Compra"**.
2. Rellena el formulario:
   - **Proveedor**: Elige de la lista. El sistema filtra por la categoría del producto elegido.
   - **Origen**: Selecciona entre *Reposición de Almacén* o *Propuesta por Pedido de Cliente* (las propuestas de compra generadas desde Producción se listan y se cargan automáticamente aquí).
   - **Artículo**: Elige un producto o material del catálogo unificado (`sig_catalogo_general`).
   - **Cantidad y Costo Unitario**: Se autocalcula el importe total del pedido.
   - **Requisitos Técnicos (Checklist)**: Especifica si requiere *Ficha Técnica*, *Certificado de Calidad* o *Declaración de Conformidad*.
3. **Bloqueo de Proveedores No Aprobados**: Si seleccionas un proveedor en estado *Suspendido* o *Inactivo*, el sistema bloqueará el guardado del pedido y mostrará una advertencia. Para proceder por vía excepcional, deberás marcar la casilla **"Autorización de Gerencia"** y documentar detalladamente la justificación obligatoria.

### Inspección de Recepción y Gestión de No Conformidades

Al recibir el pedido de compra en el almacén:
1. Haz clic en **"Recibir"** sobre el pedido pendiente de recepción.
2. Selecciona si la entrega es **Conforme** o **No Conforme**:
   - Si es **No Conforme**, clasifica la gravedad (*Leve* o *Grave*) y el motivo (ej. *Material defectuoso*, *Plazo incumplido*, *Falta de documentación*). Indica la cantidad de unidades devueltas.
   - **Albarán de Devolución**: En caso de no conformidad, el sistema genera automáticamente un albarán en rojo destacando la instrucción física obligatoria: *"AVISO OBLIGATORIO: Trasladar material a la zona de 'Material No Conforme' y etiquetar correspondientemente"*.
3. **Transición Automática de Estados**:
   - 3 entregas consecutivas conformes homologan automáticamente a un proveedor en evaluación.
   - Un registro de entrega *No Conforme Grave* degrada automáticamente al proveedor al estado *Suspendido* (si existen alternativas registradas para esa categoría de producto en el catálogo) o a *Seguimiento Especial* (si no hay alternativas). Adicionalmente, se abre automáticamente una **No Conformidad (CAPA)** en el SGI.
   - La nota media histórica del proveedor se recalcula a partir de los criterios evaluados (Calidad, Plazos, Soporte, ESG). Si la nota cae por debajo de **2.5**, el proveedor pasa a estar suspendido y se genera una CAPA.

---

## 9. Eficacia de la Formación

Este módulo evalúa si las acciones formativas están teniendo el impacto esperado en la organización.

### Cómo registrar la evaluación de una formación

1. Accede a **Eficacia de Formación** en la barra lateral.
2. Selecciona la formación de la lista o añade una nueva.
3. Evalúa los 4 niveles del **modelo Kirkpatrick**:

| Nivel | Qué se evalúa | Cuándo |
|-------|--------------|--------|
| **1. Reacción** | Satisfacción de los participantes (encuesta) | Al finalizar la formación |
| **2. Aprendizaje** | Nota del examen o prueba de conocimiento | Al finalizar la formación |
| **3. Comportamiento** | Aplicación en el puesto de trabajo | 3 meses después |
| **4. Resultados** | Impacto en los KPIs del área (ej: reducción de errores) | 6 meses después |

4. Introduce la puntuación de cada nivel (1 a 5).
5. El sistema calcula la media y determina si la formación es **Eficaz** (≥ 3.0) o **No Eficaz** (< 3.0).

### Qué ocurre si una formación es declarada "No Eficaz"

El sistema crea automáticamente una **Acción de Mejora** en el módulo de Auditorías, indicando que se debe:
- Rediseñar el contenido de la formación.
- Proporcionar formación de refuerzo a los participantes con menor puntuación.
- Evaluar de nuevo en el próximo ciclo.

---

## 10. Satisfacción del Cliente

### Cómo registrar una encuesta de satisfacción

1. Accede a **Satisfacción del Cliente** en la barra lateral.
2. Haz clic en **"+ Nueva Encuesta"**.
3. Introduce:
   - **Cliente / Proyecto**: A quién corresponde la encuesta.
   - **Período**: Trimestre o campaña de medición.
   - **Puntuaciones** por criterio (producto, servicio, comunicación, plazos, etc.).
   - **Comentarios cualitativos** recibidos.
4. El sistema calcula el **índice de satisfacción global** y lo refleja en el Dashboard.

### Cómo gestionar una queja de cliente

1. Accede al módulo de Satisfacción o directamente a **Auditorías & Acciones**.
2. Registra la queja como **No Conformidad** con origen "Queja de Cliente".
3. Sigue el proceso CAPA descrito en el apartado 5 de este manual.
4. Una vez resuelta, notifica al cliente la solución adoptada.

---

## 11. Incidentes de Seguridad

### Cómo registrar un incidente de seguridad de la información

1. Accede a **Incidentes de Seguridad** en la barra lateral.
2. Haz clic en **"+ Nuevo Incidente"**.
3. Rellena el formulario:
   - **Tipo de incidente**: Acceso no autorizado, filtración de datos, malware, caída de sistema, etc.
   - **Descripción detallada**: Qué ocurrió, cuándo y cómo se detectó.
   - **Sistemas afectados**: Qué equipos, aplicaciones o datos se han visto afectados.
   - **Clasificación**: Bajo / Medio / Alto / Crítico.
   - **Responsable de respuesta**: Persona que gestiona el incidente.
4. Guarda el incidente. El sistema le asignará un ID único y marcará la fecha/hora de apertura.

### Cómo cerrar un incidente

1. Abre el incidente existente.
2. Documenta las **acciones de contención** tomadas (ej: aislamiento de sistemas, cambio de contraseñas).
3. Indica la **causa raíz** identificada.
4. Describe las **medidas preventivas** adoptadas para evitar que se repita.
5. Cambia el estado a **"Cerrado"** e indica la fecha de resolución.

> Si el incidente supone una brecha de datos personales que afecta a ciudadanos de la UE, recuerda que el **RGPD obliga a notificar a la AEPD en menos de 72 horas**.

---

## 12. Seguridad y Salud en el Trabajo (SST)

### Cómo registrar un accidente o incidente laboral

1. Accede a **Investigación de Accidentes SST** en la barra lateral.
2. Haz clic en **"+ Nuevo Accidente / Incidente"**.
3. Rellena los datos del formulario:
   - **Tipo**: Accidente con baja, accidente sin baja, incidente (casi-accidente).
   - **Descripción**: Qué ocurrió, cómo y dónde.
   - **Personas afectadas**: Nombre, puesto y lesiones producidas.
   - **Causas inmediatas**: Qué condición o acto inseguro lo provocó.
   - **Causas raíz**: Factores de gestión o del entorno que lo permitieron.
   - **Medidas correctoras**: Qué se hace para que no vuelva a ocurrir.
4. Guarda el registro. Quedará como **evidencia documental obligatoria** conforme a ISO 45001.

---

## 13. Gestión Ambiental

### Evaluación de aspectos ambientales

1. Accede a **Evaluación de Aspectos Ambientales** en la barra lateral.
2. Haz clic en **"+ Nuevo Aspecto Ambiental"**.
3. Describe el aspecto (ej: "Consumo de agua en planta") y su impacto ambiental asociado (ej: "Agotamiento de recurso hídrico").
4. Evalúa los criterios de significatividad: frecuencia, severidad, alcance legal, capacidad de actuación.
5. El sistema determina si el aspecto es **Significativo** (requiere control operacional) o **No Significativo**.

### Riesgos y Oportunidades del Cambio Climático

1. Accede a **Riesgos Cambio Climático** en la barra lateral.
2. Registra riesgos físicos (inundaciones, olas de calor) y de transición (nuevas regulaciones, cambios de mercado).
3. Para cada riesgo, indica el horizonte temporal (corto, medio, largo plazo) y el impacto financiero estimado.

---

## 14. Canal de Denuncias

El Canal de Denuncias permite comunicar de forma confidencial cualquier irregularidad, conducta contraria a la ética o posible incumplimiento legal.

### Cómo presentar una denuncia

1. Accede a **Canal de Denuncias** desde la barra lateral.
2. Haz clic en **"Nueva Denuncia"**.
3. Rellena el formulario:
   - **Categoría**: Corrupción, acoso, fraude, conflicto de intereses, incumplimiento normativo, etc.
   - **Descripción de los hechos**: Describe la situación de forma detallada.
   - **Fecha aproximada** en que ocurrieron los hechos.
   - **Identidad** (opcional — el sistema permite la denuncia anónima).
4. Envía la denuncia. El sistema generará un **código de seguimiento** que puedes usar para consultar el estado.

> Todas las denuncias son **confidenciales**. El sistema garantiza que solo el responsable del canal tiene acceso a la información.

---

## 15. Cumplimiento Legal y ENS

### Gestión de requisitos legales

1. Accede a **Requisitos Legales** en la barra lateral.
2. El módulo muestra el catálogo de obligaciones legales aplicables a la organización.
3. Para cada requisito puedes indicar:
   - **Estado**: Cumplido / En proceso / Incumplido.
   - **Responsable** del seguimiento.
   - **Fecha de próxima revisión**.
4. Los requisitos con vencimiento próximo aparecen marcados con alerta.

### Panel ENS — Medidas de control

1. Accede a **Requisitos Legales y ENS** en la barra lateral.
2. El panel muestra todas las medidas del ENS organizadas en tres marcos:
   - **Marco Organizativo**: Políticas de seguridad, roles y responsabilidades.
   - **Marco Operacional**: Gestión de activos, incidentes, continuidad.
   - **Medidas de Protección**: Controles técnicos por tipo de activo.
3. Para cada medida, selecciona su **grado de implantación** (L0: No implantada → L5: Optimizada).
4. El sistema calcula el porcentaje de cumplimiento ENS global.

---

## 16. Revisión por la Dirección

### Cómo preparar y registrar la Revisión por la Dirección

La Revisión por la Dirección es una reunión periódica (mínimo anual) donde la alta dirección evalúa el desempeño del sistema de gestión.

1. Accede a **Revisión por la Dirección** en la barra lateral.
2. Haz clic en **"+ Nueva Revisión"**.
3. Introduce los datos de la reunión: fecha, participantes, persona que la convoca.
4. Cumplimenta las secciones de la revisión:
   - **Resultados de auditorías** anteriores.
   - **Feedback de clientes** y partes interesadas.
   - **Desempeño de los procesos** y conformidad del producto/servicio.
   - **Estado de las acciones correctivas** abiertas.
   - **Seguimiento de decisiones** de revisiones anteriores.
   - **Cambios** que podrían afectar al sistema de gestión.
   - **Recursos necesarios**.
5. En la sección **Decisiones y Acciones**, registra los compromisos adoptados con sus responsables y plazos.
6. Guarda la revisión como **"Cerrada"** una vez completada.

---

## 17. Mapa de Procesos y KPIs

### Mapa de Procesos

El **Mapa de Procesos** muestra la estructura de procesos de la organización clasificados en:
- **Procesos estratégicos**: Planificación estratégica, revisión por la dirección.
- **Procesos clave / operativos**: Producción, prestación del servicio, atención al cliente.
- **Procesos de soporte**: RRHH, TI, compras, mantenimiento.

Para ver el detalle de un proceso, haz clic sobre él en el mapa. Se abrirá la **Ficha de Proceso** correspondiente.

### Panel de KPIs de Proceso

1. Accede a **Panel de KPIs de Proceso** en la barra lateral.
2. El panel muestra todos los indicadores de desempeño configurados para cada proceso.
3. Para cada KPI puedes ver:
   - **Valor actual** vs. **Objetivo**.
   - **Tendencia** (subiendo 📈 / bajando 📉 / estable).
   - **Histórico** en los últimos períodos.
4. Los KPIs que no alcanzan el objetivo aparecen resaltados en rojo como señal de alerta.

---

## 18. Análisis DAFO y Partes Interesadas

### Análisis DAFO

1. Accede a **Análisis DAFO Estratégico** en la barra lateral.
2. Haz clic en **"+ Nuevo Factor"** y selecciona la categoría:
   - **Fortaleza**: Ventajas internas de la organización.
   - **Debilidad**: Áreas internas de mejora.
   - **Oportunidad**: Factores externos favorables.
   - **Amenaza**: Factores externos que suponen un riesgo.
3. Escribe el título y la descripción del factor, su impacto estimado y si tiene un plan de acción asociado.

### Gestión de Partes Interesadas

1. Accede a **Gestión de Partes Interesadas** en la barra lateral.
2. El módulo muestra el mapa de partes interesadas (stakeholders): clientes, proveedores, empleados, administración, accionistas, comunidad, etc.
3. Para cada parte interesada puedes registrar:
   - Sus **necesidades y expectativas** respecto al sistema de gestión.
   - Su **nivel de influencia** e **interés** en la organización.
   - Los **requisitos** derivados que el sistema debe cumplir.

---

## 19. Catálogo Unificado de Productos y Servicios

El **Catálogo Unificado** (`sig_catalogo_general`) centraliza el portafolio de servicios y productos/artículos de la organización, de conformidad con **ISO 20000-1 §8.11** (Catálogo de Servicios) e **ISO 9001 §8.5.1**.

### Estructura de Elementos en el Catálogo

El catálogo diferencia entre dos tipos de elementos mediante pestañas dedicadas:
1. **Servicios TI y Operación**:
   - **Atributos**: Acuerdo de Nivel de Servicio (SLA) objetivo, disponibilidad real registrada, tiempo de respuesta máximo, tiempo de resolución, ventana horaria de soporte, nivel de criticidad del negocio y dependencias técnicas (ej. bases de datos, redes).
   - **Trazabilidad**: Asigna la responsabilidad de cada servicio a un rol propietario (ej. Responsable de Sistemas, Responsable de SAP).
2. **Productos e Inventario (Artículos)**:
   - **Atributos**: Stock actual de almacén, stock mínimo (seguridad), stock de capacidad máxima, costo unitario de adquisición y ubicación física específica (ej. Zona A - Estantería 3).
   - **Trazabilidad**: Permite calcular el valor monetario total del inventario y disparar alertas de reposición inmediatas cuando el stock real desciende por debajo del mínimo de seguridad.

### Gestión de Catálogo
- Para registrar un nuevo elemento, pulsa **"Nuevo Elemento"** y selecciona el tipo (*Servicio* o *Producto*). Esto alternará dinámicamente los campos requeridos en el formulario.
- Los elementos del catálogo se vinculan directamente al módulo de **Producción** (para recibir pedidos de clientes) y al módulo de **Compras** (para suministrar materiales y licencias).

---

## 20. Producción y Gestión de Capacidad (ISO 20000-1)

El módulo de **Producción y Gestión de Capacidad** asegura que la organización dispone de los recursos técnicos, materiales y de personal necesarios para prestar los servicios y suministrar los productos demandados por los clientes, cumpliendo con **ISO 20000-1 §6.3** (Planificación de capacidad).

### Registro de Pedidos de Clientes y Demanda de Recursos
1. Accede a **Producción y Capacidad** en la barra lateral.
2. Ve a la pestaña **Pedidos de Clientes** y haz clic en **"Nuevo Pedido de Cliente"**.
3. Rellena los datos de la demanda del cliente:
   - Selecciona el artículo o servicio correspondiente de tu Catálogo General.
   - Especifica las demandas de recursos asociadas al pedido: *Horas de soporte técnico*, *Capacidad de infraestructura (vCPUs)* y *Materias primas (Kg / Uds)*.
4. Al guardar el pedido:
   - Si es un producto del catálogo, el sistema **descuenta automáticamente** la cantidad pedida del stock de inventario en el Catálogo.
   - Si no hay suficiente stock en almacén, aparecerá una alerta destacada y se habilitará un botón de **"Propuesta de Compra"** (icono de carrito) para enviar una solicitud de suministro directamente a Compras.

### Dashboard de Capacidad e Indicadores en Tiempo Real
En la pestaña **Dashboard de Capacidad y Disponibilidad**, el sistema procesa los pedidos activos y muestra:
1. **Medidores de Capacidad (Gauges)**:
   - **Soporte Técnico (Banda de Horas)**: Nivel de ocupación de la plantilla (ej. sobre 150h semanales).
   - **Infraestructura Cloud / Servidores**: Uso de vCPUs en los entornos productivos (ej. sobre 500 vCPUs).
   - **Materias Primas / Componentes**: Capacidad física de almacenamiento o inventario disponible.
2. **Análisis Predictivo de Tendencias (6 Meses)**:
   - Gráfico de barras temporales que proyecta el consumo acumulado de recursos basado en el histórico y las entregas futuras de los pedidos de clientes.
   - **Alertas de Saturación**: Si el consumo proyectado supera el umbral crítico de capacidad (70%), el gráfico activará una línea de advertencia discontinua con alertas preventivas para anticipar la contratación de personal o ampliación de infraestructura.
3. **Estudios de Carga e Incidencias de Capacidad**:
   - Listado interactivo de cuellos de botella detectados (ej. almacenamiento NAS saturado, túneles VPN saturados).
   - Permite lanzar solicitudes de compra de infraestructura de forma integrada con Compras para corregir desviaciones.

---

## 21. Seguimiento por IA — Panel de Cumplimiento Automático

El **Panel de Cumplimiento por IA** está integrado en el Cuadro de Mando y realiza un análisis automático y continuo de los datos del sistema para detectar incumplimientos.

### Cómo funciona

El motor de IA escanea los siguientes aspectos de forma periódica:

| Área auditada | Qué comprueba |
|---------------|---------------|
| **Cambios TI** | Detecta RFCs sin Plan de Pruebas o sin Plan de Rollback |
| **Proveedores** | Verifica que los proveedores con nota < 2.5 tienen CAPA abierta |
| **Formación** | Comprueba que las formaciones no eficaces tienen acción de mejora |
| **Capacidad y Stock** | Alerta de roturas de stock en el catálogo e incidencias de capacidad crítica activas sin propuesta de compra |
| **ENS** | Detecta medidas de seguridad obligatorias no implantadas |

### Cómo interpretar las alertas

El panel muestra alertas con tres niveles de severidad:

| Símbolo | Color | Significado |
|---------|-------|-------------|
| ✅ CONFORME | Verde | El punto auditado cumple los requisitos |
| ⚠️ ALERTA | Naranja | Hay una desviación que requiere atención |
| ❌ CRÍTICO | Rojo | Incumplimiento grave que requiere acción inmediata |

### Qué hacer cuando aparece una alerta

1. Haz clic sobre la alerta para ver el detalle.
2. El sistema te indicará exactamente qué módulo y qué registro está causando el incumplimiento.
3. Navega al módulo indicado y subsana la incidencia.
4. En el próximo escaneo automático, la alerta desaparecerá si el problema ha sido resuelto.

### Registro de auditoría IA

Cada detección queda registrada con fecha y hora en el **Log de Auditoría IA**, lo que proporciona una **trazabilidad completa** útil como evidencia en auditorías externas.

---

## 22. Asistente Virtual (Chatbot)

El **Asistente Virtual** de Bor4SIGE está disponible en todo momento en la esquina inferior derecha de la pantalla. Puedes consultarle sobre:

- **Cómo realizar tareas** en la aplicación (ej: *"¿Cómo registro una no conformidad?"* o *"¿Cómo añado un pedido de cliente y consulto la capacidad?"*).
- **Requisitos de las normas ISO y ENS** (ej: *"¿Qué dice ISO 9001 sobre la evaluación de proveedores?"* o *"¿Cuáles son los requisitos de capacidad de ISO 20000-1?"*).
- **Navegación asistida**: Al responder, el chatbot incluye botones que te llevan directamente al módulo correspondiente con un solo clic.

### Cómo usar el chatbot

1. Haz clic en el **botón flotante** 🤖 en la esquina inferior derecha.
2. Se abrirá el panel de chat.
3. Escribe tu pregunta en el campo de texto y pulsa **Enviar** (↵ o el botón ➤).
4. El asistente responderá en segundos.
5. Si la respuesta incluye un botón de navegación, haz clic en él para ir directamente al módulo correspondiente.

### Ejemplos de preguntas útiles

- *"¿Cómo abro una RFC?"*
- *"¿Qué es el modelo Kirkpatrick?"*
- *"¿Cómo evalúo a un proveedor?"*
- *"¿Cómo analizo la capacidad y disponibilidad en ISO 20000-1?"*
- *"¿Dónde registro un accidente laboral?"*
- *"¿Cómo solicito una propuesta de compra de almacén?"*

---

## 23. Preguntas Frecuentes

**¿Puedo usar Bor4SIGE sin conexión a internet?**
Sí. Bor4SIGE está diseñado para funcionar completamente offline. Los datos se guardan en tu navegador (localStorage) o en el servidor local si usas el script de arranque.

**¿Los datos se pierden si cierro el navegador?**
No, siempre que hayas arrancado el servidor con `iniciar_servidor.bat`. Los datos se guardan en `db.json`. Si usas el modo directo (sin servidor), los datos permanecen en el navegador hasta que se borre el caché.

**¿Puedo acceder desde varios equipos a la vez?**
Sí, si el servidor está en red. Varios usuarios pueden acceder simultáneamente desde distintos equipos apuntando a la IP del servidor en su navegador.

**¿Qué hago si un módulo no carga?**
Intenta recargar la página (F5). Si el problema persiste, comprueba que el servidor está activo (la consola del servidor debe estar abierta y sin errores).

**¿Cómo sé si mis datos se están guardando en el servidor o solo en mi navegador?**
Si el servidor está activo, verás el mensaje *"Estado cargado desde el servidor"* en la consola del navegador (F12 → Consola). Si aparece el mensaje de *fallback local*, significa que el servidor no está disponible y los datos se están guardando solo en ese navegador.

**¿Cómo puedo exportar o imprimir un informe?**
Accede al módulo **Previsualización de Informes** en la barra lateral. Desde allí puedes generar informes de auditoría y revisión por la dirección listos para imprimir o guardar como PDF usando la función de impresión del navegador (Ctrl+P).

**¿Quién puedo consultar si tengo dudas sobre una norma?**
Puedes preguntarle directamente al **Asistente Virtual** integrado en la aplicación. Está preparado para responder preguntas sobre los requisitos de ISO 9001, 14001, 45001, 27001, 22301, 37001, 37301, 20000, 27701 y el ENS.

---

*Bor4SIGE — Sistema Integrado de Gestión Empresarial | © 2026*

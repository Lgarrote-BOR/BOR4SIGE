# Manual de Uso de la Aplicación — SIGE 2.0
## Sistema de Gestión Integrado (SGI) & Compliance

Este manual proporciona una guía detallada sobre la estructura, módulos y operación del sistema **SIGE 2.0**, diseñado para simplificar y automatizar el cumplimiento de múltiples normas internacionales de gestión (ISO) y del **Esquema Nacional de Seguridad (ENS)** español.

---

## Índice

1. [Introducción y Objetivos](#1-introducción-y-objetivos)
2. [Estructura del Portal y Arquitectura Técnica](#2-estructura-del-portal-y-arquitectura-técnica)
3. [Descripción y Operación de Módulos Core](#3-descripción-y-operación-de-módulos-core)
   - [3.1 Cuadro de Mando Integral (Dashboard)](#31-cuadro-de-mando-integral-dashboard)
   - [3.2 Estrategia y Contexto Estratégico](#32-estrategia-y-contexto-estratégico)
   - [3.3 Cumplimiento, ENS y Catálogo Legal](#33-cumplimiento-ens-y-catálogo-legal)
   - [3.4 Gestión de Cambios TI (RFC) — ISO 20000-1 §8.5](#34-gestión-de-cambios-ti-rfc--iso-20000-1-85)
   - [3.5 Desempeño de Proveedores — ISO 9001 §8.4](#35-desempeño-de-proveedores--iso-9001-84)
   - [3.6 Eficacia de Formación — ISO 9001/45001 §7.2](#36-eficacia-de-formación--iso-900145001-72)
   - [3.7 Gestión de Riesgos y Continuidad (BCP)](#37-gestión-de-riesgos-y-continuidad-bcp)
   - [3.8 Operaciones, CAPA e Incidencias](#38-operaciones-capa-e-incidencias)
   - [3.9 Gestión Documental](#39-gestión-documental)
   - [3.10 Personas y Seguridad y Salud en el Trabajo (SST)](#310-personas-y-seguridad-y-salud-en-el-trabajo-sst)
4. [Seguimiento Automatizado y Auditoría con IA](#4-seguimiento-automatizado-y-auditoría-con-ia)
5. [Asistente Chatbot Virtual](#5-asistente-chatbot-virtual)
6. [Instrucciones de Despliegue (Instalable/Pendrive)](#6-instrucciones-de-despliegue-instalablependrive)

---

## 1. Introducción y Objetivos

El portal **SIGE 2.0** centraliza los requisitos de calidad, medio ambiente, seguridad de la información, continuidad de negocio, compliance y gestión de servicios TI de una organización. 

Los objetivos fundamentales son:
- **Reducir la carga burocrática**: Evitar la duplicidad de registros comunes a varias normas (como planes de acción, no conformidades o gestión de riesgos).
- **Adecuación al ENS**: Ofrecer herramientas interactivas para calcular la categoría del ENS en base a las dimensiones **CIDAT** (Confidencialidad, Integridad, Disponibilidad, Autenticidad, Trazabilidad) y controlar las medidas de control requeridas.
- **Sincronización Transparente**: Proporcionar persistencia local autónoma (offline-first) y sincronización fluida con base de datos en servidor cuando esté conectado.

---

## 2. Estructura del Portal y Arquitectura Técnica

El sistema está construido como una aplicación web de una sola página (SPA) simulada con marcos de navegación (`iframes`):
- **Shell Principal (`index.html`)**: Contiene la barra lateral de navegación dinámica colapsable, un buscador de módulos en tiempo real, el simulador de perfiles de usuario (con control de accesos por Tenant) y el **Chatbot Virtual** flotante.
- **Lienzo de Contenido (`content-iframe`)**: Carga dinámicamente el HTML de cada módulo en un espacio de trabajo aislado.
- **Capa de Datos Compartida (`api-sync.js`)**: Modifica de forma transparente el comportamiento de `localStorage` dentro de los iframes. Si el servidor Node.js centralizado está activo, las operaciones de almacenamiento se guardan en el archivo `db.json` del servidor; en caso contrario, se realiza un fallback local transparente en el navegador del usuario.

---

## 3. Descripción y Operación de Módulos Core

### 3.1 Cuadro de Mando Integral (Dashboard)
El centro neurálgico del portal. Muestra:
- **Indicadores Clave (Bento Grid)**: Índice global de cumplimiento, volumen de acciones correctivas (CAPA), riesgos críticos y auditorías planificadas.
- **Alcance por Organización**: Selector multi-tenant para aislar la información de diferentes clientes/sedes (Alfa, Beta, Omega) con control de visibilidad de normas configurables.
- **Matriz de Dimensiones del ENS (CIDAT)**: Selector interactivo para asignar los niveles (Bajo, Medio, Alto) a cada dimensión de seguridad, calculando al instante la categoría global resultante del sistema según el RD 311/2022.
- **Agente de Auditoría por IA**: Módulo integrado para automatizar la revisión del cumplimiento regulatorio (ver sección 4).

### 3.2 Estrategia y Contexto Estratégico
- **Análisis de Contexto**: Registro y seguimiento de factores estratégicos internos y externos (ISO 9001 §4.1).
- **Matriz DAFO**: Permite estructurar Debilidades, Amenazas, Fortalezas y Oportunidades cruzando planes estratégicos.
- **Partes Interesadas**: Gestión del alcance de las necesidades y expectativas de clientes, socios, administración y empleados (ISO 9001 §4.2).
- **Mapa de Procesos**: Visualización del inventario de procesos estratégicos, clave y de soporte.
- **Ficha de Proceso**: Plantilla interactiva con los dueños de proceso, entradas, salidas, KPIs, recursos y riesgos asociados.

### 3.3 Cumplimiento, ENS y Catálogo Legal
- **Requisitos Legales**: Control del catálogo legal y plazos de renovación de licencias u obligaciones estatales.
- **Requisitos Normativos ENS**: Panel detallado que desglosa las medidas del Esquema Nacional de Seguridad organizadas en marcos organizativos, operacionales y de medidas técnicas.
- **Revisión Puntos Norma**: Lista de control para auditar cláusula por cláusula las normas de referencia ISO.

### 3.4 Gestión de Cambios TI (RFC) — ISO 20000-1 §8.5
Diseñado para la gestión y autorización técnica de cambios en servicios informáticos.
- **Operación**: Permite abrir Solicitudes de Cambio (RFC) clasificadas como Normales, Estándar o de Emergencia.
- **Obligaciones**: Obliga a documentar la justificación técnica, el plan de pruebas previas y el **Plan de Reversión (Rollback)**.
- **Comité de Cambios (CAB)**: Permite simular la evaluación y la aprobación técnica formal antes de pasar al estado de implementación.

### 3.5 Desempeño de Proveedores — ISO 9001 §8.4
Centraliza el control operativo y la evaluación anual obligatoria de los prestadores de servicios y subcontratistas.
- **Operación**: Registra evaluaciones en base a 4 criterios clave: Calidad, Plazos (SLA), Atención de soporte y Seguridad/ESG (puntuación de 1 a 5).
- **Acción Preventiva**: El sistema calcula de forma autónoma la nota media. Si el proveedor obtiene una nota final inferior a **2.5**, se bloquea su estado como "No Apto/Suspendido" y el sistema **dispara de forma automática una No Conformidad (CAPA)**.

### 3.6 Eficacia de Formación — ISO 9001/45001 §7.2
Mide el impacto real de las acciones formativas en el puesto de trabajo.
- **Operación**: Evalúa las formaciones recibidas utilizando el modelo internacional de **4 Niveles de Kirkpatrick**:
  1. *Reacción*: Satisfacción de los alumnos.
  2. *Aprendizaje*: Calificación de exámenes y test teóricos.
  3. *Comportamiento*: Aplicabilidad en el puesto de trabajo (evaluado a los 3 meses por el supervisor).
  4. *Resultados*: Impacto cuantitativo en los KPIs de la organización (ej: reducción de incidencias).
- **Mejora Continua**: Si la media es inferior a **3.0**, la formación se declara "No Eficaz" y el sistema **registra de manera autónoma una Acción de Mejora / Refuerzo formativo** para subsanar la brecha de competencia.

### 3.7 Gestión de Riesgos y Continuidad (BCP)
- **Evaluación de Riesgos**: Metodologías adaptadas a Magerit (seguridad de la información), riesgos de calidad (ISO 9001), riesgos compliance penal e impacto del cambio climático.
- **Matriz de Riesgos v2**: Mapa de calor interactivo que visualiza la probabilidad frente al impacto.
- **Tratamiento y Mitigación**: Registro de controles y salvaguardas aplicadas.
- **Continuidad del Negocio (BCP)**: Permite registrar y evaluar planes de contingencia, análisis de impacto al negocio (BIA) e historial de simulacros anuales bajo la norma ISO 22301.

### 3.8 Operaciones, CAPA e Incidencias
- **Incidencias y NC**: Punto de entrada de todas las desviaciones, fallos técnicos, quejas de clientes y no conformidades.
- **Acciones Correctivas (CAPA)**: Panel para formular análisis de causa raíz (5 Porqués / diagrama de Ishikawa) y asignar tareas correctivas con fechas límite.
- **Acciones de Mejora**: Registro de oportunidades preventivas sugeridas por el personal o derivadas de auditorías.

### 3.9 Gestión Documental
- **Explorador de Documentos**: Biblioteca jerárquica con las políticas y procedimientos vigentes.
- **Gestor Documental SGI**: Controla la codificación, versión, fecha de vigencia y autoría.
- **Flujo de Aprobación**: Permite simular los estados de "Redacción", "Revisión" y "Aprobación" por los responsables asignados.

### 3.10 Personas y Seguridad y Salud en el Trabajo (SST)
- **Directorio de Personal**: Listado de empleados con cargos y competencias.
- **Plan Formativo Anual**: Agenda de cursos planificados por área.
- **Investigación de Accidentes**: Registro obligatorio de incidentes, lesiones y medidas adoptadas (ISO 45001 §10.2).

---

## 4. Seguimiento Automatizado y Auditoría con IA

El portal de **SIGE 2.0** incorpora una capacidad avanzada de **Seguimiento Automatizado de Cumplimiento por Inteligencia Artificial**. Esta función se activa desde la tarjeta integrada en el Cuadro de Mando Integral y opera de forma autónoma:

1. **Escaneo de Base de Datos**: El agente de IA audita de manera continua los datos de los diferentes módulos del SGI para verificar el cumplimiento normativo.
2. **Auditorías Específicas**:
   - **En Gestión de Cambios (ISO 20000-1 §8.5)**: Detecta solicitudes de cambio en estado abierto que carecen de plan de reversión (Rollback) o planes de prueba previos y genera alertas críticas inmediatas.
   - **En Desempeño de Proveedores (ISO 9001 §8.4)**: Verifica si los proveedores que tienen notas deficientes cuentan con su correspondiente expediente de No Conformidad abierto en el módulo CAPA para justificar la acción correctora.
   - **En Eficacia Formativa (ISO 45001 §7.2)**: Analiza que los expedientes calificados como no eficaces tengan asignado un plan de refuerzo o tutoría activa.
   - **En Controles Técnicos**: Evalúa la aplicación de directivas del ENS e inspecciones obligatorias de ISO 14001.
3. **Registro Autónomo**: A medida que detecta desvíos, escribe en el **Log de Actividad IA** y actualiza el contador de acciones de auditoría en el panel en tiempo real.

---

## 5. Asistente Chatbot Virtual

En la esquina inferior derecha del portal se encuentra el **Asistente Chatbot Virtual**. Está diseñado para brindar soporte interactivo en tiempo real al usuario:
- **Consultas Operativas**: Explica cómo usar el software y realizar tareas comunes (ej: *"¿Cómo registro un RFC?"* o *"¿Cómo evalúo a un proveedor?"*).
- **Consultas Normativas**: Resuelve dudas sobre las cláusulas y requisitos de las normas de referencia (ej: *"¿Qué es el ENS?"*, *"¿Qué mide Kirkpatrick?"*).
- **Acceso Directo (Navegación Asistida)**: Las respuestas del bot incorporan botones de acción directa en español. Al pulsar el botón, el asistente redirige automáticamente la pantalla al módulo exacto correspondiente, facilitando el aprendizaje y agilizando la gestión.

---

## 6. Instrucciones de Despliegue (Instalable/Pendrive)

Para utilizar la aplicación en modo autónomo local (ej: desde una unidad pendrive o disco duro local):

1. **Estructura Portátil**: Todos los componentes están integrados en la carpeta `sgi_webapp_instalable/`.
2. **Ejecución Directa (Modo Local)**:
   - Abra el archivo `index.html` con cualquier navegador web moderno (Edge, Chrome, Firefox).
   - En este modo, el portal funcionará de forma local usando la memoria `localStorage` persistente de su navegador.
3. **Ejecución con Servidor Local (Recomendado para Sincronización)**:
   - Requiere tener instalado **Node.js** en el equipo.
   - Ejecute el script `iniciar_servidor.bat` (en Windows) o `iniciar_servidor.sh` (en Linux/Mac).
   - El servidor se iniciará en `http://localhost:3000/`.
   - Todas las modificaciones se guardarán centralizadas en el archivo `db.json`.

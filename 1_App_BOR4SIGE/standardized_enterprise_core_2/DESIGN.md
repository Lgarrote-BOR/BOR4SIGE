---
name: Standardized Enterprise Core
colors:
  surface: '#f8f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f8f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#43474f'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#0060ac'
  on-secondary: '#ffffff'
  secondary-container: '#68abff'
  on-secondary-container: '#003e73'
  tertiary: '#00222d'
  on-tertiary: '#ffffff'
  tertiary-container: '#193743'
  on-tertiary-container: '#83a0af'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#d4e3ff'
  secondary-fixed-dim: '#a4c9ff'
  on-secondary-fixed: '#001c39'
  on-secondary-fixed-variant: '#004883'
  tertiary-fixed: '#c9e7f7'
  tertiary-fixed-dim: '#adcbda'
  on-tertiary-fixed: '#001f2a'
  on-tertiary-fixed-variant: '#2e4b57'
  background: '#f8f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: IBM Plex Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-md:
    fontFamily: jetbrainsMono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  max-width: 1440px
---

## Brand & Style

El sistema de diseño está concebido para entornos corporativos de alta criticidad, específicamente para la gestión de normas ISO y el Esquema Nacional de Seguridad (ENS). La personalidad de la marca es **autoritaria, precisa y transparente**. Se busca proyectar una imagen de rigor normativo y confianza técnica, eliminando cualquier distracción visual innecesaria para centrar la atención del usuario en el cumplimiento y la gestión de riesgos.

El estilo visual se define como **Corporate Modern**. Se aleja de tendencias efímeras para abrazar una estética funcional basada en la claridad de la información. La interfaz debe evocar una respuesta emocional de seguridad y control, utilizando una estructura de rejilla rigurosa y una jerarquía visual clara que facilite la navegación por procesos complejos de auditoría y certificación.

## Colors

La paleta cromática se articula en torno a azules corporativos profundos y grises profesionales, optimizados para reducir la fatiga visual en jornadas de trabajo prolongadas.

- **Primario (#003366):** Azul marino profundo utilizado para elementos de navegación principal y acciones de alta jerarquía. Transmite estabilidad y seriedad institucional.
- **Secundario (#4A90E2):** Un azul más vibrante para acciones interactivas y estados activos.
- **Neutros:** Una escala de grises azulados que definen la estructura del software, desde fondos de página (#F5F7F9) hasta bordes de baja intensidad.
- **Sistema Semántico:** Crucial para la visualización del estado de cumplimiento (Compliance). El verde representa conformidad, el ámbar indica riesgos detectados o tareas pendientes, y el rojo señala no conformidades críticas o brechas de seguridad.

## Typography

Se ha seleccionado **IBM Plex Sans** como la tipografía principal debido a su naturaleza técnica y su excelente legibilidad en interfaces de datos densos. Es una fuente que equilibra lo humano con lo racional, ideal para documentación normativa.

Para secciones técnicas o identificadores de activos del ENS, se permite el uso de **JetBrains Mono** en tamaños reducidos. La jerarquía se establece mediante variaciones de peso (Semibold para títulos, Regular para lectura) y el uso de mayúsculas sostenidas con espaciado expandido para etiquetas de sistema (Labels). Todas las interfaces deben respetar las reglas gramaticales del castellano, prestando especial atención a la longitud de las cadenas de texto, que suelen ser un 20% superiores al inglés.

## Layout & Spacing

El sistema utiliza una **rejilla fluida de 12 columnas** con un ancho máximo contenido para evitar líneas de lectura excesivamente largas en monitores ultra-panorámicos.

- **Riesgo y Ritmo:** Se utiliza un sistema base de 4px. Los márgenes internos de los contenedores de datos deben ser de 24px (lg) para permitir que la información "respire".
- **Comportamiento Adaptativo:**
  - **Desktop (>1024px):** Menú lateral persistente (280px) con navegación jerárquica.
  - **Tablet (768px - 1023px):** El menú lateral se colapsa en iconos, priorizando el área de tablas y formularios.
  - **Mobile (<767px):** Layout de una sola columna. Las tablas complejas deben transformarse en vistas de tarjetas (cards) para asegurar la operatividad en auditorías de campo.

## Elevation & Depth

La profundidad se comunica principalmente a través de **capas tonales y bordes de bajo contraste**, evitando sombras dramáticas que resten profesionalidad al conjunto.

1.  **Plano de Fondo:** Gris muy claro (#F5F7F9) para el lienzo principal.
2.  **Superficies de Contenedores:** Blanco puro (#FFFFFF) con un borde sutil de 1px en gris suave. Esto delimita las áreas de trabajo sin crear peso visual.
3.  **Elevación Interactiva:** Se permite una sombra ambiental muy difusa (Blur 4px, Opacidad 5%) solo para elementos flotantes como menús desplegables (dropdowns) o modales de confirmación de procesos.
4.  **Enfoque (Focus):** Los elementos seleccionados o en estado de edición utilizarán un halo de color secundario (Blue 500) con una opacidad del 20% para guiar la atención.

## Shapes

El lenguaje de formas es contenido y profesional. Se aplica un redondeo moderado para suavizar la interfaz tecnológica sin perder la estructura arquitectónica.

Los botones, campos de entrada de datos y tarjetas de información utilizan un radio base de **0.5rem (8px)**. Los elementos de estado, como los "chips" de cumplimiento, pueden utilizar radios superiores (Pill-shaped) para diferenciarse visualmente de las acciones principales. Los componentes de gran tamaño, como modales o paneles laterales, emplean **1rem (16px)** para marcar su jerarquía sobre el contenido subyacente.

## Components

- **Botones (Botones):** Tres variantes claras. *Primario* (Fondo azul sólido), *Secundario* (Borde azul, fondo transparente) y *Terciario* (Solo texto). Las acciones críticas como "Eliminar Registro" deben usar el color semántico Danger.
- **Campos de Entrada (Inputs):** Bordes definidos, etiquetas (labels) siempre visibles en la parte superior. Los estados de error deben incluir un icono de advertencia y texto explicativo en castellano debajo del campo.
- **Tarjetas de Cumplimiento (Compliance Cards):** Contenedores que resumen el estado de un control ISO/ENS. Deben incluir un indicador visual del estado semántico (barra lateral de color o icono circular).
- **Tablas de Datos (Data Tables):** El componente más crítico. Deben soportar ordenación, filtrado avanzado y paginación clara. Las filas deben tener un estado de "hover" sutil para facilitar la lectura de registros extensos.
- **Chips de Estado (Badges):** Utilizados para indicar niveles de riesgo (Bajo, Medio, Alto) o fases de auditoría (Pendiente, En curso, Finalizado).
- **Migas de Pan (Breadcrumbs):** Esenciales para la navegación en estructuras jerárquicas de normativas.
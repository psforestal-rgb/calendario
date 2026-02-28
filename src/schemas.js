/**
 * schemas.js — Esquemas y constantes para el sistema de plazos LGAP
 * y futuro módulo de casos/expedientes del Calendario SINAC.
 *
 * Este archivo NO depende de React, Firebase ni DOM.
 * Solo exporta datos estáticos y constantes reutilizables.
 */

// ============================================================
// PRESETS DE PLAZOS LGAP
// (Ley General de la Administración Pública, Costa Rica)
// ============================================================
//
// Cada preset describe un tipo de plazo legal con:
//   - Cómo se cuenta (días hábiles, naturales, horas)
//   - La duración del plazo
//   - La regla de inicio (siempre "next_day" según Art. 261 LGAP)
//   - El buffer interno (fecha objetivo) para alertas tempranas
//   - criticalDays: si el plazo es ≥1 mes, cuántos días antes del
//     vencimiento se considera zona crítica (rojo directo)

export const DEADLINE_PRESETS = [
  {
    presetId: '24h',
    label: '24 horas',
    dayCountType: 'horas',
    durationValue: 24,
    durationUnit: 'hours',
    startRule: 'next_day',
    buffer: { value: 2, unit: 'hours' },
    criticalDays: null,
    description: '24 horas naturales desde las 00:00 del día siguiente a la notificación'
  },
  {
    presetId: '3d',
    label: '3 días hábiles',
    dayCountType: 'habiles',
    durationValue: 3,
    durationUnit: 'days',
    startRule: 'next_day',
    buffer: { value: 2, unit: 'days' },
    criticalDays: null,
    description: '3 días hábiles contados desde el día siguiente a la notificación'
  },
  {
    presetId: '5d',
    label: '5 días hábiles',
    dayCountType: 'habiles',
    durationValue: 5,
    durationUnit: 'days',
    startRule: 'next_day',
    buffer: { value: 5, unit: 'days' },
    criticalDays: null,
    description: '5 días hábiles (1 semana laboral) desde el día siguiente a la notificación'
  },
  {
    presetId: '10d',
    label: '10 días hábiles',
    dayCountType: 'habiles',
    durationValue: 10,
    durationUnit: 'days',
    startRule: 'next_day',
    buffer: { value: 7, unit: 'days' },
    criticalDays: null,
    description: '10 días hábiles (2 semanas laborales) desde el día siguiente a la notificación'
  },
  {
    presetId: '15d',
    label: '15 días hábiles',
    dayCountType: 'habiles',
    durationValue: 15,
    durationUnit: 'days',
    startRule: 'next_day',
    buffer: { value: 7, unit: 'days' },
    criticalDays: null,
    description: '15 días hábiles (3 semanas laborales) desde el día siguiente a la notificación'
  },
  {
    presetId: '1m',
    label: '1 mes',
    dayCountType: 'naturales',
    durationValue: 1,
    durationUnit: 'months',
    startRule: 'next_day',
    buffer: { value: 15, unit: 'days' },
    criticalDays: 3,
    description: '1 mes calendario desde el día siguiente a la notificación'
  },
  {
    presetId: '2m',
    label: '2 meses',
    dayCountType: 'naturales',
    durationValue: 2,
    durationUnit: 'months',
    startRule: 'next_day',
    buffer: { value: 15, unit: 'days' },
    criticalDays: 3,
    description: '2 meses calendario desde el día siguiente a la notificación'
  }
];

// Lookup rápido por presetId
export const DEADLINE_PRESET_MAP = Object.fromEntries(
  DEADLINE_PRESETS.map(p => [p.presetId, p])
);

// ============================================================
// TIPOS DE CASO / EXPEDIENTE
// ============================================================

export const CASE_TYPES = [
  'Permiso Pequeño',
  'Inventario Forestal',
  'Certificado de Origen',
  'Plan de Manejo',
  'Determinación de Bosque',
  'Determinación de Humedal',
  'Clasificación de Predio',
  'Visado',
  'Certificación de plano',
  'Régimen Forestal',
  'Denuncia Ambiental',
  'Análisis de Proyecto',
  'Otro'
];

// ============================================================
// ESTADOS DE CASO
// ============================================================

export const CASE_STATUSES = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'en_campo', label: 'En campo' },
  { value: 'en_gabinete', label: 'En gabinete' },
  { value: 'en_espera', label: 'En espera' },
  { value: 'en_revision_jefatura', label: 'En revisión jefatura' },
  { value: 'cerrado', label: 'Cerrado' }
];

// ============================================================
// TIPOS DE PASO (vinculación task ↔ case)
// ============================================================

export const STEP_TYPES = [
  { value: 'inspeccion', label: 'Inspección' },
  { value: 'informe', label: 'Informe' },
  { value: 'resolucion', label: 'Resolución' },
  { value: 'revision', label: 'Revisión' },
  { value: 'comunicacion', label: 'Comunicación' },
  { value: 'viaticos', label: 'Viáticos' },
  { value: 'otro', label: 'Otro' }
];

// ============================================================
// SISTEMAS DE REFERENCIA EXTERNA
// ============================================================

export const EXTERNAL_REF_SYSTEMS = [
  { value: 'SICAF', label: 'SICAF' },
  { value: 'OTRO', label: 'Otro' }
];

export const REF_CONFIDENCE_LEVELS = [
  { value: 'confirmada', label: 'Confirmada' },
  { value: 'estimada', label: 'Estimada' },
  { value: 'desconocida', label: 'Desconocida' }
];

// ============================================================
// NIVELES DE RIESGO (semáforo)
// ============================================================

export const RISK_LEVELS = {
  verde: { label: 'En tiempo', color: '#22c55e' },
  amarillo: { label: 'Próximo a vencer', color: '#eab308' },
  rojo: { label: 'Vencido / Crítico', color: '#ef4444' },
  sin_fecha: { label: 'Sin fecha', color: '#9ca3af' }
};

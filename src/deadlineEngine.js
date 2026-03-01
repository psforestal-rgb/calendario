/**
 * deadlineEngine.js — Motor de cómputo de plazos según LGAP
 * (Ley General de la Administración Pública, Costa Rica)
 *
 * Principios implementados:
 *
 *   Art. 261 LGAP: Los plazos por días comienzan a correr a partir
 *   del día siguiente a la notificación o publicación del acto.
 *
 *   Días hábiles: se excluyen sábados, domingos y feriados nacionales.
 *   Días naturales: se cuentan todos los días del calendario.
 *   Horas: se suman en tiempo natural (corrido) desde las 00:00
 *          del día siguiente a la notificación.
 *   Meses: se computan como meses de calendario. Si el día resultante
 *          no existe en el mes destino (ej. 31 de febrero), se usa el
 *          último día del mes. No se ajusta si cae en día inhábil;
 *          el usuario puede usar un override manual.
 *
 * Este módulo es PURO: no depende de React, Firebase ni DOM.
 * Todas las funciones son deterministas cuando se provee `now`.
 */

import { DEADLINE_PRESET_MAP } from './schemas.js';

// ============================================================
// UTILIDADES DE FECHA
// ============================================================

/**
 * Normaliza una fecha a medianoche (00:00:00.000) en hora local.
 */
export function toMidnight(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Convierte una fecha a string YYYY-MM-DD en hora local.
 */
export function toISODate(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Formatea fecha y hora como "YYYY-MM-DD HH:MM" en hora local.
 */
function formatDateTime(date) {
  const d = new Date(date);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${toISODate(d)} ${h}:${min}`;
}

/**
 * Determina si una fecha es día inhábil (fin de semana o feriado).
 *
 * @param {Date} date
 * @param {string[]} holidays — Array de fechas YYYY-MM-DD
 * @param {number[]} weekendDays — Días de fin de semana [0=dom, 6=sáb]
 * @returns {boolean}
 */
export function isNonBusinessDay(date, holidays = [], weekendDays = [0, 6]) {
  const dow = date.getDay();
  if (weekendDays.includes(dow)) return true;
  return holidays.includes(toISODate(date));
}

// ============================================================
// CÓMPUTO DE FECHA DE INICIO
// ============================================================

/**
 * Calcula la fecha de inicio del cómputo del plazo.
 *
 * Para startRule = "next_day" (Art. 261 LGAP):
 *   - Se toma las 00:00 del día calendario siguiente a baseDate.
 *   - Si el plazo es en días hábiles y ese día resulta inhábil,
 *     se avanza al primer día hábil siguiente.
 *   - Para días naturales u horas, no se ajusta (el plazo corre
 *     incluso en días inhábiles).
 *
 * @param {Date} baseDate — Fecha de notificación / recepción
 * @param {string} startRule — "next_day"
 * @param {string} dayCountType — "habiles" | "naturales" | "horas"
 * @param {string[]} holidays
 * @param {number[]} weekendDays
 * @returns {Date|null}
 */
export function computeStartDate(baseDate, startRule, dayCountType, holidays, weekendDays) {
  if (!baseDate) return null;

  if (startRule === 'next_day') {
    // 00:00 del día siguiente a baseDate
    const nextDay = toMidnight(baseDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Para plazos en días hábiles: si el día siguiente es inhábil,
    // avanzar al primer día hábil
    if (dayCountType === 'habiles') {
      const current = new Date(nextDay);
      while (isNonBusinessDay(current, holidays, weekendDays)) {
        current.setDate(current.getDate() + 1);
      }
      return current;
    }

    return nextDay;
  }

  // Fallback: medianoche de baseDate
  return toMidnight(baseDate);
}

// ============================================================
// CÓMPUTO DE FECHA MÁXIMA DE VENCIMIENTO
// ============================================================

/**
 * Calcula la fecha máxima de vencimiento del plazo.
 *
 * Horas:
 *   Se suman durationValue horas desde computedStartDate (00:00).
 *   Ejemplo: 24h desde martes 00:00 = miércoles 00:00.
 *
 * Meses:
 *   Se suman meses calendario. Si el día no existe en el mes
 *   destino, se usa el último día del mes.
 *   Ejemplo: 31 ene + 1 mes = 28 feb (o 29 en bisiesto).
 *   No se ajusta si cae en inhábil.
 *
 * Días hábiles:
 *   computedStartDate es el día 1 del plazo (ya es hábil).
 *   Se cuentan durationValue días hábiles (inclusive).
 *   Ejemplo: 3d hábiles desde martes = jueves (mar=1, mié=2, jue=3).
 *
 * Días naturales:
 *   computedStartDate es el día 1. Se suman (durationValue - 1)
 *   días calendario.
 *   Ejemplo: 5d naturales desde martes = sábado.
 *
 * @param {Date} startDate
 * @param {string} dayCountType — "habiles" | "naturales" | "horas"
 * @param {number} durationValue
 * @param {string} durationUnit — "hours" | "days" | "months"
 * @param {string[]} holidays
 * @param {number[]} weekendDays
 * @returns {Date|null}
 */
export function computeMaxDueDate(startDate, dayCountType, durationValue, durationUnit, holidays, weekendDays) {
  if (!startDate || !durationValue) return null;

  const start = new Date(startDate);

  // --- Horas ---
  if (dayCountType === 'horas' || durationUnit === 'hours') {
    return new Date(start.getTime() + durationValue * 60 * 60 * 1000);
  }

  // --- Meses ---
  if (durationUnit === 'months') {
    const result = new Date(start);
    const originalDay = result.getDate();
    result.setMonth(result.getMonth() + durationValue);
    // Si el día cambió (ej. 31 → 3 por overflow), ir al último día del mes correcto
    if (result.getDate() !== originalDay) {
      result.setDate(0); // último día del mes anterior al actual (que es el mes destino)
    }
    return result;
  }

  // --- Días hábiles ---
  if (dayCountType === 'habiles') {
    // startDate ya es hábil y cuenta como día 1
    const current = new Date(start);
    let remaining = durationValue - 1;

    while (remaining > 0) {
      current.setDate(current.getDate() + 1);
      if (!isNonBusinessDay(current, holidays, weekendDays)) {
        remaining--;
      }
    }
    return current;
  }

  // --- Días naturales ---
  if (dayCountType === 'naturales') {
    const result = new Date(start);
    result.setDate(result.getDate() + durationValue - 1);
    return result;
  }

  return null;
}

// ============================================================
// CÓMPUTO DE FECHA OBJETIVO (buffer interno)
// ============================================================

/**
 * Calcula la fecha objetivo interna restando un buffer desde maxDueDate.
 *
 * El buffer se sustrae en tiempo natural (calendario):
 *   - unit "hours": resta horas directamente.
 *   - unit "days": resta días calendario.
 *
 * Si la fecha objetivo calculada resulta anterior a startDate,
 * se retorna startDate (el target no puede ser antes del inicio).
 * Esto puede ocurrir con plazos cortos y buffers agresivos; en ese
 * caso el riesgo arranca en "amarillo" desde el día 1.
 *
 * @param {Date} maxDueDate
 * @param {{ value: number, unit: 'hours'|'days' }} bufferRule
 * @param {Date} [startDate] — Para clamping (opcional)
 * @returns {Date|null}
 */
export function computeTargetDueDate(maxDueDate, bufferRule, startDate) {
  if (!maxDueDate || !bufferRule) return null;

  const max = new Date(maxDueDate);
  let target;

  if (bufferRule.unit === 'hours') {
    target = new Date(max.getTime() - bufferRule.value * 60 * 60 * 1000);
  } else if (bufferRule.unit === 'days') {
    target = new Date(max);
    target.setDate(target.getDate() - bufferRule.value);
  } else {
    return new Date(max);
  }

  // Clamp: el target no puede ser anterior al inicio del plazo
  if (startDate && target < startDate) {
    return new Date(startDate);
  }

  return target;
}

// ============================================================
// CÓMPUTO DE RIESGO (SEMÁFORO)
// ============================================================

/**
 * Calcula el nivel de riesgo basado en la fecha actual.
 *
 * Reglas (evaluadas en orden de prioridad):
 *   1. Sin baseDate o sin effectiveMaxDueDate → "sin_fecha"
 *   2. now >= effectiveMaxDueDate → "rojo" (vencido)
 *   3. Zona crítica: si criticalDays > 0 y faltan ≤ criticalDays
 *      días naturales para effectiveMaxDueDate → "rojo"
 *   4. now >= effectiveTargetDueDate → "amarillo" (próximo a vencer)
 *   5. now < effectiveTargetDueDate → "verde" (en tiempo)
 *
 * @param {Object} params
 * @param {Date} params.now
 * @param {Date|null} params.baseDate
 * @param {Date|null} params.effectiveMaxDueDate
 * @param {Date|null} params.effectiveTargetDueDate
 * @param {number|null} params.criticalDays
 * @returns {"verde"|"amarillo"|"rojo"|"sin_fecha"}
 */
export function computeRisk({ now, baseDate, effectiveMaxDueDate, effectiveTargetDueDate, criticalDays }) {
  if (!baseDate || !effectiveMaxDueDate) return 'sin_fecha';

  const nowMs = now.getTime();
  const maxMs = effectiveMaxDueDate.getTime();

  // Vencido
  if (nowMs >= maxMs) return 'rojo';

  // Zona crítica (plazos de 1+ mes): ≤ N días al vencimiento
  if (criticalDays != null && criticalDays > 0) {
    const criticalMs = criticalDays * 24 * 60 * 60 * 1000;
    if ((maxMs - nowMs) <= criticalMs) return 'rojo';
  }

  // Próximo a vencer
  if (effectiveTargetDueDate && nowMs >= effectiveTargetDueDate.getTime()) {
    return 'amarillo';
  }

  return 'verde';
}

// ============================================================
// FUNCIÓN PRINCIPAL: computeDeadline
// ============================================================

/**
 * Calcula todos los componentes de un plazo LGAP.
 *
 * Acepta un preset (presetId) o parámetros individuales.
 * Si se provee presetId, los valores del preset se usan como base
 * y pueden ser sobreescritos por parámetros explícitos.
 *
 * @param {Object} input
 * @param {Date|string|number|null} input.baseDate
 *   Fecha de notificación/recepción/publicación.
 *
 * @param {string} [input.presetId]
 *   ID de preset LGAP (ej. "3d", "1m"). Si se provee, carga
 *   dayCountType, durationValue, durationUnit, buffer y criticalDays
 *   del preset correspondiente.
 *
 * @param {string} [input.startRule="next_day"]
 *   Regla de inicio del cómputo.
 *
 * @param {string} [input.dayCountType]
 *   "habiles" | "naturales" | "horas". Override del preset.
 *
 * @param {number} [input.durationValue]
 *   Cantidad numérica del plazo. Override del preset.
 *
 * @param {string} [input.durationUnit]
 *   "hours" | "days" | "months". Override del preset.
 *
 * @param {string[]} [input.holidays=[]]
 *   Array de feriados como strings YYYY-MM-DD.
 *
 * @param {number[]} [input.weekendDays=[0,6]]
 *   Días de fin de semana (0=domingo, 6=sábado).
 *
 * @param {Date|string|number} [input.now=new Date()]
 *   Fecha "actual" para el cálculo de riesgo.
 *   Pasar explícitamente para pruebas deterministas.
 *
 * @param {Date|string|number|null} [input.maxDueDateManual]
 *   Override manual de la fecha de vencimiento.
 *   Si existe, se usa como effectiveMaxDueDate en lugar de la calculada.
 *
 * @param {Date|string|number|null} [input.targetDueDateManual]
 *   Override manual de la fecha objetivo.
 *   Si existe, se usa como effectiveTargetDueDate en lugar de la calculada.
 *
 * @param {{ value: number, unit: 'hours'|'days' }} [input.bufferRule]
 *   Override del buffer del preset. Si no se provee, se usa el buffer
 *   definido en el preset.
 *
 * @returns {{
 *   computedStartDate: Date|null,
 *   computedMaxDueDate: Date|null,
 *   computedTargetDueDate: Date|null,
 *   effectiveMaxDueDate: Date|null,
 *   effectiveTargetDueDate: Date|null,
 *   risk: "verde"|"amarillo"|"rojo"|"sin_fecha",
 *   explain: string
 * }}
 */
export function computeDeadline(input) {
  const {
    baseDate: rawBaseDate = null,
    presetId = null,
    holidays = [],
    weekendDays = [0, 6],
    now: rawNow = new Date(),
    maxDueDateManual: rawMaxManual = null,
    targetDueDateManual: rawTargetManual = null,
  } = input;

  // Resolver preset
  const preset = presetId ? DEADLINE_PRESET_MAP[presetId] : null;

  // Resolver parámetros (input explícito > preset > defaults)
  const startRule = input.startRule || preset?.startRule || 'next_day';
  const dayCountType = input.dayCountType || preset?.dayCountType || null;
  const durationValue = input.durationValue ?? preset?.durationValue ?? null;
  const durationUnit = input.durationUnit || preset?.durationUnit || null;
  const bufferRule = input.bufferRule || preset?.buffer || null;
  const criticalDays = preset?.criticalDays ?? null;

  // Normalizar fechas
  const baseDate = rawBaseDate ? new Date(rawBaseDate) : null;
  const now = new Date(rawNow);
  const maxDueDateManual = rawMaxManual ? new Date(rawMaxManual) : null;
  const targetDueDateManual = rawTargetManual ? new Date(rawTargetManual) : null;

  // --- Sin fecha base ---
  if (!baseDate) {
    const risk = !maxDueDateManual
      ? 'sin_fecha'
      : computeRisk({
          now,
          baseDate: new Date(0), // placeholder para que no sea null
          effectiveMaxDueDate: maxDueDateManual,
          effectiveTargetDueDate: targetDueDateManual,
          criticalDays
        });

    return {
      computedStartDate: null,
      computedMaxDueDate: null,
      computedTargetDueDate: null,
      effectiveMaxDueDate: maxDueDateManual,
      effectiveTargetDueDate: targetDueDateManual,
      risk,
      explain: 'Sin fecha base de recepción/notificación.'
    };
  }

  // 1. Fecha de inicio del cómputo
  const computedStartDate = computeStartDate(
    baseDate, startRule, dayCountType, holidays, weekendDays
  );

  // 2. Fecha máxima de vencimiento
  const computedMaxDueDate = (dayCountType && durationValue)
    ? computeMaxDueDate(computedStartDate, dayCountType, durationValue, durationUnit, holidays, weekendDays)
    : null;

  // 3. Fecha objetivo interna (buffer)
  const computedTargetDueDate = (computedMaxDueDate && bufferRule)
    ? computeTargetDueDate(computedMaxDueDate, bufferRule, computedStartDate)
    : null;

  // 4. Fechas efectivas (manual > computed)
  const effectiveMaxDueDate = maxDueDateManual || computedMaxDueDate;
  const effectiveTargetDueDate = targetDueDateManual || computedTargetDueDate;

  // 5. Riesgo
  const risk = computeRisk({
    now, baseDate, effectiveMaxDueDate, effectiveTargetDueDate, criticalDays
  });

  // 6. Explicación legible
  const explain = buildExplanation({
    preset, baseDate, computedStartDate, computedMaxDueDate,
    effectiveMaxDueDate, effectiveTargetDueDate,
    maxDueDateManual, targetDueDateManual,
    dayCountType, durationValue, durationUnit, risk
  });

  return {
    computedStartDate,
    computedMaxDueDate,
    computedTargetDueDate,
    effectiveMaxDueDate,
    effectiveTargetDueDate,
    risk,
    explain
  };
}

// ============================================================
// EXPLICACIÓN LEGIBLE
// ============================================================

/**
 * Genera una cadena breve explicando el cómputo realizado.
 * Útil para tooltips, logs y debugging.
 */
function buildExplanation(params) {
  const {
    preset, baseDate, computedStartDate, computedMaxDueDate,
    effectiveMaxDueDate, effectiveTargetDueDate,
    maxDueDateManual, targetDueDateManual,
    dayCountType, durationValue, durationUnit, risk
  } = params;

  const parts = [];

  if (preset) {
    parts.push(`Preset: ${preset.label}.`);
  }

  if (baseDate) {
    parts.push(`Notificación: ${toISODate(baseDate)}.`);
  }

  if (computedStartDate) {
    parts.push(`Inicio cómputo: ${toISODate(computedStartDate)}.`);
  }

  if (durationValue && dayCountType) {
    const tipoMap = { habiles: 'hábiles', naturales: 'naturales', horas: '' };
    const unidadMap = {
      months: durationValue === 1 ? 'mes' : 'meses',
      hours: 'horas',
      days: 'días'
    };
    const tipo = tipoMap[dayCountType] || '';
    const unidad = unidadMap[durationUnit] || 'días';
    const plazoStr = `${durationValue} ${unidad}${tipo ? ' ' + tipo : ''}`;
    parts.push(`Plazo: ${plazoStr}.`);
  }

  if (computedMaxDueDate) {
    const fmt = durationUnit === 'hours' ? formatDateTime(computedMaxDueDate) : toISODate(computedMaxDueDate);
    parts.push(`Vencimiento calculado: ${fmt}.`);
  }

  if (maxDueDateManual) {
    parts.push(`Vencimiento manual: ${toISODate(maxDueDateManual)}.`);
  }

  if (effectiveTargetDueDate) {
    const suffix = targetDueDateManual ? ' (manual)' : '';
    const fmt = durationUnit === 'hours' ? formatDateTime(effectiveTargetDueDate) : toISODate(effectiveTargetDueDate);
    parts.push(`Objetivo interno: ${fmt}${suffix}.`);
  }

  const riskLabels = {
    verde: 'En tiempo',
    amarillo: 'Próximo a vencer',
    rojo: 'Vencido/Crítico',
    sin_fecha: 'Sin fecha'
  };
  parts.push(`Riesgo: ${riskLabels[risk] || risk}.`);

  return parts.join(' ');
}

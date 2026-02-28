/**
 * Tests para deadlineEngine.js
 *
 * Ejecutar: npx vitest run src/deadlineEngine.test.js
 * O en modo watch: npx vitest src/deadlineEngine.test.js
 *
 * Todos los tests usan fechas deterministas (now explícito)
 * para evitar dependencias de la hora del sistema.
 */

import { describe, it, expect } from 'vitest';
import {
  toMidnight,
  toISODate,
  isNonBusinessDay,
  computeStartDate,
  computeMaxDueDate,
  computeTargetDueDate,
  computeRisk,
  computeDeadline
} from './deadlineEngine.js';
import { DEADLINE_PRESETS, DEADLINE_PRESET_MAP } from './schemas.js';

// Feriados de Costa Rica 2026 (subset para tests)
const HOLIDAYS_2026 = [
  '2026-01-01', // Año Nuevo (jueves)
  '2026-04-09', // Jueves Santo
  '2026-04-10', // Viernes Santo
  '2026-04-11', // Sábado (Batalla de Rivas - pero es sábado)
  '2026-05-01', // Día del Trabajador (viernes)
  '2026-07-25', // Anexión de Nicoya (sábado)
  '2026-08-02', // Virgen de los Ángeles (domingo)
  '2026-08-15', // Día de la Madre (sábado)
  '2026-09-15', // Independencia (martes)
  '2026-12-01', // Abolición del Ejército (martes)
  '2026-12-25', // Navidad (viernes)
];

// ============================================================
// UTILIDADES
// ============================================================

describe('toMidnight', () => {
  it('normaliza una fecha a medianoche', () => {
    const d = toMidnight(new Date(2026, 0, 15, 14, 30, 45));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
    expect(d.getDate()).toBe(15);
  });
});

describe('toISODate', () => {
  it('formatea como YYYY-MM-DD', () => {
    expect(toISODate(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toISODate(new Date(2026, 11, 25))).toBe('2026-12-25');
  });
});

describe('isNonBusinessDay', () => {
  it('detecta sábados y domingos', () => {
    // 2026-01-03 es sábado, 2026-01-04 es domingo
    expect(isNonBusinessDay(new Date(2026, 0, 3))).toBe(true);
    expect(isNonBusinessDay(new Date(2026, 0, 4))).toBe(true);
  });

  it('detecta días hábiles', () => {
    // 2026-01-05 es lunes
    expect(isNonBusinessDay(new Date(2026, 0, 5))).toBe(false);
  });

  it('detecta feriados', () => {
    // 2026-01-01 es jueves (Año Nuevo)
    expect(isNonBusinessDay(new Date(2026, 0, 1), HOLIDAYS_2026)).toBe(true);
  });

  it('un día hábil normal no es feriado', () => {
    expect(isNonBusinessDay(new Date(2026, 0, 2), HOLIDAYS_2026)).toBe(false);
  });
});

// ============================================================
// FECHA DE INICIO
// ============================================================

describe('computeStartDate', () => {
  it('next_day: día hábil normal avanza al día siguiente', () => {
    // Lunes 2026-01-05 → Martes 2026-01-06
    const result = computeStartDate(
      new Date(2026, 0, 5), 'next_day', 'habiles', HOLIDAYS_2026, [0, 6]
    );
    expect(toISODate(result)).toBe('2026-01-06');
    expect(result.getHours()).toBe(0);
  });

  it('next_day + hábiles: si el día siguiente es sábado, avanza al lunes', () => {
    // Viernes 2026-01-09 → next_day = sáb 10 → avanza a lun 12
    const result = computeStartDate(
      new Date(2026, 0, 9), 'next_day', 'habiles', HOLIDAYS_2026, [0, 6]
    );
    expect(toISODate(result)).toBe('2026-01-12');
  });

  it('next_day + hábiles: si el día siguiente es feriado + fin de semana, salta todo', () => {
    // Miércoles 2026-12-31 → next_day = jue 2027-01-01 (año nuevo)
    // Pero HOLIDAYS_2026 solo tiene '2026-01-01'; para 2027 no habría feriado en nuestro array
    // Vamos a usar un caso real: 2026-04-08 (miércoles) → next_day = jue 09 (Jueves Santo) → vie 10 (Viernes Santo) → sáb 11 → dom 12 → lun 13
    const result = computeStartDate(
      new Date(2026, 3, 8), 'next_day', 'habiles', HOLIDAYS_2026, [0, 6]
    );
    expect(toISODate(result)).toBe('2026-04-13');
  });

  it('next_day + naturales: no ajusta por día inhábil', () => {
    // Viernes 2026-01-09 → Sábado 2026-01-10 (no se ajusta)
    const result = computeStartDate(
      new Date(2026, 0, 9), 'next_day', 'naturales', HOLIDAYS_2026, [0, 6]
    );
    expect(toISODate(result)).toBe('2026-01-10');
  });

  it('next_day + horas: no ajusta por día inhábil', () => {
    const result = computeStartDate(
      new Date(2026, 0, 9), 'next_day', 'horas', HOLIDAYS_2026, [0, 6]
    );
    expect(toISODate(result)).toBe('2026-01-10');
    expect(result.getHours()).toBe(0);
  });

  it('retorna null si no hay baseDate', () => {
    expect(computeStartDate(null, 'next_day', 'habiles', [], [0, 6])).toBeNull();
  });
});

// ============================================================
// FECHA MÁXIMA DE VENCIMIENTO
// ============================================================

describe('computeMaxDueDate', () => {
  describe('horas', () => {
    it('suma 24 horas desde medianoche', () => {
      const start = new Date(2026, 0, 6, 0, 0, 0); // Martes 00:00
      const result = computeMaxDueDate(start, 'horas', 24, 'hours', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-01-07'); // Miércoles 00:00
      expect(result.getHours()).toBe(0);
    });

    it('suma 48 horas', () => {
      const start = new Date(2026, 0, 6, 0, 0, 0);
      const result = computeMaxDueDate(start, 'horas', 48, 'hours', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-01-08');
    });
  });

  describe('días hábiles', () => {
    it('3 días hábiles desde martes = jueves', () => {
      // Mar 06 (1) → Mié 07 (2) → Jue 08 (3)
      const start = new Date(2026, 0, 6, 0, 0, 0); // Martes
      const result = computeMaxDueDate(start, 'habiles', 3, 'days', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-01-08');
    });

    it('5 días hábiles desde lunes = viernes', () => {
      // Lun 05 (1) → Mar 06 (2) → Mié 07 (3) → Jue 08 (4) → Vie 09 (5)
      const start = new Date(2026, 0, 5, 0, 0, 0); // Lunes
      const result = computeMaxDueDate(start, 'habiles', 5, 'days', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-01-09');
    });

    it('5 días hábiles cruza fin de semana', () => {
      // Jue 08 (1) → Vie 09 (2) → [sáb, dom] → Lun 12 (3) → Mar 13 (4) → Mié 14 (5)
      const start = new Date(2026, 0, 8, 0, 0, 0); // Jueves
      const result = computeMaxDueDate(start, 'habiles', 5, 'days', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-01-14');
    });

    it('3 días hábiles cruza Semana Santa', () => {
      // Lun 06 Abr (1) → Mar 07 (2) → Mié 08 (3)
      // Jue 09 y Vie 10 son feriados, pero el plazo ya terminó el miércoles
      const start = new Date(2026, 3, 6, 0, 0, 0); // Lunes 6 abril
      const result = computeMaxDueDate(start, 'habiles', 3, 'days', HOLIDAYS_2026, [0, 6]);
      expect(toISODate(result)).toBe('2026-04-08');
    });

    it('5 días hábiles cruza Semana Santa', () => {
      // Lun 06 (1) → Mar 07 (2) → Mié 08 (3) → [Jue09=feriado, Vie10=feriado, Sáb11, Dom12] → Lun 13 (4) → Mar 14 (5)
      const start = new Date(2026, 3, 6, 0, 0, 0);
      const result = computeMaxDueDate(start, 'habiles', 5, 'days', HOLIDAYS_2026, [0, 6]);
      expect(toISODate(result)).toBe('2026-04-14');
    });

    it('10 días hábiles', () => {
      // Lun 05 ene (1) → ... → Vie 16 ene (10), cruzando 2 fines de semana
      const start = new Date(2026, 0, 5, 0, 0, 0);
      const result = computeMaxDueDate(start, 'habiles', 10, 'days', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-01-16');
    });
  });

  describe('días naturales', () => {
    it('5 días naturales', () => {
      // Mar 06 (1) → Mié 07 (2) → Jue 08 (3) → Vie 09 (4) → Sáb 10 (5)
      const start = new Date(2026, 0, 6, 0, 0, 0);
      const result = computeMaxDueDate(start, 'naturales', 5, 'days', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-01-10');
    });

    it('1 día natural', () => {
      const start = new Date(2026, 0, 6, 0, 0, 0);
      const result = computeMaxDueDate(start, 'naturales', 1, 'days', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-01-06'); // Mismo día (día 1)
    });
  });

  describe('meses', () => {
    it('1 mes desde el 15 de enero', () => {
      const start = new Date(2026, 0, 15, 0, 0, 0);
      const result = computeMaxDueDate(start, 'naturales', 1, 'months', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-02-15');
    });

    it('1 mes desde el 31 de enero → último día de febrero', () => {
      const start = new Date(2026, 0, 31, 0, 0, 0);
      const result = computeMaxDueDate(start, 'naturales', 1, 'months', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-02-28');
    });

    it('2 meses desde el 15 de enero', () => {
      const start = new Date(2026, 0, 15, 0, 0, 0);
      const result = computeMaxDueDate(start, 'naturales', 2, 'months', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-03-15');
    });

    it('1 mes desde el 31 de agosto → 30 de septiembre', () => {
      const start = new Date(2026, 7, 31, 0, 0, 0); // Ago 31
      const result = computeMaxDueDate(start, 'naturales', 1, 'months', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-09-30');
    });

    it('1 mes desde el 28 de febrero → 28 de marzo', () => {
      const start = new Date(2026, 1, 28, 0, 0, 0);
      const result = computeMaxDueDate(start, 'naturales', 1, 'months', [], [0, 6]);
      expect(toISODate(result)).toBe('2026-03-28');
    });
  });

  it('retorna null sin startDate', () => {
    expect(computeMaxDueDate(null, 'habiles', 3, 'days', [], [0, 6])).toBeNull();
  });

  it('retorna null sin durationValue', () => {
    expect(computeMaxDueDate(new Date(), 'habiles', 0, 'days', [], [0, 6])).toBeNull();
  });
});

// ============================================================
// FECHA OBJETIVO (BUFFER)
// ============================================================

describe('computeTargetDueDate', () => {
  it('resta horas del buffer', () => {
    const max = new Date(2026, 0, 7, 0, 0, 0); // Mié 00:00
    const result = computeTargetDueDate(max, { value: 2, unit: 'hours' });
    expect(result.getTime()).toBe(new Date(2026, 0, 6, 22, 0, 0).getTime());
  });

  it('resta días del buffer', () => {
    const max = new Date(2026, 0, 8, 0, 0, 0); // Jue
    const result = computeTargetDueDate(max, { value: 2, unit: 'days' });
    expect(toISODate(result)).toBe('2026-01-06'); // Mar
  });

  it('clamp: no retrocede antes de startDate', () => {
    const max = new Date(2026, 0, 8, 0, 0, 0); // Jue
    const start = new Date(2026, 0, 7, 0, 0, 0); // Mié
    const result = computeTargetDueDate(max, { value: 5, unit: 'days' }, start);
    // 5 días antes de Jue 8 = Sáb 3 → pero start es Mié 7 → clamp a Mié 7
    expect(toISODate(result)).toBe('2026-01-07');
  });

  it('retorna null sin maxDueDate', () => {
    expect(computeTargetDueDate(null, { value: 2, unit: 'days' })).toBeNull();
  });

  it('retorna null sin bufferRule', () => {
    expect(computeTargetDueDate(new Date(), null)).toBeNull();
  });
});

// ============================================================
// RIESGO (SEMÁFORO)
// ============================================================

describe('computeRisk', () => {
  const maxDate = new Date(2026, 0, 15, 0, 0, 0); // Jue 15 ene
  const targetDate = new Date(2026, 0, 10, 0, 0, 0); // Sáb 10 ene
  const baseDate = new Date(2026, 0, 5);

  it('verde: ahora antes del target', () => {
    const now = new Date(2026, 0, 8); // Jue 8 → antes del target (10)
    expect(computeRisk({ now, baseDate, effectiveMaxDueDate: maxDate, effectiveTargetDueDate: targetDate, criticalDays: null })).toBe('verde');
  });

  it('amarillo: entre target y max', () => {
    const now = new Date(2026, 0, 12); // Lun 12 → entre target (10) y max (15)
    expect(computeRisk({ now, baseDate, effectiveMaxDueDate: maxDate, effectiveTargetDueDate: targetDate, criticalDays: null })).toBe('amarillo');
  });

  it('rojo: después del vencimiento', () => {
    const now = new Date(2026, 0, 15); // exactamente en maxDate
    expect(computeRisk({ now, baseDate, effectiveMaxDueDate: maxDate, effectiveTargetDueDate: targetDate, criticalDays: null })).toBe('rojo');
  });

  it('rojo: bien pasado el vencimiento', () => {
    const now = new Date(2026, 0, 20);
    expect(computeRisk({ now, baseDate, effectiveMaxDueDate: maxDate, effectiveTargetDueDate: targetDate, criticalDays: null })).toBe('rojo');
  });

  it('sin_fecha: sin baseDate', () => {
    const now = new Date(2026, 0, 8);
    expect(computeRisk({ now, baseDate: null, effectiveMaxDueDate: maxDate, effectiveTargetDueDate: targetDate, criticalDays: null })).toBe('sin_fecha');
  });

  it('sin_fecha: sin maxDueDate', () => {
    const now = new Date(2026, 0, 8);
    expect(computeRisk({ now, baseDate, effectiveMaxDueDate: null, effectiveTargetDueDate: targetDate, criticalDays: null })).toBe('sin_fecha');
  });

  it('zona crítica: ≤3 días al vencimiento con criticalDays=3 → rojo', () => {
    // max = 15 ene, now = 13 ene → faltan 2 días → rojo
    const now = new Date(2026, 0, 13);
    expect(computeRisk({ now, baseDate, effectiveMaxDueDate: maxDate, effectiveTargetDueDate: targetDate, criticalDays: 3 })).toBe('rojo');
  });

  it('zona crítica: >3 días al vencimiento → amarillo (si pasó target)', () => {
    // max = 15 ene, now = 11 ene → faltan 4 días → no crítico, pero pasó target (10) → amarillo
    const now = new Date(2026, 0, 11);
    expect(computeRisk({ now, baseDate, effectiveMaxDueDate: maxDate, effectiveTargetDueDate: targetDate, criticalDays: 3 })).toBe('amarillo');
  });

  it('verde: sin effectiveTargetDueDate y antes de max', () => {
    const now = new Date(2026, 0, 8);
    expect(computeRisk({ now, baseDate, effectiveMaxDueDate: maxDate, effectiveTargetDueDate: null, criticalDays: null })).toBe('verde');
  });
});

// ============================================================
// FUNCIÓN PRINCIPAL: computeDeadline
// ============================================================

describe('computeDeadline', () => {
  describe('sin fecha base', () => {
    it('retorna sin_fecha sin baseDate ni manual', () => {
      const result = computeDeadline({
        baseDate: null,
        presetId: '3d',
        now: new Date(2026, 0, 10)
      });
      expect(result.risk).toBe('sin_fecha');
      expect(result.computedStartDate).toBeNull();
      expect(result.computedMaxDueDate).toBeNull();
      expect(result.explain).toContain('Sin fecha base');
    });

    it('usa maxDueDateManual si existe sin baseDate', () => {
      const result = computeDeadline({
        baseDate: null,
        presetId: '3d',
        now: new Date(2026, 0, 10),
        maxDueDateManual: new Date(2026, 0, 20)
      });
      expect(result.risk).toBe('verde');
      expect(result.effectiveMaxDueDate).toEqual(new Date(2026, 0, 20));
    });
  });

  describe('preset 24h', () => {
    it('calcula correctamente 24 horas desde lunes', () => {
      // Base: Lunes 05 ene → Start: Martes 06 00:00 → Max: Miércoles 07 00:00
      // Buffer: 2h antes → Target: Martes 06 22:00
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5, 10, 0),
        presetId: '24h',
        now: new Date(2026, 0, 6, 15, 0),
        holidays: HOLIDAYS_2026
      });
      expect(toISODate(result.computedStartDate)).toBe('2026-01-06');
      expect(result.computedStartDate.getHours()).toBe(0);
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-01-07');
      expect(result.computedMaxDueDate.getHours()).toBe(0);
      // Target: 2h antes de mié 07 00:00 = mar 06 22:00
      expect(result.computedTargetDueDate.getHours()).toBe(22);
      expect(result.risk).toBe('verde'); // 15:00 < 22:00 target
    });

    it('amarillo cuando pasó el target pero antes del max', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5),
        presetId: '24h',
        now: new Date(2026, 0, 6, 23, 0), // 23:00 > 22:00 target, < 00:00 max
        holidays: HOLIDAYS_2026
      });
      expect(result.risk).toBe('amarillo');
    });
  });

  describe('preset 3d (3 días hábiles)', () => {
    it('calcula correctamente desde un lunes', () => {
      // Base: Lun 05 → Start: Mar 06 → 3d hábiles: Mar(1) Mié(2) Jue(3) → Max: Jue 08
      // Buffer: 2 días antes → Target: Mar 06
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5),
        presetId: '3d',
        now: new Date(2026, 0, 6, 8, 0),
        holidays: HOLIDAYS_2026
      });
      expect(toISODate(result.computedStartDate)).toBe('2026-01-06');
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-01-08');
      expect(toISODate(result.computedTargetDueDate)).toBe('2026-01-06');
      expect(result.risk).toBe('amarillo'); // Target es mismo día que start → amarillo desde el inicio
    });
  });

  describe('preset 5d (5 días hábiles)', () => {
    it('cruza fin de semana correctamente', () => {
      // Base: Mié 07 → Start: Jue 08 → 5d: Jue(1) Vie(2) [sáb dom] Lun(3) Mar(4) Mié(5) → Max: Mié 14
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 7),
        presetId: '5d',
        now: new Date(2026, 0, 8),
        holidays: HOLIDAYS_2026
      });
      expect(toISODate(result.computedStartDate)).toBe('2026-01-08');
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-01-14');
      // Buffer: 5 días naturales antes de 14 = 09. Start es 08. Target: 09
      expect(toISODate(result.computedTargetDueDate)).toBe('2026-01-09');
    });
  });

  describe('preset 10d (10 días hábiles)', () => {
    it('cuenta correctamente 10 días hábiles', () => {
      // Base: Lun 05 → Start: Mar 06
      // 10d: Mar(1)..Vie(5) + Lun(6)..Vie(10) → Vie 16 ene → Max: Vie 19 ene
      // Espera: Mar06(1) Mié07(2) Jue08(3) Vie09(4) Lun12(5) Mar13(6) Mié14(7) Jue15(8) Vie16(9) Lun19(10)
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5),
        presetId: '10d',
        now: new Date(2026, 0, 6),
        holidays: []
      });
      expect(toISODate(result.computedStartDate)).toBe('2026-01-06');
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-01-19');
      // Buffer: 7 días naturales antes de 19 = 12 ene
      expect(toISODate(result.computedTargetDueDate)).toBe('2026-01-12');
    });
  });

  describe('preset 1m (1 mes)', () => {
    it('calcula 1 mes correctamente', () => {
      // Base: Jue 15 ene → Start: Vie 16 ene → Max: 16 feb
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 15),
        presetId: '1m',
        now: new Date(2026, 0, 16),
        holidays: HOLIDAYS_2026
      });
      expect(toISODate(result.computedStartDate)).toBe('2026-01-16');
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-02-16');
      // Buffer: 15 días antes de 16 feb = 1 feb
      expect(toISODate(result.computedTargetDueDate)).toBe('2026-02-01');
      expect(result.risk).toBe('verde');
    });

    it('zona crítica: ≤3 días → rojo', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 15),
        presetId: '1m',
        now: new Date(2026, 1, 14), // 2 días antes del max (16 feb)
        holidays: HOLIDAYS_2026
      });
      expect(result.risk).toBe('rojo');
    });

    it('después del target pero fuera de zona crítica → amarillo', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 15),
        presetId: '1m',
        now: new Date(2026, 1, 5), // 5 feb → pasó target (1 feb), 11 días del max
        holidays: HOLIDAYS_2026
      });
      expect(result.risk).toBe('amarillo');
    });

    it('end-of-month: 31 ene + 1m = 28 feb', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 30), // Vie 30 ene
        presetId: '1m',
        now: new Date(2026, 0, 31),
        holidays: HOLIDAYS_2026
      });
      // Start: Sáb 31 (naturales, no ajusta)
      expect(toISODate(result.computedStartDate)).toBe('2026-01-31');
      // Max: 31 + 1 mes → Feb no tiene 31 → Feb 28
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-02-28');
    });
  });

  describe('preset 2m (2 meses)', () => {
    it('calcula 2 meses', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 10),
        presetId: '2m',
        now: new Date(2026, 0, 12),
        holidays: HOLIDAYS_2026
      });
      // Start: Dom 11 (naturales, no ajusta)
      expect(toISODate(result.computedStartDate)).toBe('2026-01-11');
      // Max: 11 ene + 2 meses = 11 mar
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-03-11');
      expect(result.risk).toBe('verde');
    });
  });

  describe('overrides manuales', () => {
    it('maxDueDateManual sobreescribe el cálculo', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5),
        presetId: '3d',
        now: new Date(2026, 0, 6),
        maxDueDateManual: new Date(2026, 0, 20),
        holidays: HOLIDAYS_2026
      });
      expect(result.computedMaxDueDate).not.toBeNull();
      expect(result.effectiveMaxDueDate).toEqual(new Date(2026, 0, 20));
      expect(toISODate(result.effectiveMaxDueDate)).toBe('2026-01-20');
    });

    it('targetDueDateManual sobreescribe el cálculo', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5),
        presetId: '3d',
        now: new Date(2026, 0, 6),
        targetDueDateManual: new Date(2026, 0, 7),
        holidays: HOLIDAYS_2026
      });
      expect(result.effectiveTargetDueDate).toEqual(new Date(2026, 0, 7));
    });
  });

  describe('parámetros explícitos sin preset', () => {
    it('funciona sin presetId', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5),
        dayCountType: 'habiles',
        durationValue: 7,
        durationUnit: 'days',
        bufferRule: { value: 3, unit: 'days' },
        now: new Date(2026, 0, 6),
        holidays: HOLIDAYS_2026
      });
      // Start: Mar 06 → 7d hábiles: Mar(1)..Vie(4) + Lun(5)..Mié(7) = Mié 14
      expect(toISODate(result.computedStartDate)).toBe('2026-01-06');
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-01-14');
      // Buffer: 3 días antes de 14 = 11
      expect(toISODate(result.computedTargetDueDate)).toBe('2026-01-11');
      expect(result.risk).toBe('verde');
    });
  });

  describe('explain', () => {
    it('incluye información del preset', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5),
        presetId: '3d',
        now: new Date(2026, 0, 6),
        holidays: HOLIDAYS_2026
      });
      expect(result.explain).toContain('Preset: 3 días hábiles');
      expect(result.explain).toContain('Notificación: 2026-01-05');
      expect(result.explain).toContain('Inicio cómputo: 2026-01-06');
      expect(result.explain).toContain('Vencimiento calculado:');
      expect(result.explain).toContain('Riesgo:');
    });

    it('indica override manual', () => {
      const result = computeDeadline({
        baseDate: new Date(2026, 0, 5),
        presetId: '3d',
        now: new Date(2026, 0, 6),
        targetDueDateManual: new Date(2026, 0, 7),
        holidays: HOLIDAYS_2026
      });
      expect(result.explain).toContain('(manual)');
    });
  });

  describe('Semana Santa (feriados consecutivos)', () => {
    it('3d hábiles empezando el miércoles antes de Semana Santa', () => {
      // Base: Mar 07 abril → Start: Mié 08 abril
      // Mié 08 (1) → [Jue09=feriado, Vie10=feriado, Sáb, Dom] → Lun 13 (2) → Mar 14 (3)
      const result = computeDeadline({
        baseDate: new Date(2026, 3, 7),
        presetId: '3d',
        now: new Date(2026, 3, 8),
        holidays: HOLIDAYS_2026
      });
      expect(toISODate(result.computedStartDate)).toBe('2026-04-08');
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-04-14');
    });

    it('notificación el jueves santo: start salta al lunes', () => {
      // Base: Jue 09 abril (feriado) → next_day = Vie 10 (feriado) → Sáb 11 → Dom 12 → Lun 13
      const result = computeDeadline({
        baseDate: new Date(2026, 3, 9),
        presetId: '3d',
        now: new Date(2026, 3, 13),
        holidays: HOLIDAYS_2026
      });
      expect(toISODate(result.computedStartDate)).toBe('2026-04-13');
      // 3d: Lun13(1) Mar14(2) Mié15(3)
      expect(toISODate(result.computedMaxDueDate)).toBe('2026-04-15');
    });
  });
});

// ============================================================
// SCHEMAS
// ============================================================

describe('DEADLINE_PRESETS', () => {
  it('tiene 7 presets', () => {
    expect(DEADLINE_PRESETS).toHaveLength(7);
  });

  it('todos los presets tienen los campos requeridos', () => {
    DEADLINE_PRESETS.forEach(p => {
      expect(p).toHaveProperty('presetId');
      expect(p).toHaveProperty('label');
      expect(p).toHaveProperty('dayCountType');
      expect(p).toHaveProperty('durationValue');
      expect(p).toHaveProperty('durationUnit');
      expect(p).toHaveProperty('startRule', 'next_day');
      expect(p).toHaveProperty('buffer');
      expect(p.buffer).toHaveProperty('value');
      expect(p.buffer).toHaveProperty('unit');
    });
  });

  it('DEADLINE_PRESET_MAP tiene todas las claves', () => {
    expect(Object.keys(DEADLINE_PRESET_MAP)).toEqual(
      expect.arrayContaining(['24h', '3d', '5d', '10d', '15d', '1m', '2m'])
    );
  });

  it('presets de 1m y 2m tienen criticalDays', () => {
    expect(DEADLINE_PRESET_MAP['1m'].criticalDays).toBe(3);
    expect(DEADLINE_PRESET_MAP['2m'].criticalDays).toBe(3);
  });

  it('presets de días no tienen criticalDays', () => {
    expect(DEADLINE_PRESET_MAP['3d'].criticalDays).toBeNull();
    expect(DEADLINE_PRESET_MAP['5d'].criticalDays).toBeNull();
  });
});

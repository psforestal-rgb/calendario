/**
 * CasesManager.jsx — Gestión de Casos/Expedientes (Fase 2A)
 *
 * Componentes:
 *   - CasesModal: modal principal con lista, búsqueda y detalle
 *   - CaseForm: formulario de creación/edición rápida
 *   - CaseDetail: vista detalle con plazos LGAP
 *   - CaseLinkSection: sección para vincular caso en TaskFormModal
 */

import React, { useState, useMemo } from 'react';
import {
  Search, Plus, X, ChevronLeft, Save, FileText, Calendar,
  ExternalLink, AlertCircle, Clock, Edit2, Trash2, Link, Unlink, ArrowRightCircle
} from 'lucide-react';
import { computeDeadline, toISODate } from './deadlineEngine.js';
import {
  DEADLINE_PRESETS, DEADLINE_PRESET_MAP, CASE_TYPES,
  CASE_STATUSES, STEP_TYPES, RISK_LEVELS, CASE_LINK_TYPES, CASE_LINK_TYPE_MAP
} from './schemas.js';

// ============================================================
// UTILIDADES LOCALES
// ============================================================

const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

/** Formatea fecha ISO para display */
const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Chip de riesgo con color del semáforo */
const RiskBadge = ({ risk, colors }) => {
  const info = RISK_LEVELS[risk] || RISK_LEVELS.sin_fecha;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
      backgroundColor: info.color + '22', color: info.color, border: `1px solid ${info.color}44`
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: info.color }} />
      {info.label}
    </span>
  );
};

// ============================================================
// FORMULARIO DE CASO (crear / editar)
// ============================================================

const CaseForm = ({ caseData, onSave, onCancel, colors, holidays, initialTitle }) => {
  const isNew = !caseData;
  const [form, setForm] = useState(() => {
    if (caseData) return { ...caseData };
    return {
      caseType: CASE_TYPES[0],
      title: initialTitle || '',
      notes: '',
      externalRefs: [{ system: 'SICAF', value: '', status: 'pendiente', note: '' }],
      receptionDateReal: '',
      receptionDateEstimated: '',
      receptionConfidence: 'desconocida',
      deadlinePresetId: '10d',
      deadlineConfigCustom: null,
      maxDueDateManual: '',
      targetDueDateManual: '',
      manualOverrideReason: '',
      caseStatus: 'nuevo',
    };
  });

  const [useCustomDeadline, setUseCustomDeadline] = useState(
    caseData ? !caseData.deadlinePresetId : false
  );
  const [customConfig, setCustomConfig] = useState(
    caseData?.deadlineConfigCustom || { dayCountType: 'habiles', durationValue: 10, durationUnit: 'days', startRule: 'next_day' }
  );

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleRefChange = (idx, field, val) => {
    const refs = [...form.externalRefs];
    refs[idx] = { ...refs[idx], [field]: val };
    setForm(f => ({ ...f, externalRefs: refs }));
  };

  const addRef = () => setForm(f => ({
    ...f, externalRefs: [...f.externalRefs, { system: 'SICAF', value: '', status: 'pendiente', note: '' }]
  }));

  const removeRef = (idx) => setForm(f => ({
    ...f, externalRefs: f.externalRefs.filter((_, i) => i !== idx)
  }));

  // Compute deadline preview
  const baseDate = form.receptionDateReal || form.receptionDateEstimated || null;
  const deadlineResult = useMemo(() => {
    if (!baseDate) return null;
    const input = {
      baseDate: new Date(baseDate + 'T00:00:00'),
      holidays: holidays || [],
      now: new Date(),
      maxDueDateManual: form.maxDueDateManual ? new Date(form.maxDueDateManual + 'T00:00:00') : null,
      targetDueDateManual: form.targetDueDateManual ? new Date(form.targetDueDateManual + 'T00:00:00') : null,
    };
    if (!useCustomDeadline && form.deadlinePresetId) {
      input.presetId = form.deadlinePresetId;
    } else {
      input.dayCountType = customConfig.dayCountType;
      input.durationValue = customConfig.durationValue;
      input.durationUnit = customConfig.durationUnit;
      input.startRule = customConfig.startRule || 'next_day';
      input.bufferRule = { value: 2, unit: 'days' };
    }
    return computeDeadline(input);
  }, [baseDate, form.deadlinePresetId, useCustomDeadline, customConfig, form.maxDueDateManual, form.targetDueDateManual, holidays]);

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const caseToSave = {
      ...form,
      deadlinePresetId: useCustomDeadline ? null : form.deadlinePresetId,
      deadlineConfigCustom: useCustomDeadline ? customConfig : null,
      computed: deadlineResult ? {
        effectiveMaxDueDate: deadlineResult.effectiveMaxDueDate?.toISOString() || null,
        effectiveTargetDueDate: deadlineResult.effectiveTargetDueDate?.toISOString() || null,
        risk: deadlineResult.risk
      } : null,
      updatedAt: now,
    };
    if (isNew) {
      caseToSave.caseUid = uuid();
      caseToSave.createdAt = now;
    }
    onSave(caseToSave);
  };

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontSize: '13px', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, marginBottom: '4px' };
  const sectionStyle = { marginBottom: '16px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Tipo y título */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Tipo de caso</label>
          <select style={inputStyle} value={form.caseType} onChange={e => set('caseType', e.target.value)}>
            {CASE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Estado</label>
          <select style={inputStyle} value={form.caseStatus} onChange={e => set('caseStatus', e.target.value)}>
            {CASE_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Título / Descripción breve</label>
        <input type="text" style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: PP Finca Los Robles - Hojancha" />
      </div>

      {/* Referencias externas */}
      <div style={sectionStyle}>
        <label style={labelStyle}>Referencias externas</label>
        {form.externalRefs.map((ref, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
            <select style={{ ...inputStyle, width: '100px', flex: 'none' }} value={ref.system} onChange={e => handleRefChange(idx, 'system', e.target.value)}>
              <option value="SICAF">SICAF</option>
              <option value="OTRO">Otro</option>
            </select>
            <input type="text" style={{ ...inputStyle, flex: 1 }} value={ref.value} onChange={e => handleRefChange(idx, 'value', e.target.value)} placeholder="N° expediente" />
            <select style={{ ...inputStyle, width: '110px', flex: 'none' }} value={ref.status} onChange={e => handleRefChange(idx, 'status', e.target.value)}>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="estimada">Estimada</option>
            </select>
            {form.externalRefs.length > 1 && (
              <button onClick={() => removeRef(idx)} style={{ padding: '4px', border: 'none', background: 'none', color: colors.danger, cursor: 'pointer' }}><X size={14} /></button>
            )}
          </div>
        ))}
        <button onClick={addRef} style={{ fontSize: '11px', color: colors.accent, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}>+ Agregar referencia</button>
      </div>

      {/* Fechas de recepción */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        <div>
          <label style={labelStyle}>Recepción real</label>
          <input type="date" style={inputStyle} value={form.receptionDateReal || ''} onChange={e => set('receptionDateReal', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Recepción estimada</label>
          <input type="date" style={inputStyle} value={form.receptionDateEstimated || ''} onChange={e => set('receptionDateEstimated', e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Confianza</label>
          <select style={inputStyle} value={form.receptionConfidence} onChange={e => set('receptionConfidence', e.target.value)}>
            <option value="confirmada">Confirmada</option>
            <option value="estimada">Estimada</option>
            <option value="desconocida">Desconocida</option>
          </select>
        </div>
      </div>

      {/* Plazo LGAP */}
      <div style={{ ...sectionStyle, padding: '12px', backgroundColor: colors.bgTertiary, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
        <label style={{ ...labelStyle, marginBottom: '8px' }}>Plazo legal (LGAP)</label>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input type="radio" checked={!useCustomDeadline} onChange={() => setUseCustomDeadline(false)} /> Preset
          </label>
          <label style={{ fontSize: '12px', color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
            <input type="radio" checked={useCustomDeadline} onChange={() => setUseCustomDeadline(true)} /> Personalizado
          </label>
        </div>

        {!useCustomDeadline ? (
          <select style={inputStyle} value={form.deadlinePresetId || ''} onChange={e => set('deadlinePresetId', e.target.value)}>
            <option value="">Sin plazo</option>
            {DEADLINE_PRESETS.map(p => <option key={p.presetId} value={p.presetId}>{p.label} — {p.description}</option>)}
          </select>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', gap: '8px' }}>
            <select style={inputStyle} value={customConfig.dayCountType} onChange={e => setCustomConfig(c => ({ ...c, dayCountType: e.target.value }))}>
              <option value="habiles">Hábiles</option>
              <option value="naturales">Naturales</option>
              <option value="horas">Horas</option>
            </select>
            <input type="number" style={inputStyle} min="1" value={customConfig.durationValue} onChange={e => setCustomConfig(c => ({ ...c, durationValue: parseInt(e.target.value) || 1 }))} />
            <select style={inputStyle} value={customConfig.durationUnit} onChange={e => setCustomConfig(c => ({ ...c, durationUnit: e.target.value }))}>
              <option value="days">Días</option>
              <option value="hours">Horas</option>
              <option value="months">Meses</option>
            </select>
          </div>
        )}

        {/* Override manual */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
          <div>
            <label style={labelStyle}>Vencimiento manual</label>
            <input type="date" style={inputStyle} value={form.maxDueDateManual || ''} onChange={e => set('maxDueDateManual', e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Objetivo manual</label>
            <input type="date" style={inputStyle} value={form.targetDueDateManual || ''} onChange={e => set('targetDueDateManual', e.target.value)} />
          </div>
        </div>
        {(form.maxDueDateManual || form.targetDueDateManual) && (
          <div style={{ marginTop: '6px' }}>
            <label style={labelStyle}>Motivo del override</label>
            <input type="text" style={inputStyle} value={form.manualOverrideReason || ''} onChange={e => set('manualOverrideReason', e.target.value)} placeholder="Ej: Prórroga solicitada por administrado" />
          </div>
        )}

        {/* Preview del cómputo */}
        {deadlineResult && (
          <div style={{ marginTop: '10px', padding: '8px', backgroundColor: colors.bgPrimary, borderRadius: '6px', fontSize: '12px', color: colors.textSecondary }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontWeight: '600' }}>Resultado del cómputo</span>
              <RiskBadge risk={deadlineResult.risk} colors={colors} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', fontSize: '11px' }}>
              <span>Inicio: {fmtDate(deadlineResult.computedStartDate)}</span>
              <span>Vencimiento: {fmtDate(deadlineResult.effectiveMaxDueDate)}</span>
              <span>Objetivo interno: {fmtDate(deadlineResult.effectiveTargetDueDate)}</span>
              <span style={{ fontStyle: 'italic', opacity: 0.7 }}>{deadlineResult.explain?.split('.').slice(-2, -1)[0]?.trim()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Notas */}
      <div>
        <label style={labelStyle}>Notas</label>
        <textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={form.notes} onChange={e => set('notes', e.target.value)} />
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={handleSubmit} style={{ padding: '8px 16px', backgroundColor: colors.success, color: colors.bgPrimary, fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Save size={14} /> {isNew ? 'Crear caso' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// RELACIONES ENTRE CASOS (case_links)
// ============================================================

const CaseRelationsSection = ({ caseUid, cases, caseLinks, onSaveCaseLink, onDeleteCaseLink, colors }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [linkType, setLinkType] = useState('relacionado');
  const [targetSearch, setTargetSearch] = useState('');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [note, setNote] = useState('');

  // Links where this case is fromCaseUid or toCaseUid
  const relatedLinks = useMemo(() => {
    return (caseLinks || []).filter(l => l.fromCaseUid === caseUid || l.toCaseUid === caseUid);
  }, [caseLinks, caseUid]);

  // Resolve related case data for display
  const resolvedLinks = useMemo(() => {
    return relatedLinks.map(link => {
      const isFrom = link.fromCaseUid === caseUid;
      const otherCaseUid = isFrom ? link.toCaseUid : link.fromCaseUid;
      const otherCase = cases.find(c => c.caseUid === otherCaseUid);
      // Show the type from this case's perspective
      const displayType = isFrom
        ? link.type
        : (CASE_LINK_TYPE_MAP[link.type]?.inverse || link.type);
      const displayLabel = CASE_LINK_TYPE_MAP[displayType]?.label || displayType;
      return { ...link, otherCase, otherCaseUid, displayLabel };
    });
  }, [relatedLinks, cases, caseUid]);

  // Search for target cases (exclude self)
  const searchResults = useMemo(() => {
    if (!targetSearch.trim()) return [];
    const q = targetSearch.toLowerCase();
    return cases.filter(c =>
      c.caseUid !== caseUid && (
        c.title?.toLowerCase().includes(q) ||
        c.caseType?.toLowerCase().includes(q) ||
        c.externalRefs?.some(r => r.value?.toLowerCase().includes(q))
      )
    ).slice(0, 5);
  }, [targetSearch, cases, caseUid]);

  const handleAdd = () => {
    if (!selectedTarget) return;
    const linkData = {
      linkUid: Date.now().toString(36) + Math.random().toString(36).substr(2),
      fromCaseUid: caseUid,
      toCaseUid: selectedTarget.caseUid,
      type: linkType,
      note: note.trim() || null,
      createdAt: new Date().toISOString()
    };
    onSaveCaseLink(linkData);
    setShowAddForm(false);
    setSelectedTarget(null);
    setTargetSearch('');
    setNote('');
    setLinkType('relacionado');
  };

  const handleDelete = (linkUid) => {
    if (confirm('¿Eliminar esta relación?')) {
      onDeleteCaseLink(linkUid);
    }
  };

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontSize: '13px', boxSizing: 'border-box' };
  const sectionTitle = { fontSize: '13px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px', marginTop: '16px' };

  return (
    <div>
      <div style={{ ...sectionTitle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Relaciones ({resolvedLinks.length})</span>
        <button onClick={() => setShowAddForm(!showAddForm)} style={{ fontSize: '11px', color: colors.accent, background: 'none', border: `1px solid ${colors.accent}44`, borderRadius: '4px', padding: '3px 8px', cursor: 'pointer' }}>
          {showAddForm ? 'Cancelar' : '+ Agregar relación'}
        </button>
      </div>

      {/* Add relation form */}
      {showAddForm && (
        <div style={{ padding: '10px', backgroundColor: colors.bgTertiary, borderRadius: '8px', border: `1px solid ${colors.border}`, marginBottom: '10px' }}>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Tipo de relación</label>
            <select style={inputStyle} value={linkType} onChange={e => setLinkType(e.target.value)}>
              {CASE_LINK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Caso destino</label>
            {selectedTarget ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', backgroundColor: colors.bgPrimary, borderRadius: '6px', border: `1px solid ${colors.accent}44` }}>
                <span style={{ fontSize: '12px', color: colors.textPrimary }}>{selectedTarget.title || selectedTarget.caseType}</span>
                <button onClick={() => { setSelectedTarget(null); setTargetSearch(''); }} style={{ padding: '2px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><X size={12} /></button>
              </div>
            ) : (
              <>
                <div style={{ position: 'relative' }}>
                  <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                  <input type="text" placeholder="Buscar caso..." style={{ ...inputStyle, paddingLeft: '28px' }} value={targetSearch} onChange={e => setTargetSearch(e.target.value)} />
                </div>
                {searchResults.length > 0 && (
                  <div style={{ marginTop: '4px' }}>
                    {searchResults.map(c => (
                      <div key={c.caseUid} onClick={() => { setSelectedTarget(c); setTargetSearch(''); }} style={{
                        padding: '5px 8px', marginBottom: '2px', borderRadius: '4px', cursor: 'pointer',
                        backgroundColor: colors.bgPrimary, border: `1px solid ${colors.border}`, fontSize: '12px', color: colors.textPrimary
                      }}>
                        {c.title || c.caseType}
                        {c.externalRefs?.filter(r => r.value).length > 0 && (
                          <span style={{ fontSize: '10px', color: colors.textMuted, marginLeft: '6px' }}>
                            {c.externalRefs.filter(r => r.value).map(r => `${r.system}: ${r.value}`).join(', ')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {targetSearch && searchResults.length === 0 && (
                  <div style={{ fontSize: '11px', color: colors.textMuted, textAlign: 'center', padding: '4px' }}>Sin resultados</div>
                )}
              </>
            )}
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', fontSize: '11px', color: colors.textMuted, marginBottom: '4px' }}>Nota (opcional)</label>
            <input type="text" style={inputStyle} value={note} onChange={e => setNote(e.target.value)} placeholder="Motivo de la relación..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={handleAdd} disabled={!selectedTarget} style={{
              padding: '6px 14px', backgroundColor: selectedTarget ? colors.success : colors.textMuted + '44',
              color: selectedTarget ? colors.bgPrimary : colors.textMuted,
              fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: selectedTarget ? 'pointer' : 'default',
              fontSize: '12px'
            }}>
              Agregar
            </button>
          </div>
        </div>
      )}

      {/* List existing relations */}
      {resolvedLinks.length === 0 && !showAddForm ? (
        <div style={{ fontSize: '12px', color: colors.textMuted, padding: '8px 0' }}>Sin relaciones con otros casos.</div>
      ) : (
        resolvedLinks.map(link => (
          <div key={link.linkUid || link.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '6px 8px', marginBottom: '4px', backgroundColor: colors.bgPrimary,
            borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px'
          }}>
            <div>
              <span style={{ color: colors.accent, fontWeight: '600', marginRight: '6px' }}>{link.displayLabel}</span>
              <span style={{ color: colors.textPrimary }}>{link.otherCase?.title || link.otherCase?.caseType || link.otherCaseUid}</span>
              {link.note && <span style={{ color: colors.textMuted, marginLeft: '6px', fontSize: '10px' }}>— {link.note}</span>}
            </div>
            <button onClick={() => handleDelete(link.linkUid || link.id)} style={{ padding: '2px 4px', background: 'none', border: 'none', color: colors.danger, cursor: 'pointer', opacity: 0.6 }}>
              <Trash2 size={12} />
            </button>
          </div>
        ))
      )}
    </div>
  );
};

// ============================================================
// VISTA DETALLE DE CASO
// ============================================================

const CaseDetail = ({ caseData, onEdit, onBack, onDelete, colors, holidays, tasks, caseLinks, onSaveCaseLink, onDeleteCaseLink, cases }) => {
  const baseDate = caseData.receptionDateReal || caseData.receptionDateEstimated || null;

  const deadlineResult = useMemo(() => {
    if (!baseDate) return null;
    const input = {
      baseDate: new Date(baseDate + 'T00:00:00'),
      holidays: holidays || [],
      now: new Date(),
      maxDueDateManual: caseData.maxDueDateManual ? new Date(caseData.maxDueDateManual + 'T00:00:00') : null,
      targetDueDateManual: caseData.targetDueDateManual ? new Date(caseData.targetDueDateManual + 'T00:00:00') : null,
    };
    if (caseData.deadlinePresetId) {
      input.presetId = caseData.deadlinePresetId;
    } else if (caseData.deadlineConfigCustom) {
      Object.assign(input, caseData.deadlineConfigCustom);
      input.bufferRule = { value: 2, unit: 'days' };
    }
    return computeDeadline(input);
  }, [caseData, baseDate, holidays]);

  const linkedTasks = useMemo(
    () => (tasks || []).filter(t => t.caseUid === caseData.caseUid),
    [tasks, caseData.caseUid]
  );

  const presetLabel = caseData.deadlinePresetId
    ? DEADLINE_PRESET_MAP[caseData.deadlinePresetId]?.label
    : 'Personalizado';

  const statusLabel = CASE_STATUSES.find(s => s.value === caseData.caseStatus)?.label || caseData.caseStatus;

  const sectionTitle = { fontSize: '13px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px', marginTop: '16px' };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: `1px solid ${colors.border}22` };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <button onClick={onBack} style={{ padding: '4px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><ChevronLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: colors.textPrimary }}>{String(caseData.title || caseData.caseType || '')}</div>
          <div style={{ fontSize: '11px', color: colors.textMuted }}>{String(caseData.caseType || '')} — {String(statusLabel || '')}</div>
        </div>
        {deadlineResult && <RiskBadge risk={deadlineResult.risk} colors={colors} />}
      </div>

      {/* Refs externas */}
      {caseData.externalRefs?.length > 0 && (
        <div>
          <div style={sectionTitle}>Referencias externas</div>
          {caseData.externalRefs.map((ref, i) => (
            <div key={i} style={{ ...rowStyle, color: colors.textSecondary }}>
              <span><ExternalLink size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />{String(ref.system || '')}: {String(ref.value || '(vacío)')}</span>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>{String(ref.status || '')}</span>
            </div>
          ))}
        </div>
      )}

      {/* Fechas */}
      <div style={sectionTitle}>Fechas y plazo</div>
      <div style={rowStyle}>
        <span style={{ color: colors.textMuted }}>Recepción</span>
        <span style={{ color: colors.textPrimary }}>{fmtDate(baseDate)} {caseData.receptionConfidence !== 'confirmada' && <span style={{ fontSize: '10px', opacity: 0.6 }}>({String(caseData.receptionConfidence || '')})</span>}</span>
      </div>
      <div style={rowStyle}>
        <span style={{ color: colors.textMuted }}>Plazo</span>
        <span style={{ color: colors.textPrimary }}>{presetLabel || '—'}</span>
      </div>

      {deadlineResult && (
        <>
          <div style={rowStyle}>
            <span style={{ color: colors.textMuted }}>Inicio cómputo</span>
            <span style={{ color: colors.textPrimary }}>{fmtDate(deadlineResult.computedStartDate)}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: colors.textMuted }}>Vencimiento máximo</span>
            <span style={{ color: colors.textPrimary, fontWeight: '600' }}>{fmtDate(deadlineResult.effectiveMaxDueDate)}</span>
          </div>
          <div style={rowStyle}>
            <span style={{ color: colors.textMuted }}>Objetivo interno</span>
            <span style={{ color: colors.textPrimary }}>{fmtDate(deadlineResult.effectiveTargetDueDate)}</span>
          </div>
          {caseData.maxDueDateManual && (
            <div style={rowStyle}>
              <span style={{ color: colors.warning }}>Override manual</span>
              <span style={{ color: colors.warning, fontSize: '11px' }}>{caseData.manualOverrideReason || 'Sin motivo'}</span>
            </div>
          )}
        </>
      )}

      {/* Tareas vinculadas */}
      <div style={sectionTitle}>Tareas vinculadas ({linkedTasks.length})</div>
      {linkedTasks.length === 0 ? (
        <div style={{ fontSize: '12px', color: colors.textMuted, padding: '8px 0' }}>Ninguna tarea vinculada a este caso.</div>
      ) : (
        linkedTasks.map(t => (
          <div key={t.id} style={{ padding: '6px 8px', marginBottom: '4px', backgroundColor: colors.bgPrimary, borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }}>
            <span style={{ color: colors.textPrimary }}>{t.activityTypeName} {t.subtipo ? `- ${t.subtipo}` : ''}</span>
            <span style={{ float: 'right', fontSize: '10px', color: colors.textMuted }}>{fmtDate(t.start)}</span>
          </div>
        ))
      )}

      {/* Relaciones entre casos */}
      <CaseRelationsSection
        caseUid={caseData.caseUid}
        cases={cases}
        caseLinks={caseLinks}
        onSaveCaseLink={onSaveCaseLink}
        onDeleteCaseLink={onDeleteCaseLink}
        colors={colors}
      />

      {/* Notas */}
      {caseData.notes && (
        <>
          <div style={sectionTitle}>Notas</div>
          <div style={{ fontSize: '12px', color: colors.textSecondary, whiteSpace: 'pre-wrap' }}>{caseData.notes}</div>
        </>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
        <button onClick={() => onDelete(caseData.caseUid)} style={{ padding: '8px 14px', backgroundColor: colors.danger + '22', color: colors.danger, borderRadius: '6px', border: `1px solid ${colors.danger}44`, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Trash2 size={13} /> Eliminar
        </button>
        <button onClick={() => onEdit(caseData)} style={{ padding: '8px 14px', backgroundColor: colors.accent, color: colors.bgPrimary, fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Edit2 size={13} /> Editar
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MODAL PRINCIPAL DE CASOS
// ============================================================

const CasesModalContent = ({ isOpen, onClose, cases, onSaveCase, onDeleteCase, caseLinks, onSaveCaseLink, onDeleteCaseLink, colors, holidays, tasks, Modal, onSaveTask }) => {
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'form' | 'temp_refs' | 'convert_form'
  const [selectedCase, setSelectedCase] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [convertingTempRef, setConvertingTempRef] = useState(null); // temporal ref text being converted

  // Ensure safe cases data (guard against any remaining Firestore objects)
  const safeCases = useMemo(() => (cases || []).filter(c => c && typeof c === 'object'), [cases]);

  // Collect unique temporal references from tasks
  const tempRefs = useMemo(() => {
    const refMap = {};
    (tasks || []).forEach(t => {
      if (!t.caseUid && t.caseExternalRefText) {
        const ref = t.caseExternalRefText.trim();
        if (ref) {
          if (!refMap[ref]) refMap[ref] = { count: 0, tasks: [] };
          refMap[ref].count++;
          refMap[ref].tasks.push(t);
        }
      }
    });
    return Object.entries(refMap)
      .map(([ref, data]) => ({ ref, count: data.count, tasks: data.tasks }))
      .sort((a, b) => a.ref.localeCompare(b.ref));
  }, [tasks]);

  // Filtrar casos por búsqueda
  const filteredCases = useMemo(() => {
    if (!searchQuery.trim()) return safeCases;
    const q = searchQuery.toLowerCase();
    return safeCases.filter(c =>
      String(c.title || '').toLowerCase().includes(q) ||
      String(c.caseType || '').toLowerCase().includes(q) ||
      (Array.isArray(c.externalRefs) && c.externalRefs.some(r => String(r.value || '').toLowerCase().includes(q)))
    );
  }, [safeCases, searchQuery]);

  // Ordenar por riesgo (rojo primero) y fecha de actualización
  const sortedCases = useMemo(() => {
    const riskOrder = { rojo: 0, amarillo: 1, verde: 2, sin_fecha: 3 };
    return [...filteredCases].sort((a, b) => {
      const ra = riskOrder[String(a.computed?.risk || 'sin_fecha')] ?? 3;
      const rb = riskOrder[String(b.computed?.risk || 'sin_fecha')] ?? 3;
      if (ra !== rb) return ra - rb;
      const dateA = typeof a.updatedAt === 'string' ? new Date(a.updatedAt) : new Date(0);
      const dateB = typeof b.updatedAt === 'string' ? new Date(b.updatedAt) : new Date(0);
      return dateB - dateA;
    });
  }, [filteredCases]);

  const handleSave = (caseToSave) => {
    onSaveCase(caseToSave);
    setView('list');
    setEditingCase(null);
  };

  const handleConvertSave = (caseToSave) => {
    // Save the new case
    onSaveCase(caseToSave);
    // Update all tasks that had this temporal reference to link to the new case
    if (convertingTempRef && onSaveTask) {
      const refTasks = (tasks || []).filter(t => !t.caseUid && t.caseExternalRefText?.trim() === convertingTempRef);
      refTasks.forEach(t => {
        onSaveTask({ ...t, caseUid: caseToSave.caseUid, caseExternalRefText: null, workstream: 'case' });
      });
    }
    setConvertingTempRef(null);
    setView('list');
  };

  const handleDelete = (caseUid) => {
    if (confirm('¿Eliminar este caso? Las tareas vinculadas no se eliminarán.')) {
      onDeleteCase(caseUid);
      setView('list');
      setSelectedCase(null);
    }
  };

  const openDetail = (c) => { setSelectedCase(c); setView('detail'); };
  const openEdit = (c) => { setEditingCase(c); setView('form'); };
  const openNew = () => { setEditingCase(null); setView('form'); };
  const goBack = () => { setView('list'); setSelectedCase(null); setEditingCase(null); setConvertingTempRef(null); };
  const openTempRefs = () => { setView('temp_refs'); };
  const startConvert = (refText) => { setConvertingTempRef(refText); setView('convert_form'); };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Casos / Expedientes" size="lg" colors={colors}>
      {view === 'list' && (
        <div>
          {/* Barra de búsqueda + botones */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, position: 'relative', minWidth: '180px' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
              <input
                type="text" placeholder="Buscar por título o N° expediente..."
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontSize: '13px', boxSizing: 'border-box' }}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            {tempRefs.length > 0 && (
              <button onClick={openTempRefs} style={{ padding: '8px 12px', backgroundColor: colors.warning + '22', color: colors.warning, fontWeight: '600', borderRadius: '6px', border: `1px solid ${colors.warning}44`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                <Clock size={13} /> Temporales ({tempRefs.length})
              </button>
            )}
            <button onClick={openNew} style={{ padding: '8px 14px', backgroundColor: colors.success, color: colors.bgPrimary, fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}>
              <Plus size={14} /> Nuevo caso
            </button>
          </div>

          {/* Lista de casos */}
          {sortedCases.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted }}>
              <FileText size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div style={{ fontSize: '14px' }}>{searchQuery ? 'Sin resultados' : 'No hay casos registrados'}</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Crea tu primer caso con el botón "Nuevo caso"</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sortedCases.map(c => {
                const risk = String(c.computed?.risk || 'sin_fecha');
                const refText = c.externalRefs?.filter(r => r.value).map(r => `${r.system}: ${r.value}`).join(', ') || '';
                const statusLabel = CASE_STATUSES.find(s => s.value === c.caseStatus)?.label || String(c.caseStatus || '');
                const displayTitle = String(c.title || c.caseType || 'Sin título');
                const displayType = String(c.caseType || '');

                return (
                  <div key={c.caseUid || c.id} onClick={() => openDetail(c)} style={{
                    padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${(RISK_LEVELS[risk] || RISK_LEVELS.sin_fecha).color}`,
                    backgroundColor: colors.bgPrimary, cursor: 'pointer',
                    transition: 'background-color 0.15s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary }}>{displayTitle}</div>
                        <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
                          {displayType} — {statusLabel}
                          {refText && <span> — {refText}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {c.computed?.effectiveMaxDueDate && (
                          <span style={{ fontSize: '11px', color: colors.textMuted }}>{fmtDate(c.computed.effectiveMaxDueDate)}</span>
                        )}
                        <RiskBadge risk={risk} colors={colors} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Stats */}
          {safeCases.length > 0 && (
            <div style={{ marginTop: '12px', padding: '8px', fontSize: '11px', color: colors.textMuted, textAlign: 'center' }}>
              {safeCases.length} caso{safeCases.length !== 1 ? 's' : ''} total{safeCases.length !== 1 ? 'es' : ''}
              {searchQuery && ` — ${filteredCases.length} coincidencia${filteredCases.length !== 1 ? 's' : ''}`}
            </div>
          )}
        </div>
      )}

      {/* Vista de referencias temporales */}
      {view === 'temp_refs' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <button onClick={goBack} style={{ padding: '4px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>Referencias temporales</span>
            <span style={{ fontSize: '11px', color: colors.textMuted }}>({tempRefs.length})</span>
          </div>

          <div style={{ fontSize: '12px', color: colors.textMuted, marginBottom: '12px', padding: '8px 10px', backgroundColor: colors.bgTertiary, borderRadius: '6px', border: `1px solid ${colors.border}` }}>
            Estas referencias agrupan actividades que aún no tienen un expediente formal creado. Seleccione una para convertirla en caso/expediente.
          </div>

          {tempRefs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: colors.textMuted }}>
              <Clock size={28} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div style={{ fontSize: '13px' }}>No hay referencias temporales pendientes</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {tempRefs.map(({ ref, count, tasks: refTasks }) => {
                const latestDate = refTasks.reduce((latest, t) => {
                  const d = new Date(t.start);
                  return d > latest ? d : latest;
                }, new Date(0));

                return (
                  <div key={ref} style={{
                    padding: '12px', borderRadius: '8px', border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${colors.warning}`,
                    backgroundColor: colors.bgPrimary
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={13} style={{ color: colors.warning, flexShrink: 0 }} />
                          {ref}
                        </div>
                        <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '4px' }}>
                          {count} actividad{count !== 1 ? 'es' : ''} vinculada{count !== 1 ? 's' : ''}
                          {' — Última: '}{fmtDate(latestDate)}
                        </div>
                        {/* Mini list of linked activities */}
                        <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          {refTasks.slice(0, 3).map(t => (
                            <div key={t.id} style={{ fontSize: '11px', color: colors.textSecondary, paddingLeft: '19px' }}>
                              {fmtDate(t.start)} — {t.activityTypeName || 'Actividad'} {t.subtipo ? `(${t.subtipo})` : ''}
                            </div>
                          ))}
                          {refTasks.length > 3 && (
                            <div style={{ fontSize: '10px', color: colors.textMuted, paddingLeft: '19px', fontStyle: 'italic' }}>
                              +{refTasks.length - 3} más...
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => startConvert(ref)}
                        style={{
                          padding: '6px 12px', backgroundColor: colors.success, color: colors.bgPrimary,
                          fontWeight: '600', borderRadius: '6px', border: 'none', cursor: 'pointer',
                          fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', flexShrink: 0
                        }}
                      >
                        <ArrowRightCircle size={12} /> Crear expediente
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Formulario de conversión de referencia temporal a caso */}
      {view === 'convert_form' && convertingTempRef && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <button onClick={() => { setConvertingTempRef(null); setView('temp_refs'); }} style={{ padding: '4px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>Crear expediente desde referencia temporal</span>
          </div>
          <div style={{ fontSize: '12px', color: colors.warning, marginBottom: '12px', padding: '8px 10px', backgroundColor: colors.warning + '11', borderRadius: '6px', border: `1px solid ${colors.warning}33`, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} style={{ flexShrink: 0 }} />
            <span>Referencia: <strong>{convertingTempRef}</strong> — {tempRefs.find(r => r.ref === convertingTempRef)?.count || 0} actividad(es) se vincularán automáticamente al nuevo expediente.</span>
          </div>
          <CaseForm
            caseData={null}
            onSave={handleConvertSave}
            onCancel={() => { setConvertingTempRef(null); setView('temp_refs'); }}
            colors={colors}
            holidays={holidays}
            initialTitle={convertingTempRef}
          />
        </div>
      )}

      {view === 'detail' && selectedCase && (
        <CaseDetail
          caseData={selectedCase}
          onEdit={openEdit}
          onBack={goBack}
          onDelete={handleDelete}
          colors={colors}
          holidays={holidays}
          tasks={tasks}
          cases={cases}
          caseLinks={caseLinks}
          onSaveCaseLink={onSaveCaseLink}
          onDeleteCaseLink={onDeleteCaseLink}
        />
      )}

      {view === 'form' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <button onClick={goBack} style={{ padding: '4px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>{editingCase ? 'Editar caso' : 'Nuevo caso'}</span>
          </div>
          <CaseForm
            caseData={editingCase}
            onSave={handleSave}
            onCancel={goBack}
            colors={colors}
            holidays={holidays}
          />
        </div>
      )}
    </Modal>
  );
};


const CasesModal = (props) => {
  if (!props.isOpen) return null;
  return <CasesModalContent {...props} />;
};

// ============================================================
// SECCIÓN DE VINCULACIÓN DE CASO EN TASKFORMMODAL
// ============================================================

const CaseLinkSection = ({ form, setForm, cases, colors, tasks }) => {
  const [expanded, setExpanded] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');

  const linkedCase = useMemo(() => {
    if (!form.caseUid) return null;
    return cases.find(c => c.caseUid === form.caseUid) || null;
  }, [form.caseUid, cases]);

  // Collect unique temporal references from all tasks (no caseUid, has caseExternalRefText)
  const existingTempRefs = useMemo(() => {
    const refMap = {};
    (tasks || []).forEach(t => {
      if (!t.caseUid && t.caseExternalRefText) {
        const ref = t.caseExternalRefText.trim();
        if (ref) {
          if (!refMap[ref]) refMap[ref] = 0;
          refMap[ref]++;
        }
      }
    });
    return Object.entries(refMap).map(([ref, count]) => ({ ref, count })).sort((a, b) => a.ref.localeCompare(b.ref));
  }, [tasks]);

  const searchResults = useMemo(() => {
    if (!caseSearch.trim()) return [];
    const q = caseSearch.toLowerCase();
    return cases.filter(c =>
      c.title?.toLowerCase().includes(q) ||
      c.caseType?.toLowerCase().includes(q) ||
      c.externalRefs?.some(r => r.value?.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [caseSearch, cases]);

  const linkCase = (c) => {
    setForm(f => ({ ...f, caseUid: c.caseUid, workstream: 'case', caseExternalRefText: null }));
    setCaseSearch('');
  };

  const unlinkCase = () => {
    setForm(f => ({ ...f, caseUid: null, workstream: 'non_case' }));
  };

  const selectTempRef = (refText) => {
    setForm(f => ({ ...f, caseExternalRefText: refText }));
  };

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontSize: '13px', boxSizing: 'border-box' };

  return (
    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px' }}>
      <button onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: colors.accent, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '8px' }}>
        <FileText size={12} /> Caso / Expediente {linkedCase && '(Vinculado)'} {!linkedCase && form.caseExternalRefText && '(Ref. temporal)'}
      </button>

      {expanded && (
        <div style={{ padding: '10px', backgroundColor: colors.bgPrimary, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
          {linkedCase ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary }}>{linkedCase.title || linkedCase.caseType}</div>
                  <div style={{ fontSize: '11px', color: colors.textMuted }}>
                    {linkedCase.externalRefs?.filter(r => r.value).map(r => `${r.system}: ${r.value}`).join(', ') || linkedCase.caseType}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {linkedCase.computed?.risk && <RiskBadge risk={linkedCase.computed.risk} colors={colors} />}
                  <button onClick={unlinkCase} style={{ padding: '4px 8px', fontSize: '11px', color: colors.danger, background: 'none', border: `1px solid ${colors.danger}44`, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Unlink size={11} /> Desvincular
                  </button>
                </div>
              </div>

              {/* Step type */}
              <div style={{ marginTop: '8px' }}>
                <label style={{ fontSize: '11px', color: colors.textMuted }}>Tipo de paso</label>
                <select style={{ ...inputStyle, marginTop: '4px' }} value={form.stepType || ''} onChange={e => setForm(f => ({ ...f, stepType: e.target.value || null }))}>
                  <option value="">— Sin tipo —</option>
                  {STEP_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div>
              {/* Búsqueda de caso */}
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                <input
                  type="text" placeholder="Buscar caso por título o expediente..."
                  style={{ ...inputStyle, paddingLeft: '28px' }}
                  value={caseSearch} onChange={e => setCaseSearch(e.target.value)}
                />
              </div>

              {/* Resultados */}
              {searchResults.length > 0 && (
                <div style={{ marginBottom: '8px' }}>
                  {searchResults.map(c => (
                    <div key={c.caseUid} onClick={() => linkCase(c)} style={{
                      padding: '6px 8px', marginBottom: '2px', borderRadius: '4px', cursor: 'pointer',
                      backgroundColor: colors.bgSecondary, border: `1px solid ${colors.border}`, fontSize: '12px',
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: colors.textPrimary }}>
                          <Link size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                          {c.title || c.caseType}
                        </span>
                        {c.computed?.risk && <RiskBadge risk={c.computed.risk} colors={colors} />}
                      </div>
                      {c.externalRefs?.filter(r => r.value).length > 0 && (
                        <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '2px' }}>
                          {c.externalRefs.filter(r => r.value).map(r => `${r.system}: ${r.value}`).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {caseSearch && searchResults.length === 0 && (
                <div style={{ fontSize: '11px', color: colors.textMuted, textAlign: 'center', padding: '4px' }}>Sin resultados</div>
              )}

              {/* Referencia temporal sin caso */}
              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '8px', marginTop: '4px' }}>
                <label style={{ fontSize: '11px', color: colors.textMuted }}>O referencia temporal (sin caso creado):</label>
                <input
                  type="text" placeholder="N° expediente pendiente de registro"
                  style={{ ...inputStyle, marginTop: '4px' }}
                  value={form.caseExternalRefText || ''}
                  onChange={e => setForm(f => ({ ...f, caseExternalRefText: e.target.value || null }))}
                />

                {/* List of existing temporal references */}
                {existingTempRefs.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <label style={{ fontSize: '11px', color: colors.textMuted, display: 'block', marginBottom: '4px' }}>Referencias temporales existentes:</label>
                    <div style={{ maxHeight: '120px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {existingTempRefs.map(({ ref, count }) => (
                        <div
                          key={ref}
                          onClick={() => selectTempRef(ref)}
                          style={{
                            padding: '5px 8px', borderRadius: '4px', cursor: 'pointer',
                            backgroundColor: form.caseExternalRefText === ref ? (colors.accent + '22') : colors.bgSecondary,
                            border: `1px solid ${form.caseExternalRefText === ref ? colors.accent : colors.border}`,
                            fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                          }}
                        >
                          <span style={{ color: colors.textPrimary }}><Clock size={10} style={{ marginRight: '4px', verticalAlign: 'middle', opacity: 0.6 }} />{ref}</span>
                          <span style={{ fontSize: '10px', color: colors.textMuted, backgroundColor: colors.bgTertiary, padding: '1px 6px', borderRadius: '8px' }}>{count} evento{count !== 1 ? 's' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { CasesModal, CaseLinkSection };

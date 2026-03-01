/**
 * BatchesManager.jsx — Gestión de Lotes (Fase 3)
 *
 * Componentes:
 *   - BatchesModal: modal principal con lista, detalle y formulario
 *   - BatchForm: formulario de creación/edición
 *   - BatchDetail: vista detalle con casos y tareas vinculadas
 *   - BatchLinkSection: sección para vincular lote en TaskFormModal
 */

import React, { useState, useMemo } from 'react';
import {
  Search, Plus, X, ChevronLeft, Save, Layers,
  Edit2, Trash2, Link, Unlink
} from 'lucide-react';
import { BATCH_STATUSES, CASE_STATUSES, RISK_LEVELS } from './schemas.js';

// ============================================================
// UTILIDADES LOCALES
// ============================================================

const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ============================================================
// FORMULARIO DE LOTE (crear / editar)
// ============================================================

const BatchForm = ({ batchData, cases, onSave, onCancel, colors }) => {
  const isNew = !batchData;
  const [form, setForm] = useState(() => {
    if (batchData) return { ...batchData, caseUids: [...(batchData.caseUids || [])] };
    return { title: '', status: 'abierto', caseUids: [], notes: '' };
  });
  const [caseSearch, setCaseSearch] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  // Cases available to add (not already in batch)
  const searchResults = useMemo(() => {
    if (!caseSearch.trim()) return [];
    const q = caseSearch.toLowerCase();
    return cases.filter(c =>
      !form.caseUids.includes(c.caseUid) && (
        c.title?.toLowerCase().includes(q) ||
        c.caseType?.toLowerCase().includes(q) ||
        c.externalRefs?.some(r => r.value?.toLowerCase().includes(q))
      )
    ).slice(0, 5);
  }, [caseSearch, cases, form.caseUids]);

  // Resolved case data for display
  const linkedCases = useMemo(() => {
    return form.caseUids.map(uid => cases.find(c => c.caseUid === uid)).filter(Boolean);
  }, [form.caseUids, cases]);

  const addCase = (c) => {
    setForm(f => ({ ...f, caseUids: [...f.caseUids, c.caseUid] }));
    setCaseSearch('');
  };

  const removeCase = (caseUid) => {
    setForm(f => ({ ...f, caseUids: f.caseUids.filter(uid => uid !== caseUid) }));
  };

  const handleSubmit = () => {
    const now = new Date().toISOString();
    const batchToSave = {
      ...form,
      updatedAt: now,
    };
    if (isNew) {
      batchToSave.batchUid = uuid();
      batchToSave.createdAt = now;
    }
    onSave(batchToSave);
  };

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontSize: '13px', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, marginBottom: '4px' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Título y estado */}
      <div>
        <label style={labelStyle}>Título del lote</label>
        <input type="text" style={inputStyle} value={form.title} onChange={e => set('title', e.target.value)} placeholder="Ej: Lote inspecciones Enero 2026" />
      </div>

      <div>
        <label style={labelStyle}>Estado</label>
        <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
          {BATCH_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Casos del lote */}
      <div>
        <label style={labelStyle}>Casos en este lote ({linkedCases.length})</label>

        {linkedCases.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
            {linkedCases.map(c => {
              const risk = c.computed?.risk || 'sin_fecha';
              const riskInfo = RISK_LEVELS[risk] || RISK_LEVELS.sin_fecha;
              return (
                <div key={c.caseUid} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '5px 8px', backgroundColor: colors.bgPrimary, borderRadius: '6px',
                  border: `1px solid ${colors.border}`, borderLeft: `3px solid ${riskInfo.color}`, fontSize: '12px'
                }}>
                  <span style={{ color: colors.textPrimary }}>{c.title || c.caseType}</span>
                  <button onClick={() => removeCase(c.caseUid)} style={{ padding: '2px', background: 'none', border: 'none', color: colors.danger, cursor: 'pointer' }}>
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Search to add case */}
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
          <input type="text" placeholder="Buscar caso para agregar..." style={{ ...inputStyle, paddingLeft: '28px' }} value={caseSearch} onChange={e => setCaseSearch(e.target.value)} />
        </div>
        {searchResults.length > 0 && (
          <div style={{ marginTop: '4px' }}>
            {searchResults.map(c => (
              <div key={c.caseUid} onClick={() => addCase(c)} style={{
                padding: '5px 8px', marginBottom: '2px', borderRadius: '4px', cursor: 'pointer',
                backgroundColor: colors.bgTertiary, border: `1px solid ${colors.border}`, fontSize: '12px', color: colors.textPrimary
              }}>
                <Link size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
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
        {caseSearch && searchResults.length === 0 && (
          <div style={{ fontSize: '11px', color: colors.textMuted, textAlign: 'center', padding: '4px' }}>Sin resultados</div>
        )}
      </div>

      {/* Notas */}
      <div>
        <label style={labelStyle}>Notas</label>
        <textarea style={{ ...inputStyle, height: '60px', resize: 'vertical' }} value={form.notes || ''} onChange={e => set('notes', e.target.value)} />
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
        <button onClick={onCancel} style={{ padding: '8px 16px', backgroundColor: 'transparent', border: 'none', color: colors.textMuted, cursor: 'pointer' }}>Cancelar</button>
        <button onClick={handleSubmit} style={{ padding: '8px 16px', backgroundColor: colors.success, color: colors.bgPrimary, fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Save size={14} /> {isNew ? 'Crear lote' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};

// ============================================================
// VISTA DETALLE DE LOTE
// ============================================================

const BatchDetail = ({ batchData, cases, tasks, onEdit, onBack, onDelete, colors }) => {
  const statusLabel = BATCH_STATUSES.find(s => s.value === batchData.status)?.label || batchData.status;

  const linkedCases = useMemo(() => {
    return (batchData.caseUids || []).map(uid => cases.find(c => c.caseUid === uid)).filter(Boolean);
  }, [batchData.caseUids, cases]);

  const linkedTasks = useMemo(() => {
    return (tasks || []).filter(t => t.batchUid === batchData.batchUid);
  }, [tasks, batchData.batchUid]);

  const sectionTitle = { fontSize: '13px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px', marginTop: '16px' };
  const rowStyle = { display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '12px', borderBottom: `1px solid ${colors.border}22` };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
        <button onClick={onBack} style={{ padding: '4px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><ChevronLeft size={18} /></button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: colors.textPrimary }}>{batchData.title || 'Lote sin nombre'}</div>
          <div style={{ fontSize: '11px', color: colors.textMuted }}>{statusLabel} — {linkedCases.length} caso{linkedCases.length !== 1 ? 's' : ''}</div>
        </div>
      </div>

      {/* Info */}
      <div style={rowStyle}>
        <span style={{ color: colors.textMuted }}>Creado</span>
        <span style={{ color: colors.textPrimary }}>{fmtDate(batchData.createdAt)}</span>
      </div>
      <div style={rowStyle}>
        <span style={{ color: colors.textMuted }}>Actualizado</span>
        <span style={{ color: colors.textPrimary }}>{fmtDate(batchData.updatedAt)}</span>
      </div>

      {/* Casos */}
      <div style={sectionTitle}>Casos ({linkedCases.length})</div>
      {linkedCases.length === 0 ? (
        <div style={{ fontSize: '12px', color: colors.textMuted, padding: '8px 0' }}>Ningún caso en este lote.</div>
      ) : (
        linkedCases.map(c => {
          const risk = c.computed?.risk || 'sin_fecha';
          const riskInfo = RISK_LEVELS[risk] || RISK_LEVELS.sin_fecha;
          const caseStatus = CASE_STATUSES.find(s => s.value === c.caseStatus)?.label || c.caseStatus;
          return (
            <div key={c.caseUid} style={{
              padding: '6px 8px', marginBottom: '4px', backgroundColor: colors.bgPrimary, borderRadius: '6px',
              border: `1px solid ${colors.border}`, borderLeft: `3px solid ${riskInfo.color}`, fontSize: '12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: colors.textPrimary, fontWeight: '600' }}>{c.title || c.caseType}</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '1px 6px', borderRadius: '10px', fontSize: '10px',
                  backgroundColor: riskInfo.color + '22', color: riskInfo.color
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: riskInfo.color }} />
                  {riskInfo.label}
                </span>
              </div>
              <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '2px' }}>
                {c.caseType} — {caseStatus}
                {c.computed?.effectiveMaxDueDate && <span> — Vence: {fmtDate(c.computed.effectiveMaxDueDate)}</span>}
              </div>
            </div>
          );
        })
      )}

      {/* Tareas asociadas al lote */}
      <div style={sectionTitle}>Tareas vinculadas ({linkedTasks.length})</div>
      {linkedTasks.length === 0 ? (
        <div style={{ fontSize: '12px', color: colors.textMuted, padding: '8px 0' }}>Ninguna tarea vinculada a este lote.</div>
      ) : (
        linkedTasks.map(t => (
          <div key={t.id} style={{ padding: '6px 8px', marginBottom: '4px', backgroundColor: colors.bgPrimary, borderRadius: '6px', border: `1px solid ${colors.border}`, fontSize: '12px' }}>
            <span style={{ color: colors.textPrimary }}>{t.activityTypeName} {t.subtipo ? `- ${t.subtipo}` : ''}</span>
            <span style={{ float: 'right', fontSize: '10px', color: colors.textMuted }}>{fmtDate(t.start)}</span>
          </div>
        ))
      )}

      {/* Notas */}
      {batchData.notes && (
        <>
          <div style={sectionTitle}>Notas</div>
          <div style={{ fontSize: '12px', color: colors.textSecondary, whiteSpace: 'pre-wrap' }}>{batchData.notes}</div>
        </>
      )}

      {/* Acciones */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
        <button onClick={() => onDelete(batchData.batchUid)} style={{ padding: '8px 14px', backgroundColor: colors.danger + '22', color: colors.danger, borderRadius: '6px', border: `1px solid ${colors.danger}44`, cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Trash2 size={13} /> Eliminar
        </button>
        <button onClick={() => onEdit(batchData)} style={{ padding: '8px 14px', backgroundColor: colors.accent, color: colors.bgPrimary, fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Edit2 size={13} /> Editar
        </button>
      </div>
    </div>
  );
};

// ============================================================
// MODAL PRINCIPAL DE LOTES
// ============================================================

const BatchesModalContent = ({ onClose, batches, cases, tasks, onSaveBatch, onDeleteBatch, colors, Modal }) => {
  const [view, setView] = useState('list');
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase();
    return batches.filter(b =>
      b.title?.toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  const sortedBatches = useMemo(() => {
    const statusOrder = { abierto: 0, en_progreso: 1, cerrado: 2 };
    return [...filteredBatches].sort((a, b) => {
      const sa = statusOrder[a.status] ?? 1;
      const sb = statusOrder[b.status] ?? 1;
      if (sa !== sb) return sa - sb;
      return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    });
  }, [filteredBatches]);

  const handleSave = (batchToSave) => {
    onSaveBatch(batchToSave);
    setView('list');
    setEditingBatch(null);
  };

  const handleDelete = (batchUid) => {
    if (confirm('¿Eliminar este lote? Los casos y tareas vinculados no se eliminarán.')) {
      onDeleteBatch(batchUid);
      setView('list');
      setSelectedBatch(null);
    }
  };

  const openDetail = (b) => { setSelectedBatch(b); setView('detail'); };
  const openEdit = (b) => { setEditingBatch(b); setView('form'); };
  const openNew = () => { setEditingBatch(null); setView('form'); };
  const goBack = () => { setView('list'); setSelectedBatch(null); setEditingBatch(null); };

  return (
    <Modal isOpen onClose={onClose} title="Lotes" size="lg" colors={colors}>
      {view === 'list' && (
        <div>
          {/* Barra de búsqueda + botón crear */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
              <input
                type="text" placeholder="Buscar lote..."
                style={{ width: '100%', padding: '8px 10px 8px 30px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontSize: '13px', boxSizing: 'border-box' }}
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <button onClick={openNew} style={{ padding: '8px 14px', backgroundColor: colors.success, color: colors.bgPrimary, fontWeight: 'bold', borderRadius: '6px', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', whiteSpace: 'nowrap' }}>
              <Plus size={14} /> Nuevo lote
            </button>
          </div>

          {/* Lista de lotes */}
          {sortedBatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted }}>
              <Layers size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div style={{ fontSize: '14px' }}>{searchQuery ? 'Sin resultados' : 'No hay lotes registrados'}</div>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>Crea tu primer lote con el botón "Nuevo lote"</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {sortedBatches.map(b => {
                const statusLabel = BATCH_STATUSES.find(s => s.value === b.status)?.label || b.status;
                const caseCount = (b.caseUids || []).length;
                const statusColor = b.status === 'cerrado' ? colors.textMuted : b.status === 'en_progreso' ? colors.accent : colors.success;

                return (
                  <div key={b.batchUid} onClick={() => openDetail(b)} style={{
                    padding: '10px 12px', borderRadius: '8px', border: `1px solid ${colors.border}`,
                    borderLeft: `4px solid ${statusColor}`,
                    backgroundColor: colors.bgPrimary, cursor: 'pointer'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary }}>{b.title || 'Lote sin nombre'}</div>
                        <div style={{ fontSize: '11px', color: colors.textMuted, marginTop: '2px' }}>
                          {caseCount} caso{caseCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <span style={{
                        padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                        backgroundColor: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44`
                      }}>
                        {statusLabel}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {batches.length > 0 && (
            <div style={{ marginTop: '12px', padding: '8px', fontSize: '11px', color: colors.textMuted, textAlign: 'center' }}>
              {batches.length} lote{batches.length !== 1 ? 's' : ''} total{batches.length !== 1 ? 'es' : ''}
            </div>
          )}
        </div>
      )}

      {view === 'detail' && selectedBatch && (
        <BatchDetail
          batchData={selectedBatch}
          cases={cases}
          tasks={tasks}
          onEdit={openEdit}
          onBack={goBack}
          onDelete={handleDelete}
          colors={colors}
        />
      )}

      {view === 'form' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <button onClick={goBack} style={{ padding: '4px', background: 'none', border: 'none', color: colors.textMuted, cursor: 'pointer' }}><ChevronLeft size={18} /></button>
            <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>{editingBatch ? 'Editar lote' : 'Nuevo lote'}</span>
          </div>
          <BatchForm
            batchData={editingBatch}
            cases={cases}
            onSave={handleSave}
            onCancel={goBack}
            colors={colors}
          />
        </div>
      )}
    </Modal>
  );
};


const BatchesModal = (props) => {
  if (!props.isOpen) return null;
  return <BatchesModalContent {...props} />;
};

// ============================================================
// SECCIÓN DE VINCULACIÓN DE LOTE EN TASKFORMMODAL
// ============================================================

const BatchLinkSection = ({ form, setForm, batches, colors }) => {
  const [expanded, setExpanded] = useState(false);
  const [batchSearch, setBatchSearch] = useState('');

  const linkedBatch = useMemo(() => {
    if (!form.batchUid) return null;
    return batches.find(b => b.batchUid === form.batchUid) || null;
  }, [form.batchUid, batches]);

  const searchResults = useMemo(() => {
    if (!batchSearch.trim()) return [];
    const q = batchSearch.toLowerCase();
    return batches.filter(b =>
      b.title?.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [batchSearch, batches]);

  const linkBatch = (b) => {
    setForm(f => ({ ...f, batchUid: b.batchUid }));
    setBatchSearch('');
  };

  const unlinkBatch = () => {
    setForm(f => ({ ...f, batchUid: null }));
  };

  const inputStyle = { width: '100%', padding: '8px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: colors.bgPrimary, color: colors.textPrimary, fontSize: '13px', boxSizing: 'border-box' };

  return (
    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px' }}>
      <button onClick={() => setExpanded(!expanded)} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: colors.textMuted, backgroundColor: 'transparent', border: 'none', cursor: 'pointer', marginBottom: '8px' }}>
        <Layers size={12} /> Lote {linkedBatch && '(Vinculado)'}
      </button>

      {expanded && (
        <div style={{ padding: '10px', backgroundColor: colors.bgPrimary, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
          {linkedBatch ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary }}>{linkedBatch.title || 'Lote sin nombre'}</div>
                <div style={{ fontSize: '11px', color: colors.textMuted }}>
                  {BATCH_STATUSES.find(s => s.value === linkedBatch.status)?.label || linkedBatch.status} — {(linkedBatch.caseUids || []).length} caso(s)
                </div>
              </div>
              <button onClick={unlinkBatch} style={{ padding: '4px 8px', fontSize: '11px', color: colors.danger, background: 'none', border: `1px solid ${colors.danger}44`, borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Unlink size={11} /> Desvincular
              </button>
            </div>
          ) : (
            <div>
              <div style={{ position: 'relative', marginBottom: '8px' }}>
                <Search size={13} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: colors.textMuted }} />
                <input
                  type="text" placeholder="Buscar lote..."
                  style={{ ...inputStyle, paddingLeft: '28px' }}
                  value={batchSearch} onChange={e => setBatchSearch(e.target.value)}
                />
              </div>

              {searchResults.length > 0 && (
                <div style={{ marginBottom: '4px' }}>
                  {searchResults.map(b => {
                    const statusLabel = BATCH_STATUSES.find(s => s.value === b.status)?.label || b.status;
                    return (
                      <div key={b.batchUid} onClick={() => linkBatch(b)} style={{
                        padding: '6px 8px', marginBottom: '2px', borderRadius: '4px', cursor: 'pointer',
                        backgroundColor: colors.bgSecondary, border: `1px solid ${colors.border}`, fontSize: '12px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: colors.textPrimary }}>
                            <Link size={10} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                            {b.title || 'Lote sin nombre'}
                          </span>
                          <span style={{ fontSize: '10px', color: colors.textMuted }}>{statusLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {batchSearch && searchResults.length === 0 && (
                <div style={{ fontSize: '11px', color: colors.textMuted, textAlign: 'center', padding: '4px' }}>Sin resultados</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { BatchesModal, BatchLinkSection };

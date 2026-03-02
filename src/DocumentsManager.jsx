import React, { useState, useMemo, useRef } from 'react';
import { X, Upload, Download, Trash2, RefreshCw, FileText, ChevronDown, ChevronRight, Search, AlertCircle } from 'lucide-react';
import { DOC_TYPES } from './schemas.js';

const fmtDate = (iso) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso.includes('T') ? iso : iso + 'T00:00:00');
    return d.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return '—'; }
};

const fmtFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
};

// ============================================================
// DOCUMENTS MODAL (main app — full CRUD)
// ============================================================

export function DocumentsModal({ isOpen, onClose, documents, onUpload, onDelete, onReplace, colors, isOffline }) {
  const [view, setView] = useState('list');
  const [uploadForm, setUploadForm] = useState({ docType: '', periodStart: '', periodEnd: '', file: null });
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [expandedTypes, setExpandedTypes] = useState({ teletrabajo: true, programacion_ejecucion: true, comprobantes: true });
  const [replaceTarget, setReplaceTarget] = useState(null);
  const replaceInputRef = useRef(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const safeDocs = (documents || []).filter(d => d && typeof d === 'object');

  const grouped = {};
  DOC_TYPES.forEach(t => { grouped[t.value] = []; });
  safeDocs.forEach(d => {
    if (grouped[d.docType]) grouped[d.docType].push(d);
  });
  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a, b) => (a.periodStart || '').localeCompare(b.periodStart || ''));
  });

  const toggleType = (type) => {
    setExpandedTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError('El archivo no puede exceder 10 MB.');
        return;
      }
      setError('');
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.docType || !uploadForm.periodStart || !uploadForm.periodEnd || !uploadForm.file) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    if (uploadForm.periodStart > uploadForm.periodEnd) {
      setError('La fecha de inicio no puede ser posterior a la fecha final.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      await onUpload(uploadForm.docType, uploadForm.periodStart, uploadForm.periodEnd, uploadForm.file);
      setUploadForm({ docType: '', periodStart: '', periodEnd: '', file: null });
      if (fileInputRef.current) fileInputRef.current.value = '';
      setView('list');
    } catch (err) {
      console.error('Error uploading document:', err);
      if (err?.message?.includes('CORS') || err?.message?.includes('Failed to fetch')) {
        setError('Error de CORS/red. Verifique la configuración de Firebase Storage.');
      } else {
        setError('Error al subir el documento: ' + (err?.message || 'desconocido'));
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`¿Eliminar "${doc.fileName}"? Esta acción no se puede deshacer.`)) return;
    try {
      await onDelete(doc);
    } catch (err) {
      console.error('Error deleting document:', err);
      setError('Error al eliminar: ' + (err?.message || 'desconocido'));
    }
  };

  const handleReplaceClick = (doc) => {
    setReplaceTarget(doc);
    setTimeout(() => replaceInputRef.current?.click(), 50);
  };

  const handleReplaceFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !replaceTarget) return;
    if (file.type !== 'application/pdf') {
      setError('Solo se permiten archivos PDF.');
      setReplaceTarget(null);
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo no puede exceder 10 MB.');
      setReplaceTarget(null);
      return;
    }
    setUploading(true);
    setError('');
    try {
      await onReplace(replaceTarget, file);
    } catch (err) {
      console.error('Error replacing document:', err);
      setError('Error al reemplazar: ' + (err?.message || 'desconocido'));
    } finally {
      setUploading(false);
      setReplaceTarget(null);
      if (replaceInputRef.current) replaceInputRef.current.value = '';
    }
  };

  const handleDownload = (doc) => {
    const a = document.createElement('a');
    a.href = doc.downloadURL;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = doc.fileName || 'documento.pdf';
    a.click();
  };

  const inputStyle = { width: '100%', backgroundColor: colors.bgPrimary, border: `1px solid ${colors.border}`, borderRadius: '6px', padding: '10px', color: colors.textPrimary, fontSize: '13px', boxSizing: 'border-box' };
  const selectStyle = { ...inputStyle, cursor: 'pointer' };
  const btnPrimary = { padding: '10px 20px', backgroundColor: colors.accent, color: colors.bgPrimary, border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' };
  const btnSecondary = { padding: '8px 14px', backgroundColor: colors.bgTertiary, color: colors.textSecondary, border: `1px solid ${colors.border}`, borderRadius: '6px', cursor: 'pointer', fontSize: '13px' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', backgroundColor: colors.bgSecondary, borderRadius: '12px', border: `1px solid ${colors.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${colors.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={20} color={colors.accent} />
            <h2 style={{ margin: 0, fontSize: '16px', color: colors.textPrimary }}>Documentos</h2>
            <span style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.bgTertiary, padding: '2px 8px', borderRadius: '10px' }}>{safeDocs.length}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {view === 'list' && (
              <button onClick={() => { setView('upload'); setError(''); }} style={btnPrimary} disabled={isOffline}>
                <Upload size={14} /> Subir documento
              </button>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: colors.textMuted, padding: '4px' }}><X size={20} /></button>
          </div>
        </div>

        {/* Hidden replace input */}
        <input type="file" accept=".pdf" ref={replaceInputRef} style={{ display: 'none' }} onChange={handleReplaceFile} />

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {error && (
            <div style={{ padding: '10px 14px', backgroundColor: `${colors.danger}15`, border: `1px solid ${colors.danger}40`, borderRadius: '8px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: colors.danger }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {isOffline && view === 'upload' && (
            <div style={{ padding: '10px 14px', backgroundColor: `${colors.warning}15`, border: `1px solid ${colors.warning}40`, borderRadius: '8px', marginBottom: '14px', fontSize: '12px', color: colors.warning }}>
              No es posible subir documentos sin conexión.
            </div>
          )}

          {/* ====== UPLOAD FORM ====== */}
          {view === 'upload' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <button onClick={() => { setView('list'); setError(''); }} style={{ ...btnSecondary, padding: '6px 10px' }}>
                  &larr; Volver
                </button>
                <h3 style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>Subir nuevo documento</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Tipo de documento *</label>
                  <select value={uploadForm.docType} onChange={e => setUploadForm(prev => ({ ...prev, docType: e.target.value }))} style={selectStyle}>
                    <option value="">Seleccionar tipo...</option>
                    {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Fecha inicio del período *</label>
                    <input type="date" value={uploadForm.periodStart} onChange={e => setUploadForm(prev => ({ ...prev, periodStart: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Fecha final del período *</label>
                    <input type="date" value={uploadForm.periodEnd} onChange={e => setUploadForm(prev => ({ ...prev, periodEnd: e.target.value }))} style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>Archivo PDF * (máx. 10 MB)</label>
                  <div style={{ border: `2px dashed ${colors.border}`, borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer', backgroundColor: colors.bgPrimary, transition: 'border-color 0.2s' }} onClick={() => fileInputRef.current?.click()}>
                    <input type="file" accept=".pdf" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                    {uploadForm.file ? (
                      <div>
                        <FileText size={24} color={colors.accent} style={{ marginBottom: '6px' }} />
                        <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary }}>{uploadForm.file.name}</div>
                        <div style={{ fontSize: '11px', color: colors.textMuted }}>{fmtFileSize(uploadForm.file.size)}</div>
                      </div>
                    ) : (
                      <div>
                        <Upload size={24} color={colors.textMuted} style={{ marginBottom: '6px' }} />
                        <div style={{ fontSize: '13px', color: colors.textMuted }}>Haga clic para seleccionar un archivo PDF</div>
                      </div>
                    )}
                  </div>
                </div>

                <button onClick={handleUpload} disabled={uploading || isOffline} style={{ ...btnPrimary, justifyContent: 'center', opacity: (uploading || isOffline) ? 0.6 : 1 }}>
                  {uploading ? 'Subiendo...' : 'Subir documento'}
                </button>
              </div>
            </div>
          )}

          {/* ====== DOCUMENT LIST ====== */}
          {view === 'list' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {safeDocs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: colors.textMuted }}>
                  <FileText size={40} style={{ marginBottom: '10px', opacity: 0.4 }} />
                  <div style={{ fontSize: '14px', marginBottom: '4px' }}>No hay documentos</div>
                  <div style={{ fontSize: '12px' }}>Use el botón "Subir documento" para agregar archivos PDF.</div>
                </div>
              )}

              {DOC_TYPES.map(docType => {
                const docs = grouped[docType.value] || [];
                const isExpanded = expandedTypes[docType.value];
                return (
                  <div key={docType.value} style={{ borderRadius: '8px', border: `1px solid ${colors.border}`, overflow: 'hidden' }}>
                    <button onClick={() => toggleType(docType.value)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', backgroundColor: colors.bgTertiary, border: 'none', cursor: 'pointer', color: colors.textPrimary }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' }}>
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        {docType.label}
                      </div>
                      <span style={{ fontSize: '11px', color: colors.textMuted, backgroundColor: colors.bgPrimary, padding: '2px 8px', borderRadius: '10px' }}>{docs.length}</span>
                    </button>

                    {isExpanded && (
                      <div style={{ padding: docs.length > 0 ? '8px' : '0' }}>
                        {docs.length === 0 && (
                          <div style={{ padding: '14px', textAlign: 'center', fontSize: '12px', color: colors.textMuted }}>Sin documentos de este tipo.</div>
                        )}
                        {docs.map(d => (
                          <div key={d.docUid} style={{ padding: '10px 12px', borderRadius: '6px', border: `1px solid ${colors.border}`, marginBottom: '6px', backgroundColor: colors.bgPrimary }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {String(d.fileName || 'documento.pdf')}
                                </div>
                                <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '3px' }}>
                                  Período: {fmtDate(d.periodStart)} — {fmtDate(d.periodEnd)}
                                </div>
                                <div style={{ fontSize: '10px', color: colors.textMuted, marginTop: '2px' }}>
                                  {fmtFileSize(d.fileSize)} &middot; Subido: {fmtDate(d.uploadedAt?.split('T')[0])}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                                <button onClick={() => handleDownload(d)} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: colors.accent }} title="Descargar">
                                  <Download size={16} />
                                </button>
                                <button onClick={() => handleReplaceClick(d)} disabled={isOffline} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: colors.warning, opacity: isOffline ? 0.4 : 1 }} title="Reemplazar">
                                  <RefreshCw size={16} />
                                </button>
                                <button onClick={() => handleDelete(d)} disabled={isOffline} style={{ padding: '6px', borderRadius: '4px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: colors.danger, opacity: isOffline ? 0.4 : 1 }} title="Eliminar">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Uploading overlay */}
        {uploading && (
          <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px', zIndex: 2 }}>
            <div style={{ backgroundColor: colors.bgSecondary, padding: '24px 32px', borderRadius: '10px', textAlign: 'center', border: `1px solid ${colors.border}` }}>
              <div style={{ animation: 'spin 1s linear infinite', display: 'inline-block', marginBottom: '8px' }}><RefreshCw size={24} color={colors.accent} /></div>
              <div style={{ fontSize: '13px', color: colors.textPrimary }}>Procesando...</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

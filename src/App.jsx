import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Clock, CheckCircle, PauseCircle, PlayCircle, 
  Plus, X, Menu, Trash2, Filter, AlertTriangle, Settings, Edit2,
  Bell, FileText, FileSpreadsheet, Calendar, Flag, Leaf, LogOut,
  Sun, Star, Repeat, GripVertical, Search, Car, CreditCard, Database, EyeOff,
  Moon, Wifi, WifiOff, Upload, Download, ArrowRightCircle, Save, CalendarPlus,
  DollarSign, Lock, Unlock, TrendingUp, AlertCircle, PieChart, BarChart3, MapPin,
  User, Phone, Map, ExternalLink, Copy, RefreshCw, CheckCheck, Briefcase, Layers, RotateCcw
} from 'lucide-react';

import XLSX from 'xlsx-js-style';

// --- FIREBASE IMPORTS ---
import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, collection, doc, setDoc, addDoc, deleteDoc, updateDoc, onSnapshot, query, writeBatch, where, getDocs, getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadString, uploadBytes, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { CasesModal, CaseLinkSection } from './CasesManager.jsx';
import { BatchesModal, BatchLinkSection } from './BatchesManager.jsx';
import { DocumentsModal } from './DocumentsManager.jsx';

// --- DATA SEMILLA (CONSTANTES) ---
const APP_VERSION = '2026.03.20.1';

const PAYMENTS_2026 = [
  { date: '2026-01-13', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-01-23', name: 'Salario Escolar', type: 'payment', special: true }, { date: '2026-01-28', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-02-13', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-02-25', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-03-13', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-03-26', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-04-14', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-04-27', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-05-14', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-05-27', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-06-12', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-06-26', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-07-14', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-07-28', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-08-14', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-08-26', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-09-14', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-09-28', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-10-14', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-10-28', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-11-13', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-11-26', name: 'Pago Salario IIQ', type: 'payment' },
  { date: '2026-12-04', name: 'Aguinaldo', type: 'payment', special: true }, { date: '2026-12-14', name: 'Pago Salario IQ', type: 'payment' }, { date: '2026-12-24', name: 'Pago Salario IIQ', type: 'payment' }
];

const HOLIDAYS_CR_2026 = [
  { date: '2026-01-01', name: 'Año Nuevo', type: 'holiday', description: 'Inicio de año calendario.', legalNorm: 'Código de Trabajo' },
  { date: '2026-04-09', name: 'Jueves Santo', type: 'holiday', description: 'Feriado religioso.', legalNorm: 'Código de Trabajo' },
  { date: '2026-04-10', name: 'Viernes Santo', type: 'holiday', description: 'Feriado religioso.', legalNorm: 'Código de Trabajo' },
  { date: '2026-04-11', name: 'Batalla de Rivas', type: 'holiday', description: 'Conmemoración de la gesta heroica de 1856.', legalNorm: 'Ley 6996' },
  { date: '2026-05-01', name: 'Día del Trabajador', type: 'holiday', description: 'Día Internacional de los Trabajadores.', legalNorm: 'Código de Trabajo' },
  { date: '2026-07-25', name: 'Anexión de Nicoya', type: 'holiday', description: 'Incorporación de Guanacaste a Costa Rica.', legalNorm: 'Ley 6996' },
  { date: '2026-08-02', name: 'Virgen de los Ángeles', type: 'holiday', description: 'Patrona de Costa Rica.', legalNorm: 'Ley 6996' },
  { date: '2026-08-15', name: 'Día de la Madre', type: 'holiday', description: 'Celebración nacional.', legalNorm: 'Ley 6996' },
  { date: '2026-09-15', name: 'Independencia Patria', type: 'holiday', description: '197 años de vida independiente.', legalNorm: 'Ley 6996' },
  { date: '2026-12-01', name: 'Abolición del Ejército', type: 'holiday', description: 'Hito histórico de paz.', legalNorm: 'Ley 9803' },
  { date: '2026-12-25', name: 'Navidad', type: 'holiday', description: 'Celebración navideña.', legalNorm: 'Código de Trabajo' }
];

const EFEMERIDES_2026 = [
  { date: '2026-02-02', name: 'Día de los Humedales', type: 'efemeride', category: 'ambiental', description: 'Conciencia sobre la importancia de los ecosistemas húmedos.' },
  { date: '2026-03-21', name: 'Día de los Bosques', type: 'efemeride', category: 'ambiental', description: 'Protección de la cobertura forestal.' },
  { date: '2026-03-22', name: 'Día Mundial del Agua', type: 'efemeride', category: 'ambiental', description: 'Gestión sostenible de los recursos hídricos.' },
  { date: '2026-04-22', name: 'Día de la Tierra', type: 'efemeride', category: 'ambiental', description: 'Cuidado del planeta.' },
  { date: '2026-06-05', name: 'Día del Ambiente', type: 'efemeride', category: 'ambiental', description: 'Acción global por el medio ambiente.' },
  { date: '2026-03-20', name: 'Equinoccio de Marzo', type: 'astro', time: '08:46', description: 'El Sol cruza el ecuador celeste hacia el norte.' },
  { date: '2026-06-21', name: 'Solsticio de Junio', type: 'astro', time: '03:24', description: 'El Sol alcanza su máxima declinación norte.' },
  { date: '2026-03-03', name: 'Eclipse Lunar Total', type: 'astro_event', time: '02:45 - 06:15', description: 'Visibilidad MUY ALTA.', location: 'Guanacaste, Nicoya' },
  { date: '2026-08-12', name: 'Lluvia de Meteoros Perseidas', type: 'astro_event', time: 'Pico 00:30', description: 'Visibilidad MEDIA-ALTA.', location: 'Nicoya norte' }
];

const MOON_PHASES_2026 = [
  { date: '2026-01-03', name: 'Luna Llena', type: 'moon', icon: '🌕' }, { date: '2026-01-10', name: 'Cuarto Menguante', type: 'moon', icon: '🌗' }, { date: '2026-01-18', name: 'Luna Nueva', type: 'moon', icon: '🌑' }, { date: '2026-01-25', name: 'Cuarto Creciente', type: 'moon', icon: '🌓' },
  { date: '2026-02-01', name: 'Luna Llena', type: 'moon', icon: '🌕' }, { date: '2026-02-17', name: 'Luna Nueva', type: 'moon', icon: '🌑' },
  { date: '2026-03-03', name: 'Luna Llena', type: 'moon', icon: '🌕' }, { date: '2026-03-18', name: 'Luna Nueva', type: 'moon', icon: '🌑' },
  { date: '2026-04-01', name: 'Luna Llena', type: 'moon', icon: '🌕' }, { date: '2026-04-17', name: 'Luna Nueva', type: 'moon', icon: '🌑' },
  { date: '2026-05-01', name: 'Luna Llena', type: 'moon', icon: '🌕' }, { date: '2026-05-16', name: 'Luna Nueva', type: 'moon', icon: '🌑' }, { date: '2026-05-31', name: 'Luna Llena', type: 'moon', icon: '🌕' },
  { date: '2026-06-14', name: 'Luna Nueva', type: 'moon', icon: '🌑' }, { date: '2026-06-29', name: 'Luna Llena', type: 'moon', icon: '🌕' }
];

const SUBTIPOS_FORESTALES = ['Permiso Pequeño', 'Inventario Forestal', 'Certificado de Origen', 'Plan de Manejo', 'Determinación de Bosque', 'Determinación de Humedal', 'Clasificación de Predio', 'Visado', 'Certificación de plano', 'Régimen Forestal', 'Denuncia Ambiental', 'Análisis de Proyecto', 'Otro'];
const SUBTIPOS_RESOLUCION = ['Permiso Pequeño', 'Inventario Forestal', 'Certificado de Origen', 'Plan de Manejo', 'Régimen Forestal', 'Visado de Plano'];

const DEFAULT_ACTIVITY_TYPES = [
  { id: 1, name: 'Redacción de Informe', color: '#2ECC71', subtypes: [...SUBTIPOS_FORESTALES, 'SICAF - PP', 'SIFAC - IF', 'SICAF - CO', 'SICAF - Informe técnico PyG', 'SICAF - Informe analista PyG', 'Informe de patio', 'Coordinación para entrega PyG'], fields: ['informe'], logistics: true },
  { id: 2, name: 'Redacción de Resolución', color: '#27AE60', subtypes: SUBTIPOS_RESOLUCION, fields: ['informe'] },
  { id: 3, name: 'Inspección', color: '#E67E22', subtypes: [...SUBTIPOS_FORESTALES, 'Inventario de patio', 'Supervisión'], fields: ['informe', 'asistentes'], logistics: true },
  { id: 4, name: 'Revisión de Correos', color: '#3498DB', subtypes: [], fields: [] },
  { id: 5, name: 'Comunicaciones', color: '#9B59B6', subtypes: ['Llamada telefónica', 'Mensaje de Whatsapp'], fields: ['nombre', 'cedula', 'tema'] },
  { id: 6, name: 'Revisión de Documentos', color: '#1ABC9C', subtypes: [], fields: ['informe'] },
  { id: 7, name: 'Manejo de Expediente', color: '#16A085', subtypes: [], fields: ['informe'] },
  { id: 8, name: 'Gestión Administrativa', color: '#F39C12', subtypes: ['Viáticos', 'Informe PP', 'Informe SEMEC', 'Programación', 'Informe labores', 'Control interno'], fields: [] },
  { id: 9, name: 'Recursos Humanos', color: '#E74C3C', subtypes: ['Boleta vacaciones', 'Evaluación desempeño', 'Otras'], fields: ['boleta'] },
  { id: 10, name: 'Colaboración', color: '#8E44AD', subtypes: [], fields: ['informe', 'asistentes', 'lugar'], logistics: true },
  { id: 11, name: 'Reunión', color: '#2980B9', subtypes: [], fields: ['tema', 'minuta', 'asistentes', 'lugar'], logistics: true },
  { id: 12, name: 'Capacitación', color: '#D35400', subtypes: [], fields: ['tema', 'lugar'], logistics: true },
  { id: 13, name: 'Otro', color: '#7F8C8D', subtypes: [], fields: ['informe', 'asistentes'], logistics: true },
  { id: 14, name: 'Vacaciones', color: '#00CED1', subtypes: [], fields: ['boleta'] },
  { id: 15, name: 'Licencia Ocasional', color: '#20B2AA', subtypes: [], fields: ['boleta'] },
  { id: 16, name: 'Cita Médica', color: '#FF6B6B', subtypes: ['Ebais - Medicina general','Ebais - Odontología','Retiro de medicamentos','IAFA - Medicina','IAFA - Psicología','CCSS - Psicología','CCSS - Psiquiatría','Medicina Privada','Emergencias','Vascular periférico','Otra'], fields: [] },
  { id: 17, name: 'Incapacidad', color: '#C0392B', subtypes: [], fields: [] },
  { id: 18, name: 'Cumpleaños', color: '#FF69B4', subtypes: [], fields: ['nombreCumple'] },
  { id: 19, name: 'Receso', color: '#A0522D', subtypes: ['Café', 'Almuerzo', 'Pausa activa', 'Otro'], fields: [] },
  { id: 20, name: 'Trabajo de oficina', color: '#4A90D9', subtypes: [], fields: [] }
];

// --- MONTOS POR DEFECTO ACTUALIZADOS ---
const DEFAULT_VIATICUM_RATES = { breakfast: 4200, lunch: 5600, dinner: 5600, lodging: 25000 };
const DEFAULT_MONTHLY_BUDGET = 16800;

// --- TARIFAS DE HOSPEDAJE POR DEFECTO (CARGADAS DESDE ARCHIVO) ---
const DEFAULT_LODGING_RATES = [
  { provincia: 'San José', canton: 'Puriscal', distritos: ['Barbacoas', 'Candelarita', 'Chires', 'Desamparaditos', 'Grifo Alto', 'Mercedes Sur', 'San Antonio', 'San Rafael', 'Santiago'], monto: 16100 },
  { provincia: 'Alajuela', canton: 'Atenas', distritos: ['Atenas', 'Concepción', 'Escobal', 'Jesús', 'Mercedes', 'San Isidro', 'San José', 'Santa Eulalia'], monto: 20100 },
  { provincia: 'Puntarenas', canton: 'Garabito', distritos: ['Jacó', 'Lagunillas', 'Tárcoles'], monto: 25400 },
  { provincia: 'Puntarenas', canton: 'Quepos', distritos: ['Quepos', 'Naranjito', 'Savegre'], monto: 25400 }
];

// --- CÓDIGOS PP POR DEFECTO ---
const DEFAULT_PP_CODES = [
    { code: 'PPI-17-E18', description: 'Consolidar el rol de las OSR como la unidad territorial de gestión y uso sostenible de los recursos de la biodiversidad en los paisajes (urbano, rural y marino-costero) del país.' }
];

// --- DATOS DE UBICACIÓN PARA COSTA RICA ---
const PROVINCIAS_CR = [
  {
    provincia: 'San José',
    cantones: [
      { canton: 'San José', distritos: ['Carmen', 'Merced', 'Hospital', 'Catedral', 'Zapote', 'San Francisco de Dos Ríos', 'Uruca', 'Mata Redonda', 'Pavas', 'Hatillo', 'San Sebastián'] },
      { canton: 'Escazú', distritos: ['Escazú', 'San Antonio', 'San Rafael'] },
      { canton: 'Desamparados', distritos: ['Desamparados', 'San Miguel', 'San Juan de Dios', 'San Rafael Arriba', 'San Rafael Abajo', 'San Antonio', 'Frailes', 'Patarrá', 'San Cristóbal', 'Rosario', 'Damas', 'San Rafael', 'Gravilias', 'Los Guido'] },
      { canton: 'Puriscal', distritos: ['Santiago', 'Mercedes Sur', 'Barbacoas', 'Grifo Alto', 'San Rafael', 'Candelarita', 'Desamparaditos', 'San Antonio', 'Chires'] },
      { canton: 'Tarrazú', distritos: ['San Marcos', 'San Lorenzo', 'San Carlos'] },
      { canton: 'Aserrí', distritos: ['Aserrí', 'Tarbaca', 'Vuelta de Jorco', 'San Gabriel', 'Legua', 'Monterrey', 'Salitrillos'] },
      { canton: 'Mora', distritos: ['Colón', 'Guayabo', 'Tabarcia', 'Piedras Negras', 'Picagres', 'Jaris'] },
      { canton: 'Goicoechea', distritos: ['Guadalupe', 'San Francisco', 'Calle Blancos', 'Mata de Plátano', 'Ipís', 'Rancho Redondo', 'Purral'] },
      { canton: 'Santa Ana', distritos: ['Santa Ana', 'Salitral', 'Pozos', 'Uruca', 'Piedades', 'Brasil'] },
      { canton: 'Alajuelita', distritos: ['Alajuelita', 'San Josecito', 'San Antonio', 'Concepción', 'San Felipe'] },
      { canton: 'Vázquez de Coronado', distritos: ['San Isidro', 'San Rafael', 'Dulce Nombre de Jesús', 'Patalillo', 'Cascajal'] },
      { canton: 'Acosta', distritos: ['San Ignacio', 'Guaitil', 'Palmichal', 'Cangrejal', 'Sabanillas'] },
      { canton: 'Tibás', distritos: ['San Juan', 'Cinco Esquinas', 'Anselmo Llorente', 'León XIII', 'Colima'] },
      { canton: 'Moravia', distritos: ['San Vicente', 'San Jerónimo', 'La Trinidad'] },
      { canton: 'Montes de Oca', distritos: ['San Pedro', 'Sabanilla', 'Mercedes', 'San Rafael'] },
      { canton: 'Turrubares', distritos: ['San Pablo', 'San Pedro', 'San Juan de Mata', 'San Luis', 'Carara'] },
      { canton: 'Dota', distritos: ['Santa María', 'Jardín', 'Copey'] },
      { canton: 'Curridabat', distritos: ['Curridabat', 'Granadilla', 'Sánchez', 'Tirrases'] },
      { canton: 'Pérez Zeledón', distritos: ['San Isidro de El General', 'El General', 'Daniel Flores', 'Rivas', 'San Pedro', 'Platanares', 'Pejibaye', 'Cajón', 'Barú', 'Río Nuevo', 'Páramo', 'La Amistad'] },
      { canton: 'León Cortés Castro', distritos: ['San Pablo', 'San Andrés', 'Llano Bonito', 'San Isidro', 'Santa Cruz', 'San Antonio'] }
    ]
  },
  {
    provincia: 'Alajuela',
    cantones: [
      { canton: 'Alajuela', distritos: ['Alajuela', 'San José', 'Carrizal', 'San Antonio', 'Guácima', 'San Isidro', 'Sabanilla', 'San Rafael', 'Río Segundo', 'Desamparados', 'Turrúcares', 'Tambor', 'Garita', 'Sarapiquí'] },
      { canton: 'San Ramón', distritos: ['San Ramón', 'Santiago', 'San Juan', 'Piedades Norte', 'Piedades Sur', 'San Rafael', 'San Isidro', 'Ángeles', 'Alfaro', 'Volio', 'Concepción', 'Zapotal', 'Peñas Blancas', 'San Lorenzo'] },
      { canton: 'Grecia', distritos: ['Grecia', 'San Isidro', 'San José', 'San Roque', 'Tacares', 'Río Cuarto', 'Puente de Piedra', 'Bolívar'] },
      { canton: 'San Mateo', distritos: ['San Mateo', 'Desmonte', 'Jesús María', 'Labrador'] },
      { canton: 'Atenas', distritos: ['Atenas', 'Jesús', 'Mercedes', 'San Isidro', 'Concepción', 'San José', 'Santa Eulalia', 'Escobal'] },
      { canton: 'Naranjo', distritos: ['Naranjo', 'San Miguel', 'San José', 'Cirrí Sur', 'San Jerónimo', 'San Juan', 'El Rosario', 'Palmitos'] },
      { canton: 'Palmares', distritos: ['Palmares', 'Zaragoza', 'Buenos Aires', 'Santiago', 'Candelaria', 'Esquipulas', 'La Granja'] },
      { canton: 'Poás', distritos: ['San Pedro', 'San Juan', 'San Rafael', 'Carrillos', 'Sabana Redonda'] },
      { canton: 'Orotina', distritos: ['Orotina', 'El Mastate', 'Hacienda Vieja', 'Coyolar', 'La Ceiba'] },
      { canton: 'San Carlos', distritos: ['Quesada', 'Florencia', 'Buena Vista', 'Aguas Zarcas', 'Venecia', 'Pital', 'La Fortuna', 'La Tigra', 'La Palmera', 'Venado', 'Cutris', 'Monterrey', 'Pocosol', 'Cerro Cortés'] },
      { canton: 'Zarcero', distritos: ['Zarcero', 'Laguna', 'Tapezco', 'Guadalupe', 'Palmira', 'Zapote', 'Brisas'] },
      { canton: 'Sarchí', distritos: ['Sarchí Norte', 'Sarchí Sur', 'Toro Amarillo', 'San Pedro', 'Rodríguez'] },
      { canton: 'Upala', distritos: ['Upala', 'Aguas Claras', 'San José', 'Bijagua', 'Delicias', 'Dos Ríos', 'Yolillal', 'Canalete'] },
      { canton: 'Los Chiles', distritos: ['Los Chiles', 'Caño Negro', 'El Amparo', 'San Jorge'] },
      { canton: 'Guatuso', distritos: ['San Rafael', 'Buenavista', 'Cote', 'Katira'] }
    ]
  },
  {
    provincia: 'Cartago',
    cantones: [
      { canton: 'Cartago', distritos: ['Oriental', 'Occidental', 'Carmen', 'San Nicolás', 'Aguacaliente', 'Guadalupe', 'Corralillo', 'Tierra Blanca', 'Dulce Nombre', 'Llano Grande', 'Quebradilla'] },
      { canton: 'Paraíso', distritos: ['Paraíso', 'Santiago', 'Orosi', 'Cachí', 'Llanos de Santa Lucía'] },
      { canton: 'La Unión', distritos: ['Tres Ríos', 'San Diego', 'San Juan', 'San Rafael', 'Concepción', 'Dulce Nombre', 'San Ramón', 'Río Azul'] },
      { canton: 'Jiménez', distritos: ['Juan Viñas', 'Tucurrique', 'Pejibaye'] },
      { canton: 'Turrialba', distritos: ['Turrialba', 'La Suiza', 'Peralta', 'Santa Cruz', 'Santa Teresita', 'Pavones', 'Tuis', 'Tayutic', 'Santa Rosa', 'Tres Equis', 'La Isabel', 'Chirripó'] },
      { canton: 'Alvarado', distritos: ['Pacayas', 'Cervantes', 'Capellades'] },
      { canton: 'Oreamuno', distritos: ['San Rafael', 'Cot', 'Potrero Cerrado', 'Cipreses', 'Santa Rosa'] },
      { canton: 'El Guarco', distritos: ['El Tejar', 'San Isidro', 'Tobosi', 'Patio de Agua'] }
    ]
  },
  {
    provincia: 'Heredia',
    cantones: [
      { canton: 'Heredia', distritos: ['Heredia', 'Mercedes', 'San Francisco', 'Ulloa', 'Varablanca'] },
      { canton: 'Barva', distritos: ['Barva', 'San Pedro', 'San Pablo', 'San Roque', 'Santa Lucía', 'San José de la Montaña'] },
      { canton: 'Santo Domingo', distritos: ['Santo Domingo', 'San Vicente', 'San Miguel', 'Paracito', 'Santo Tomás', 'Santa Rosa', 'Tures', 'Para'] },
      { canton: 'Santa Bárbara', distritos: ['Santa Bárbara', 'San Pedro', 'San Juan', 'Jesús', 'Santo Domingo', 'Puraba'] },
      { canton: 'San Rafael', distritos: ['San Rafael', 'San Josecito', 'Santiago', 'Ángeles', 'Concepción'] },
      { canton: 'San Isidro', distritos: ['San Isidro', 'San José', 'Concepción', 'San Francisco'] },
      { canton: 'Belén', distritos: ['San Antonio', 'La Ribera', 'La Asunción'] },
      { canton: 'Flores', distritos: ['San Joaquín', 'Barrantes', 'Llorente'] },
      { canton: 'San Pablo', distritos: ['San Pablo', 'Rincón de Sabanilla'] },
      { canton: 'Sarapiquí', distritos: ['Puerto Viejo', 'La Virgen', 'Las Horquetas', 'Llanuras del Gaspar', 'Cureña'] }
    ]
  },
  {
    provincia: 'Guanacaste',
    cantones: [
      { canton: 'Liberia', distritos: ['Liberia', 'Cañas Dulces', 'Mayorga', 'Nacascolo', 'Curubandé'] },
      { canton: 'Nicoya', distritos: ['Nicoya', 'Mansión', 'San Antonio', 'Quebrada Honda', 'Sámara', 'Nosara', 'Belén de Nosarita'] },
      { canton: 'Santa Cruz', distritos: ['Santa Cruz', 'Bolsón', 'Veintisiete de Abril', 'Tempate', 'Cartagena', 'Cuajiniquil', 'Diriá', 'Cabo Velas', 'Tamarindo'] },
      { canton: 'Bagaces', distritos: ['Bagaces', 'Fortuna', 'Mogote', 'Río Naranjo'] },
      { canton: 'Carrillo', distritos: ['Filadelfia', 'Palmira', 'Sardinal', 'Belén'] },
      { canton: 'Cañas', distritos: ['Cañas', 'Palmira', 'San Miguel', 'Bebedero', 'Porozal'] },
      { canton: 'Abangares', distritos: ['Las Juntas', 'Sierra', 'San Juan', 'Colorado'] },
      { canton: 'Tilarán', distritos: ['Tilarán', 'Quebrada Grande', 'Tronadora', 'Santa Rosa', 'Líbano', 'Tierras Morenas', 'Arenal'] },
      { canton: 'Nandayure', distritos: ['Carmona', 'Santa Rita', 'Zapotal', 'San Pablo', 'Porvenir', 'Bejuco'] },
      { canton: 'La Cruz', distritos: ['La Cruz', 'Santa Cecilia', 'La Garita', 'Santa Elena'] },
      { canton: 'Hojancha', distritos: ['Hojancha', 'Monte Romo', 'Puerto Carrillo', 'Huacas'] }
    ]
  },
  {
    provincia: 'Puntarenas',
    cantones: [
      { canton: 'Puntarenas', distritos: ['Puntarenas', 'Pitahaya', 'Chomes', 'Lepanto', 'Paquera', 'Manzanillo', 'Guacimal', 'Barranca', 'Monte Verde', 'Isla del Coco', 'Cóbano', 'Chacarita', 'Chira', 'Acapulco', 'El Roble', 'Arancibia'] },
      { canton: 'Esparza', distritos: ['Espíritu Santo', 'San Juan Grande', 'Macacona', 'San Rafael', 'San Jerónimo'] },
      { canton: 'Buenos Aires', distritos: ['Buenos Aires', 'Volcán', 'Potrero Grande', 'Boruca', 'Pilas', 'Colinas', 'Chánguena', 'Biolley', 'Brunka'] },
      { canton: 'Montes de Oro', distritos: ['Miramar', 'La Unión', 'San Isidro'] },
      { canton: 'Osa', distritos: ['Puerto Cortés', 'Palmar', 'Sierpe', 'Bahía Ballena', 'Piedras Blancas', 'Bahía Drake'] },
      { canton: 'Quepos', distritos: ['Quepos', 'Savegre', 'Naranjito'] },
      { canton: 'Golfito', distritos: ['Golfito', 'Puerto Jiménez', 'Guaycará', 'Pavón'] },
      { canton: 'Coto Brus', distritos: ['San Vito', 'Sabalito', 'Aguabuena', 'Limoncito', 'Pittier'] },
      { canton: 'Parrita', distritos: ['Parrita'] },
      { canton: 'Corredores', distritos: ['Corredor', 'La Cuesta', 'Canoas', 'Laurel'] },
      { canton: 'Garabito', distritos: ['Jacó', 'Tárcoles'] }
    ]
  },
  {
    provincia: 'Limón',
    cantones: [
      { canton: 'Limón', distritos: ['Limón', 'Valle La Estrella', 'Río Blanco', 'Matama'] },
      { canton: 'Pococí', distritos: ['Guápiles', 'Jiménez', 'Rita', 'Roxana', 'Cariari', 'Colorado', 'La Colonia'] },
      { canton: 'Siquirres', distritos: ['Siquirres', 'Pacuarito', 'Florida', 'Germania', 'El Cairo', 'Alegría'] },
      { canton: 'Talamanca', distritos: ['Bratsi', 'Sixaola', 'Cahuita', 'Telire'] },
      { canton: 'Matina', distritos: ['Matina', 'Batán', 'Carrandi'] },
      { canton: 'Guácimo', distritos: ['Guácimo', 'Mercedes', 'Pocora', 'Río Jiménez', 'Duacari'] }
    ]
  }
];

const FIELD_LABELS = { informe: 'Informe', expediente: 'Expediente', asistentes: 'Asistentes', nombre: 'Nombre', cedula: 'Cédula', tema: 'Tema', boleta: 'Boleta', minuta: 'Minuta', lugar: 'Lugar', nombreCumple: 'Cumpleañero/a' };
const DAYS_OF_WEEK = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

// --- UTILS ---
const toISODateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const formatDuration = (ms) => {
  if (!ms) return "0m";
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)));
  return `${hours}h ${minutes}m`;
};

const formatMoney = (amount) => {
     return '₡' + (amount || 0).toLocaleString('es-CR');
};

const calculateTaskCost = (task, rates) => {
    if (!task.logistics || !task.logistics.viaticos || task.logistics.viaticos.length === 0) return 0;
    let cost = 0;
    const v = task.logistics.viaticos;
    if (v.includes('Desayuno')) cost += rates.breakfast || 0;
    if (v.includes('Almuerzo')) cost += rates.lunch || 0;
    if (v.includes('Cena')) cost += rates.dinner || 0;
    if (v.includes('Hospedaje')) {
        // Use specific lodging cost if available (from location selection), else use global default
        cost += task.logistics.lodgingCost || rates.lodging || 0;
    }
    return cost;
};

const getWeekRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  const start = new Date(d.setDate(diff));
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23,59,59,999);
  return { start, end };
};

const uuid = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const checkOverlap = (t1Start, t1End, t2Start, t2End) => {
  return new Date(t1Start) < new Date(t2End) && new Date(t1End) > new Date(t2Start);
};

const generateRepetitions = (task, untilDate) => {
  if (!task.repeat || task.repeat.type === 'none') return [task];
  const tasks = [task];
  const startDate = new Date(task.start);
  const endDate = new Date(task.end);
  const duration = endDate - startDate;
  const until = new Date(untilDate);
  let current = new Date(startDate);
  
  if (!task.seriesId) task.seriesId = task.id || uuid();

  if (task.repeat.type === 'daily') {
    current.setDate(current.getDate() + 1);
    while (current <= until) {
      const newStart = new Date(current);
      const newEnd = new Date(current.getTime() + duration);
      tasks.push({ ...task, id: uuid(), start: newStart.toISOString(), end: newEnd.toISOString(), parentId: task.id, isRepetition: true, status: 'pending', history: [], seriesId: task.seriesId });
      current.setDate(current.getDate() + 1);
    }
  } else if (task.repeat.type === 'weekly') {
    const days = task.repeat.days || [];
    current.setDate(current.getDate() + 1);
    while (current <= until) {
      if (days.includes(current.getDay())) {
        const newStart = new Date(current); newStart.setHours(startDate.getHours(), startDate.getMinutes());
        const newEnd = new Date(newStart.getTime() + duration);
        tasks.push({ ...task, id: uuid(), start: newStart.toISOString(), end: newEnd.toISOString(), parentId: task.id, isRepetition: true, status: 'pending', history: [], seriesId: task.seriesId });
      }
      current.setDate(current.getDate() + 1);
    }
  }
  return tasks;
};

// --- DEFINICIÓN DE TEMAS ---
const DARK_THEME = {
  bgPrimary: '#0a1214',
  bgSecondary: '#0d1a1f',
  bgTertiary: '#112428',
  border: '#1e3a3a',
  borderLight: '#2a4a4a',
  textPrimary: '#e0f0f0',
  textSecondary: '#8ab4b4',
  textMuted: '#5a8a8a',
  accent: '#4fd1c5',
  accentHover: '#38b2ac',
  success: '#48bb78',
  warning: '#ed8936',
  danger: '#fc8181',
  gold: '#d69e2e',
  themeIcon: 'sun'
};

const LIGHT_THEME = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f4f7fa',
  bgTertiary: '#e2e8f0',
  border: '#cbd5e0',
  borderLight: '#e2e8f0',
  textPrimary: '#1a202c',
  textSecondary: '#4a5568',
  textMuted: '#718096',
  accent: '#319795', 
  accentHover: '#2c7a7b',
  success: '#2f855a', 
  warning: '#c05621', 
  danger: '#c53030', 
  gold: '#b7791f', 
  themeIcon: 'moon'
};

// --- COMPONENTES UI ---
const Modal = ({ isOpen, onClose, title, children, size = 'md', colors }) => {
  if (!isOpen) return null;
  const isMobileModal = typeof window !== 'undefined' && window.innerWidth <= 768;

  return (
    <div className="modal-responsive" style={{position:'fixed',inset:0,zIndex:60,display:'flex',alignItems: isMobileModal ? 'flex-end' : 'center',justifyContent:'center',backgroundColor:'rgba(0,0,0,0.85)',padding: isMobileModal ? '0' : '16px'}}>
      <div style={{backgroundColor:colors.bgSecondary,borderRadius: isMobileModal ? '16px 16px 0 0' : '12px',border:`1px solid ${colors.border}`,boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)',width:'100%',maxWidth: isMobileModal ? '100%' : size==='sm'?'400px':size==='lg'?'900px':size==='xl'?'1100px':'600px',maxHeight: isMobileModal ? '92vh' : '90vh',display:'flex',flexDirection:'column',color:colors.textSecondary}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding: isMobileModal ? '14px 16px' : '16px',borderBottom:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,borderRadius: isMobileModal ? '16px 16px 0 0' : '12px 12px 0 0'}}>
          <h2 style={{fontSize: isMobileModal ? '16px' : '18px',fontWeight:'bold',color:colors.accent}}>{title}</h2>
          <button onClick={onClose} style={{padding:'8px',borderRadius:'50%',backgroundColor:colors.bgTertiary,border:'none',cursor:'pointer',color:colors.textMuted}}><X size={20} /></button>
        </div>
        <div style={{padding: isMobileModal ? '16px' : '20px',overflowY:'auto',flex:1,WebkitOverflowScrolling:'touch'}}>
          {children}
        </div>
      </div>
    </div>
  );
};

const ConfigModal = ({ isOpen, onClose, colors, activityTypes, setActivityTypes, ppCodes, setPpCodes, viaticumRates, setViaticumRates, tasks, onUpdateTasks, monthlyBudgets, setMonthlyBudgets, isBudgetLocked, setIsBudgetLocked, lodgingRates, setLodgingRates, isViaticosLocked, setIsViaticosLocked, isTypesLocked, setIsTypesLocked, isPPLocked, setIsPPLocked }) => {
    const [activeTab, setActiveTab] = useState('types');
    const [newType, setNewType] = useState({ name: '', color: '#2ECC71', logistics: false, fields: [], subtypes: [] });
    const [newPP, setNewPP] = useState({ code: '', description: '' });
    const [transferData, setTransferData] = useState(null); 
    const [isTransferring, setIsTransferring] = useState(false);
    const [localBudgets, setLocalBudgets] = useState({});
    
    // Estado para la edición de tipos y subtipos
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [subtypeInputValue, setSubtypeInputValue] = useState('');
    
    // Refs para el scroll
    const formTopRef = useRef(null);

    useEffect(() => {
        setLocalBudgets(monthlyBudgets || {});
    }, [monthlyBudgets, isOpen]);

    if (!isOpen) return null;

    const tabStyle = (isActive) => ({
        padding:'10px 16px',borderRadius:'8px 8px 0 0',fontWeight:'bold',cursor:'pointer',border:'none',
        backgroundColor:isActive?colors.bgPrimary:'transparent',color:isActive?colors.accent:colors.textMuted,
        borderBottom:isActive?`2px solid ${colors.accent}`:'none'
    });

    // --- Lógica de Tipos de Actividad ---
    const handleAddOrUpdateType = () => {
        if(!newType.name) return;
        
        if (editingTypeId !== null) {
            // Actualizar existente
            setActivityTypes(activityTypes.map(t => t.id === editingTypeId ? { ...newType, id: editingTypeId } : t));
            setEditingTypeId(null);
        } else {
            // Crear nuevo
            const id = Math.max(...activityTypes.map(t => t.id), 0) + 1;
            setActivityTypes([...activityTypes, { ...newType, id }]);
        }
        // Reset form
        setNewType({ name: '', color: '#2ECC71', logistics: false, fields: [], subtypes: [] });
        setSubtypeInputValue('');
    };

    const startEditingType = (type) => {
        setNewType({ ...type, subtypes: type.subtypes || [] });
        setEditingTypeId(type.id);
        setSubtypeInputValue('');
        // Scroll to top of the form
        if (formTopRef.current) {
            formTopRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const cancelEditingType = () => {
        setNewType({ name: '', color: '#2ECC71', logistics: false, fields: [], subtypes: [] });
        setEditingTypeId(null);
        setSubtypeInputValue('');
    };

    const handleDeleteTypeAttempt = (typeId) => {
        const affectedTasks = tasks.filter(t => t.typeId === typeId);
        if (affectedTasks.length > 0) {
            setTransferData({ deletingId: typeId, count: affectedTasks.length });
            setIsTransferring(true);
        } else {
            setActivityTypes(activityTypes.filter(t => t.id !== typeId));
        }
    };

    const confirmTransferAndDelete = (targetTypeId) => {
        onUpdateTasks(transferData.deletingId, parseInt(targetTypeId));
        setActivityTypes(activityTypes.filter(t => t.id !== transferData.deletingId));
        setIsTransferring(false);
        setTransferData(null);
    };

    // --- Lógica de Subtipos ---
    const addSubtypeToForm = () => {
        if (!subtypeInputValue.trim()) return;
        setNewType({ ...newType, subtypes: [...(newType.subtypes || []), subtypeInputValue.trim()] });
        setSubtypeInputValue('');
    };

    const removeSubtypeFromForm = (index) => {
        const updated = [...(newType.subtypes || [])];
        updated.splice(index, 1);
        setNewType({ ...newType, subtypes: updated });
    };

    const updateSubtypeText = (index, text) => {
        const updated = [...(newType.subtypes || [])];
        updated[index] = text;
        setNewType({ ...newType, subtypes: updated });
    };
    
    // --- Lógica de Presupuesto ---
    const handleBudgetChange = (monthIndex, value) => {
        setLocalBudgets({ ...localBudgets, [monthIndex]: parseInt(value) || 0 });
    };
    
    const saveBudgets = () => {
        setMonthlyBudgets(localBudgets);
        setIsBudgetLocked(true);
        alert('Presupuestos actualizados y bloqueados correctamente.');
    };

    // --- Lógica de Carga de CSV para Hospedaje ---
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const text = evt.target.result;
            const lines = text.split('\n');
            const newRates = [];
            // Skip header
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                // Parse logic: Prov, Cant, "Dists", Amt
                const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
                if (matches) {
                     const parts = [];
                     let current = '';
                     let inQuote = false;
                     for(let char of line) {
                         if(char === '"') { inQuote = !inQuote; continue; }
                         if(char === ',' && !inQuote) { parts.push(current); current = ''; }
                         else { current += char; }
                     }
                     parts.push(current);

                     if(parts.length >= 4) {
                         const monto = parseInt(parts[parts.length-1]);
                         const distritosRaw = parts[parts.length-2];
                         const canton = parts[parts.length-3];
                         const provincia = parts[parts.length-4];
                         
                         if(provincia && canton && distritosRaw && !isNaN(monto)) {
                             // Split districts by comma
                             const distritos = distritosRaw.split(',').map(d => d.trim());
                             newRates.push({ provincia, canton, distritos, monto });
                         }
                     }
                }
            }
            if(newRates.length > 0) {
                setLodgingRates(newRates);
                alert(`Se cargaron ${newRates.length} registros de tarifas de hospedaje.`);
            } else {
                alert("No se pudieron leer registros válidos del archivo.");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset file input
    };
    
    const currentYear = new Date().getFullYear(); 
    const expensesByMonth = {};
    tasks.forEach(t => {
        const d = new Date(t.start);
        const m = d.getMonth();
        const cost = calculateTaskCost(t, viaticumRates);
        expensesByMonth[m] = (expensesByMonth[m] || 0) + cost;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Configuración del Sistema" size="lg" colors={colors}>
            <div style={{display:'flex',gap:'8px',marginBottom:'20px',borderBottom:`1px solid ${colors.border}`,paddingBottom:'8px'}}>
                <button onClick={() => setActiveTab('types')} style={tabStyle(activeTab === 'types')}>Tipos de Actividad</button>
                <button onClick={() => setActiveTab('ppcodes')} style={tabStyle(activeTab === 'ppcodes')}>Códigos PP</button>
                <button onClick={() => setActiveTab('viaticos')} style={tabStyle(activeTab === 'viaticos')}>Viáticos</button>
                <button onClick={() => setActiveTab('budget')} style={tabStyle(activeTab === 'budget')}>Presupuesto Mensual</button>
            </div>

            {activeTab === 'types' && (
                <div>
                   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                        <h4 style={{margin:0,color:colors.accent}}>Gestión de Tipos de Actividad</h4>
                        {isTypesLocked ? (
                            <button onClick={() => setIsTypesLocked(false)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',backgroundColor:colors.bgTertiary,color:colors.textPrimary,border:`1px solid ${colors.border}`,borderRadius:'4px',cursor:'pointer'}}><Unlock size={14}/> Activar Edición</button>
                        ) : (
                            <button onClick={() => setIsTypesLocked(true)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',backgroundColor:colors.success,color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}><Lock size={14}/> Bloquear Edición</button>
                        )}
                   </div>

                   {isTransferring ? (
                       <div style={{padding:'20px',backgroundColor:colors.bgPrimary,border:`1px solid ${colors.warning}`,borderRadius:'8px'}}>
                           <h3 style={{color:colors.warning,marginTop:0}}><AlertTriangle size={20} style={{verticalAlign:'middle'}}/> Atención</h3>
                           <p>Hay <strong>{transferData.count}</strong> actividades usando el tipo que deseas eliminar.</p>
                           <p>Selecciona a qué tipo de actividad deseas moverlas:</p>
                           <select id="transferSelect" style={{width:'100%',padding:'8px',marginBottom:'12px',backgroundColor:colors.bgSecondary,color:colors.textPrimary,border:`1px solid ${colors.border}`}}>
                               {activityTypes.filter(t => t.id !== transferData.deletingId).map(t => (
                                   <option key={t.id} value={t.id}>{t.name}</option>
                               ))}
                           </select>
                           <div style={{display:'flex',gap:'8px',justifyContent:'flex-end'}}>
                               <button onClick={() => setIsTransferring(false)} style={{padding:'8px 16px',backgroundColor:'transparent',color:colors.textSecondary,border:'none',cursor:'pointer'}}>Cancelar</button>
                               <button onClick={() => confirmTransferAndDelete(document.getElementById('transferSelect').value)} style={{padding:'8px 16px',backgroundColor:colors.warning,color:colors.bgPrimary,fontWeight:'bold',border:'none',borderRadius:'4px',cursor:'pointer'}}>Mover y Eliminar</button>
                           </div>
                       </div>
                   ) : (
                       <>
                        <div ref={formTopRef} style={{padding:'12px',backgroundColor:colors.bgTertiary,borderRadius:'8px',marginBottom:'16px', opacity: isTypesLocked ? 0.6 : 1, pointerEvents: isTypesLocked ? 'none' : 'auto', border: editingTypeId !== null ? `2px solid ${colors.accent}` : 'none'}}>
                            <h4 style={{marginTop:0, color:colors.accent}}>{editingTypeId !== null ? 'Editar Tipo de Actividad' : 'Agregar Nuevo Tipo'}</h4>
                            
                            <div style={{display:'grid',gridTemplateColumns:'1fr auto auto',gap:'8px',marginBottom:'12px'}}>
                                <input placeholder="Nombre Actividad" value={newType.name} onChange={e=>setNewType({...newType, name:e.target.value})} style={{padding:'8px',borderRadius:'4px',border:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,color:colors.textPrimary}}/>
                                <input type="color" value={newType.color} onChange={e=>setNewType({...newType, color:e.target.value})} style={{height:'36px',border:'none',backgroundColor:'transparent',cursor:'pointer'}} title="Color"/>
                                <label style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'12px'}}><input type="checkbox" checked={newType.logistics} onChange={e=>setNewType({...newType, logistics:e.target.checked})}/> Logística</label>
                            </div>

                            {/* SECCIÓN DE SUBTIPOS */}
                            <div style={{backgroundColor:colors.bgPrimary, padding:'10px', borderRadius:'6px', border:`1px solid ${colors.border}`, marginBottom:'12px'}}>
                                <div style={{fontSize:'11px', fontWeight:'bold', color:colors.textMuted, marginBottom:'8px'}}>SUBTIPOS</div>
                                <div style={{display:'flex', gap:'8px', marginBottom:'8px'}}>
                                    <input 
                                        placeholder="Nuevo Subtipo (ej: Inspección Forestal)" 
                                        value={subtypeInputValue} 
                                        onChange={e=>setSubtypeInputValue(e.target.value)} 
                                        style={{flex:1, padding:'6px', borderRadius:'4px', border:`1px solid ${colors.border}`, backgroundColor:colors.bgSecondary, color:colors.textPrimary, fontSize:'12px'}}
                                    />
                                    <button onClick={addSubtypeToForm} style={{padding:'6px 12px', backgroundColor:colors.success, color:'white', border:'none', borderRadius:'4px', cursor:'pointer'}}><Plus size={14}/></button>
                                </div>
                                <div style={{maxHeight:'100px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'4px'}}>
                                    {newType.subtypes && newType.subtypes.map((sub, idx) => (
                                        <div key={idx} style={{display:'flex', gap:'4px', alignItems:'center'}}>
                                            <input 
                                                value={sub} 
                                                onChange={(e) => updateSubtypeText(idx, e.target.value)}
                                                style={{flex:1, padding:'4px', borderRadius:'4px', border:`1px solid ${colors.border}`, backgroundColor:'transparent', color:colors.textSecondary, fontSize:'12px'}}
                                            />
                                            <button onClick={() => removeSubtypeFromForm(idx)} style={{background:'transparent', border:'none', color:colors.danger, cursor:'pointer'}}><Trash2 size={12}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{display:'flex', justifyContent:'flex-end', gap:'8px'}}>
                                {editingTypeId !== null && (
                                    <button onClick={cancelEditingType} style={{padding:'8px 16px',backgroundColor:'transparent',color:colors.textMuted,border:'none',cursor:'pointer'}}>Cancelar</button>
                                )}
                                <button onClick={handleAddOrUpdateType} style={{padding:'8px 16px',backgroundColor:colors.success,color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}>{editingTypeId !== null ? 'Actualizar' : 'Agregar'}</button>
                            </div>
                        </div>

                        <div style={{maxHeight:'350px',overflowY:'auto'}}>
                            {activityTypes.map(type => (
                                <div key={type.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px',borderBottom:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,marginBottom:'4px',borderRadius:'4px'}}>
                                    <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                                        <div style={{width:'16px',height:'16px',borderRadius:'50%',backgroundColor:type.color}}></div>
                                        <span style={{fontWeight:'bold'}}>{type.name}</span>
                                        <span style={{fontSize:'10px',color:colors.textMuted}}>({type.subtypes?.length || 0} subtipos)</span>
                                    </div>
                                    <div style={{display:'flex', gap:'4px', opacity: isTypesLocked ? 0.3 : 1, pointerEvents: isTypesLocked ? 'none' : 'auto'}}>
                                        <button onClick={() => startEditingType(type)} style={{padding:'4px', color:colors.accent,background:'transparent',border:'none',cursor:'pointer'}} title="Editar"><Edit2 size={16}/></button>
                                        <button onClick={() => handleDeleteTypeAttempt(type.id)} style={{padding:'4px', color:colors.danger,background:'transparent',border:'none',cursor:'pointer'}} title="Eliminar"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                       </>
                   )}
                </div>
            )}

            {activeTab === 'ppcodes' && (
                <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                        <h4 style={{margin:0,color:colors.accent}}>Gestión de Códigos PP</h4>
                        {isPPLocked ? (
                            <button onClick={() => setIsPPLocked(false)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',backgroundColor:colors.bgTertiary,color:colors.textPrimary,border:`1px solid ${colors.border}`,borderRadius:'4px',cursor:'pointer'}}><Unlock size={14}/> Activar Edición</button>
                        ) : (
                            <button onClick={() => setIsPPLocked(true)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',backgroundColor:colors.success,color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}><Lock size={14}/> Bloquear Edición</button>
                        )}
                   </div>

                    <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'16px', opacity: isPPLocked ? 0.6 : 1, pointerEvents: isPPLocked ? 'none' : 'auto'}}>
                        <input placeholder="Código PP (ej: PPI-20-E20)" value={newPP.code} onChange={e=>setNewPP({...newPP, code: e.target.value})} style={{padding:'8px',borderRadius:'4px',border:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,color:colors.textPrimary}}/>
                        <textarea placeholder="Descripción detallada del código..." value={newPP.description} onChange={e=>setNewPP({...newPP, description: e.target.value})} style={{padding:'8px',borderRadius:'4px',border:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,color:colors.textPrimary, minHeight:'60px', resize:'vertical'}}/>
                        <button onClick={() => { if(newPP.code) { setPpCodes([...ppCodes, newPP]); setNewPP({code:'', description:''}); } }} style={{padding:'8px 16px',backgroundColor:colors.success,color:'white',border:'none',borderRadius:'4px',cursor:'pointer', alignSelf: 'flex-end'}}>Agregar Código</button>
                    </div>

                    <div style={{maxHeight:'350px',overflowY:'auto', border:`1px solid ${colors.border}`, borderRadius:'6px'}}>
                        <table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}>
                            <thead style={{position:'sticky', top:0, backgroundColor:colors.bgTertiary}}>
                                <tr>
                                    <th style={{padding:'8px', textAlign:'left', color:colors.textMuted, width:'120px'}}>Código</th>
                                    <th style={{padding:'8px', textAlign:'left', color:colors.textMuted}}>Descripción</th>
                                    <th style={{padding:'8px', width:'40px'}}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {ppCodes.map((pp, idx) => (
                                    <tr key={idx} style={{borderBottom:`1px solid ${colors.border}`}}>
                                        <td style={{padding:'8px', fontWeight:'bold', color:colors.accent, verticalAlign: 'top'}}>{typeof pp === 'string' ? pp : pp.code}</td>
                                        <td style={{padding:'8px', color:colors.textSecondary, whiteSpace: 'pre-wrap'}}>{typeof pp === 'string' ? '' : pp.description}</td>
                                        <td style={{padding:'8px', textAlign:'center', verticalAlign: 'top'}}>
                                            <button 
                                                onClick={() => setPpCodes(ppCodes.filter((_, i) => i !== idx))} 
                                                style={{color:colors.danger,background:'transparent',border:'none',cursor:'pointer', opacity: isPPLocked ? 0.3 : 1, pointerEvents: isPPLocked ? 'none' : 'auto'}}
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'viaticos' && (
                <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                        <h4 style={{margin:0,color:colors.accent}}>Tarifas de Viáticos</h4>
                        {isViaticosLocked ? (
                            <button onClick={() => setIsViaticosLocked(false)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',backgroundColor:colors.bgTertiary,color:colors.textPrimary,border:`1px solid ${colors.border}`,borderRadius:'4px',cursor:'pointer'}}><Unlock size={14}/> Activar Edición</button>
                        ) : (
                            <button onClick={() => setIsViaticosLocked(true)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',backgroundColor:colors.success,color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}><Lock size={14}/> Guardar y Bloquear</button>
                        )}
                    </div>
                    
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px', marginBottom:'24px', opacity: isViaticosLocked ? 0.7 : 1, pointerEvents: isViaticosLocked ? 'none' : 'auto'}}>
                        <div><label style={{fontSize:'12px',color:colors.textMuted}}>Desayuno (₡)</label><input type="number" value={viaticumRates.breakfast || 0} onChange={e=>setViaticumRates({...viaticumRates, breakfast: parseInt(e.target.value)})} style={{width:'100%',padding:'8px',marginTop:'4px',borderRadius:'4px',border:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,color:colors.textPrimary}}/></div>
                        <div><label style={{fontSize:'12px',color:colors.textMuted}}>Almuerzo (₡)</label><input type="number" value={viaticumRates.lunch || 0} onChange={e=>setViaticumRates({...viaticumRates, lunch: parseInt(e.target.value)})} style={{width:'100%',padding:'8px',marginTop:'4px',borderRadius:'4px',border:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,color:colors.textPrimary}}/></div>
                        <div><label style={{fontSize:'12px',color:colors.textMuted}}>Cena (₡)</label><input type="number" value={viaticumRates.dinner || 0} onChange={e=>setViaticumRates({...viaticumRates, dinner: parseInt(e.target.value)})} style={{width:'100%',padding:'8px',marginTop:'4px',borderRadius:'4px',border:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,color:colors.textPrimary}}/></div>
                        <div><label style={{fontSize:'12px',color:colors.textMuted}}>Hospedaje Default (₡)</label><input type="number" value={viaticumRates.lodging || 0} onChange={e=>setViaticumRates({...viaticumRates, lodging: parseInt(e.target.value)})} style={{width:'100%',padding:'8px',marginTop:'4px',borderRadius:'4px',border:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary,color:colors.textPrimary}}/></div>
                    </div>
                    
                    <div style={{borderTop:`1px solid ${colors.border}`, paddingTop:'16px'}}>
                        <h4 style={{margin:'0 0 12px 0',color:colors.accent}}>Tarifas de Hospedaje por Distrito</h4>
                        
                        <div style={{marginBottom:'12px', opacity: isViaticosLocked ? 0.5 : 1, pointerEvents: isViaticosLocked ? 'none' : 'auto'}}>
                            <label style={{display:'block',fontSize:'12px',color:colors.textMuted,marginBottom:'4px'}}>Cargar Archivo CSV (Provincia,Cantón,Distritos,Monto)</label>
                            <input type="file" accept=".csv" onChange={handleFileUpload} style={{width:'100%',padding:'8px',border:`1px solid ${colors.border}`,borderRadius:'4px',backgroundColor:colors.bgSecondary,color:colors.textPrimary}} />
                        </div>
                        
                        {lodgingRates && lodgingRates.length > 0 ? (
                            <div style={{maxHeight:'300px', overflowY:'auto', border:`1px solid ${colors.border}`, borderRadius:'6px'}}>
                                <table style={{width:'100%', fontSize:'12px', borderCollapse:'collapse'}}>
                                    <thead style={{position:'sticky', top:0, backgroundColor:colors.bgTertiary}}>
                                        <tr>
                                            <th style={{padding:'8px', textAlign:'left', color:colors.textMuted}}>Provincia</th>
                                            <th style={{padding:'8px', textAlign:'left', color:colors.textMuted}}>Cantón</th>
                                            <th style={{padding:'8px', textAlign:'left', color:colors.textMuted}}>Distritos</th>
                                            <th style={{padding:'8px', textAlign:'right', color:colors.textMuted}}>Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lodgingRates.map((rate, idx) => (
                                            <tr key={idx} style={{borderBottom:`1px solid ${colors.border}`}}>
                                                <td style={{padding:'8px'}}>{rate.provincia}</td>
                                                <td style={{padding:'8px'}}>{rate.canton}</td>
                                                <td style={{padding:'8px', color:colors.textSecondary}}>{rate.distritos.join(', ')}</td>
                                                <td style={{padding:'8px', textAlign:'right', fontWeight:'bold', color:colors.success}}>₡{rate.monto.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p style={{fontSize:'12px', color:colors.textMuted, fontStyle:'italic'}}>No hay tarifas de hospedaje cargadas.</p>
                        )}
                    </div>
                </div>
            )}
            
            {activeTab === 'budget' && (
                <div>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                        <h4 style={{margin:0,color:colors.accent}}>Control de Presupuesto Mensual</h4>
                        {isBudgetLocked ? (
                            <button onClick={() => setIsBudgetLocked(false)} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',backgroundColor:colors.bgTertiary,color:colors.textPrimary,border:`1px solid ${colors.border}`,borderRadius:'4px',cursor:'pointer'}}><Unlock size={14}/> Activar Edición</button>
                        ) : (
                            <button onClick={saveBudgets} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 16px',backgroundColor:colors.success,color:'white',border:'none',borderRadius:'4px',cursor:'pointer'}}><Lock size={14}/> Guardar y Bloquear</button>
                        )}
                    </div>
                    <div style={{maxHeight:'400px',overflowY:'auto'}}>
                        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
                            <thead>
                                <tr style={{textAlign:'left',color:colors.textMuted,borderBottom:`1px solid ${colors.border}`}}>
                                    <th style={{padding:'8px'}}>Mes</th>
                                    <th style={{padding:'8px'}}>Límite Asignado</th>
                                    <th style={{padding:'8px'}}>Gasto Programado</th>
                                    <th style={{padding:'8px'}}>Disponible</th>
                                </tr>
                            </thead>
                            <tbody>
                                {MONTH_NAMES.map((month, index) => {
                                    const limit = localBudgets[index] !== undefined ? localBudgets[index] : DEFAULT_MONTHLY_BUDGET;
                                    const spent = expensesByMonth[index] || 0;
                                    const remaining = limit - spent;
                                    const isOver = remaining < 0;
                                    
                                    return (
                                        <tr key={index} style={{borderBottom:`1px solid ${colors.border}`,backgroundColor:isOver ? `${colors.danger}15` : 'transparent'}}>
                                            <td style={{padding:'8px',fontWeight:'bold'}}>{month}</td>
                                            <td style={{padding:'8px'}}>
                                                <div style={{display:'flex',alignItems:'center',gap:'4px'}}>
                                                    ₡ <input 
                                                        type="number" 
                                                        disabled={isBudgetLocked}
                                                        value={limit} 
                                                        onChange={(e) => handleBudgetChange(index, e.target.value)}
                                                        style={{width:'100px',padding:'4px',borderRadius:'4px',border:`1px solid ${colors.border}`,backgroundColor:isBudgetLocked ? colors.bgTertiary : colors.bgSecondary, color: isBudgetLocked ? colors.textMuted : colors.textPrimary, cursor: isBudgetLocked ? 'not-allowed' : 'text'}}
                                                      />
                                                </div>
                                            </td>
                                            <td style={{padding:'8px',color:isOver?colors.danger:colors.textSecondary}}>{formatMoney(spent)}</td>
                                            <td style={{padding:'8px',fontWeight:'bold',color:isOver?colors.danger:colors.success}}>{formatMoney(remaining)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </Modal>
    );
};

const ScheduleAlert = ({ task, onAction, onClose, colors, activityTypes }) => {
  if (!task) return null;
  const ti = activityTypes.find(at => at.id === task.typeId);
  return (
    <div style={{position:'fixed',inset:0,zIndex:70,display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',backgroundColor:'rgba(0,0,0,0.85)'}}>
      <div style={{borderRadius:'12px',border:`1px solid ${colors.border}`,boxShadow:'0 25px 50px -12px rgba(0,0,0,0.5)',width:'100%',maxWidth:'350px',padding:'16px',backgroundColor:colors.bgSecondary}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'12px',color:colors.accent}}><Bell size={16}/> <strong>Hora de Actividad</strong></div>
        <p style={{fontSize:'14px',marginBottom:'8px',color:colors.textSecondary}}>Según tu planificación, ahora deberías iniciar:</p>
        <div style={{padding:'8px',borderRadius:'6px',marginBottom:'12px',color:'white',backgroundColor:ti?.color || '#333'}}><strong>{ti?.name}</strong>{task.subtipo && `: ${task.subtipo}`}</div>
        <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
          <button onClick={() => onAction('start')} style={{flex:1,padding:'8px',borderRadius:'6px',fontSize:'12px',fontWeight:'bold',display:'flex',alignItems:'center',justifyContent:'center',gap:'4px',backgroundColor:colors.success,color:colors.bgPrimary,border:'none',cursor:'pointer'}}><PlayCircle size={12}/> Iniciar</button>
          <button onClick={() => onAction('pause')} style={{flex:1,padding:'8px',borderRadius:'6px',fontSize:'12px',fontWeight:'bold',backgroundColor:colors.warning,color:colors.bgPrimary,border:'none',cursor:'pointer'}}>Pausar</button>
          <button onClick={onClose} style={{flex:1,padding:'8px',borderRadius:'6px',fontSize:'12px',backgroundColor:colors.bgTertiary,color:colors.textMuted,border:'none',cursor:'pointer'}}>Ignorar</button>
        </div>
      </div>
    </div>
  );
};

const DayModalityModal = ({ isOpen, onClose, selectedDay, currentModality, onSave, colors }) => {
  const [modality, setModality] = useState(currentModality || 'none');
  useEffect(() => { setModality(currentModality || 'none'); }, [currentModality, isOpen]);
  if (!isOpen) return null;
  
  const optionStyle = (isSelected, accentColor) => ({
    display:'flex',alignItems:'center',gap:'12px',padding:'12px',borderRadius:'8px',border:`2px solid ${isSelected ? accentColor : colors.border}`,
    cursor:'pointer',backgroundColor:isSelected ? `${accentColor}15` : 'transparent',marginBottom:'8px'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cambiar Modalidad del Día" size="sm" colors={colors}>
      <div style={{fontSize:'12px',color:colors.textSecondary}}>
        <p style={{fontSize:'14px',marginBottom:'16px'}}>Seleccione la modalidad para <strong style={{color:colors.accent}}>{selectedDay?.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>:</p>
        
        <div onClick={() => setModality('telework')} style={optionStyle(modality === 'telework', colors.accent)}>
          <input type="radio" checked={modality === 'telework'} onChange={() => setModality('telework')} style={{accentColor:colors.accent}}/>
          <div><strong style={{color:colors.accent}}>Teletrabajo</strong><p style={{color:colors.textMuted,margin:0}}>Trabajo remoto desde casa</p></div>
        </div>
        
        <div onClick={() => setModality('presencial')} style={optionStyle(modality === 'presencial', colors.success)}>
          <input type="radio" checked={modality === 'presencial'} onChange={() => setModality('presencial')} style={{accentColor:colors.success}}/>
          <div><strong style={{color:colors.success}}>Presencial</strong><p style={{color:colors.textMuted,margin:0}}>Trabajo en oficina</p></div>
        </div>
        
        <div onClick={() => setModality('none')} style={optionStyle(modality === 'none', colors.textMuted)}>
          <input type="radio" checked={modality === 'none'} onChange={() => setModality('none')} style={{accentColor:colors.textMuted}}/>
          <div><strong style={{color:colors.textMuted}}>Ninguno</strong><p style={{color:colors.textMuted,margin:0}}>Día libre, feriado, fin de semana</p></div>
        </div>
        
        <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',paddingTop:'16px'}}>
          <button onClick={onClose} style={{padding:'8px 16px',backgroundColor:'transparent',border:'none',color:colors.textMuted,cursor:'pointer'}}>Cancelar</button>
          <button onClick={() => { onSave(modality); onClose(); }} style={{padding:'8px 16px',borderRadius:'6px',fontWeight:'bold',backgroundColor:colors.success,color:colors.bgPrimary,border:'none',cursor:'pointer'}}>Guardar</button>
        </div>
      </div>
    </Modal>
  );
};

// --- INDICADOR DE SINCRONIZACIÓN POR TAREA (estilo WhatsApp mejorado) ---
const SyncIndicator = ({ taskId, taskSyncMap, lastBackupAt, onForceSync, colors, size = 14 }) => {
  const info = taskSyncMap[taskId];
  const status = info?.status || 'synced';
  const syncedAt = info?.at;
  const isBackedUp = lastBackupAt && syncedAt && syncedAt <= lastBackupAt;

  const isSaving = status === 'saving';
  const isError = status === 'error';
  const isSynced = status === 'synced';

  const color = isSaving ? (colors.warning || '#ED8936')
              : isError ? (colors.danger || '#E53E3E')
              : isBackedUp ? '#60A5FA'
              : (colors.success || '#48BB78');

  const bgColor = isSaving ? `${colors.warning || '#ED8936'}18`
                : isError ? `${colors.danger || '#E53E3E'}18`
                : isBackedUp ? '#60A5FA18'
                : `${colors.success || '#48BB78'}18`;

  const title = isSaving ? 'Guardando en Firebase...'
              : isError ? 'Error al sincronizar — clic para reintentar'
              : isBackedUp ? 'Sincronizado en Firebase + incluido en último respaldo'
              : 'Sincronizado en Firebase — sin respaldo reciente';

  const handleClick = (e) => {
    e.stopPropagation();
    if (onForceSync) onForceSync(taskId);
  };

  // Tamaño mínimo accesible para zona de toque
  const touchSize = Math.max(size + 10, 24);
  const iconSize = Math.max(size, 12);

  return (
    <span
      onClick={handleClick}
      title={title}
      aria-label={title}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e); } }}
      style={{
        display:'inline-flex',alignItems:'center',justifyContent:'center',
        cursor:'pointer',flexShrink:0,
        width:`${touchSize}px`,height:`${touchSize}px`,
        borderRadius:'50%',
        backgroundColor: bgColor,
        opacity: isSaving ? 0.85 : 1,
        animation: isSaving ? 'pulseDot 1.2s ease-in-out infinite' : 'none',
        lineHeight:1,
        transition:'background-color 0.2s ease, transform 0.15s ease',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {isSaving && <RefreshCw size={iconSize} color={color} style={{animation:'spin 1s linear infinite'}} strokeWidth={2.5}/>}
      {isError && <AlertCircle size={iconSize} color={color} strokeWidth={2.5}/>}
      {isSynced && !isBackedUp && <CheckCircle size={iconSize} color={color} strokeWidth={2.5}/>}
      {isSynced && isBackedUp && <CheckCheck size={iconSize} color={color} strokeWidth={2.5}/>}
    </span>
  );
};

const CalendarCell = ({ day, tasks, currentDate, dayTag, markers, onToggleTag, onSelectDay, onAddTask, onEditTask, isSelected, onDrop, colors, activityTypes, isMonthOverBudget, viaticumRates, taskSyncMap, lastBackupAt, onForceSync, isMobile, cases }) => {
  const dayStr = toISODateString(day);
  const dayTasks = tasks
    .filter(t => toISODateString(new Date(t.start)) === dayStr)
    .sort((a, b) => new Date(a.start) - new Date(b.start));
  const dayMarkers = markers.filter(m => m.date === dayStr);
  const isToday = new Date().toDateString() === day.toDateString();
  const isCurrentMonth = day.getMonth() === currentDate.getMonth();

  // Detectar traslapes de horario entre actividades del día
  let hasOverlap = false;
  const activeDayTasks = dayTasks.filter(t => t.status !== 'completed');
  for (let i = 0; i < activeDayTasks.length && !hasOverlap; i++) {
    for (let j = i + 1; j < activeDayTasks.length && !hasOverlap; j++) {
      const a = activeDayTasks[i], b = activeDayTasks[j];
      const aStart = new Date(a.start).getTime(), aEnd = new Date(a.end).getTime();
      const bStart = new Date(b.start).getTime(), bEnd = new Date(b.end).getTime();
      if (aStart < bEnd && aEnd > bStart) {
        hasOverlap = true;
      }
    }
  }

  let bgColor = colors.bgSecondary;
  if (dayTag === 'telework') bgColor = `${colors.accent}1a`; 
  if (dayTag === 'presencial') bgColor = `${colors.success}1a`; 

  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDropEvent = (e) => { 
    e.preventDefault(); 
    const taskId = e.dataTransfer.getData('taskId'); 
    if (taskId) onDrop(taskId, day); 
  };

  return (
    <div 
      onClick={onSelectDay}
      onDragOver={handleDragOver}
      onDrop={handleDropEvent}
      style={{
        minHeight: isMobile ? '120px' : '200px',position:'relative',padding:'6px',display:'flex',flexDirection:'column',gap:'4px',
        borderBottom:`1px solid ${colors.border}`,borderRight:`1px solid ${colors.border}`,
        backgroundColor:bgColor,opacity:isCurrentMonth?1:0.5,
        outline:isSelected?`2px solid ${colors.success}`:'none',cursor:'pointer'
      }}
    >
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
         <div style={{display:'flex',alignItems:'center',gap:'4px',flexWrap:'wrap'}}>
            <span
              onClick={(e) => { e.stopPropagation(); onToggleTag(); }}
              style={{
                fontSize:'16px',fontWeight:'700',borderRadius:'6px',padding:'2px 8px',cursor:'pointer',
                backgroundColor:isToday?colors.success:'transparent',
                color:isToday?colors.bgPrimary:colors.textPrimary,
                display:'inline-flex',alignItems:'center',gap:'4px',
                minHeight:'28px'
              }}
            >
              <span className="hide-on-mobile" style={{display:'none'}}></span>
              {isMobile && (
                <span style={{fontSize:'10px',fontWeight:'600',opacity:0.7,textTransform:'uppercase'}}>{DAYS_OF_WEEK[day.getDay()]}</span>
              )}
              {day.getDate()}
            </span>
            {hasOverlap && <span title="Actividades traslapadas en este día" style={{color:colors.danger,display:'flex',alignItems:'center',cursor:'help'}}><AlertTriangle size={16} /></span>}
            <div style={{display:'flex',gap:'2px',flexWrap:'wrap'}}>
               {dayMarkers.map((m, i) => {
                  if (m.type === 'payment') return <span key={i} style={{color:colors.gold,fontWeight:'bold',fontSize:'10px'}}>₡</span>;
                  if (m.type === 'holiday') return <Flag key={i} size={10} style={{color:colors.gold}} />;
                  if (m.type === 'efemeride') return <Leaf key={i} size={10} style={{color:colors.success}} />;
                  if (m.type === 'astro') return <Sun key={i} size={10} style={{color:colors.accent}} />;
                  if (m.type === 'astro_event') return <Star key={i} size={10} style={{color:colors.accent}} />;
                  if (m.type === 'moon') return <span key={i} style={{fontSize:'10px',color:colors.textSecondary}} title={m.name}>{m.icon}</span>;
                  return null;
               })}
            </div>
         </div>
         <button onClick={(e) => { e.stopPropagation(); onAddTask(); }} style={{opacity:0.5,backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted,padding:'2px'}}><Plus size={14}/></button>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'2px',overflowY:'auto',maxHeight:'120px'}}>
         {dayTasks.map(t => {
            const ti = activityTypes.find(at => at.id === t.typeId);
            const cost = calculateTaskCost(t, viaticumRates);
            const showBudgetWarning = isMonthOverBudget && cost > 0;
            
            return (
              <div 
                key={t.id} 
                draggable 
                onDragStart={(e) => e.dataTransfer.setData('taskId', t.id)}
                onClick={(e) => { e.stopPropagation(); onEditTask(t); }} 
                style={{
                  fontSize:'11px',padding:'4px 6px',borderRadius:'4px',borderLeft:`3px solid ${ti?.color || colors.border}`,
                  cursor:'pointer',overflow:'hidden',display:'flex',alignItems:'flex-start',gap:'3px',
                  backgroundColor:t.status === 'completed' ? colors.bgTertiary : t.status === 'in_progress' ? `${colors.success}22` : colors.bgPrimary,
                  color:t.status === 'completed' ? colors.textMuted : colors.textPrimary,
                  textDecoration:t.status === 'completed' ? 'line-through' : 'none',
                  opacity:t.status === 'completed' ? 0.6 : 1,
                  boxShadow:t.status === 'in_progress' ? `0 0 0 2px ${colors.success}, 0 0 6px ${colors.success}44` : 'none',
                  animation:t.status === 'in_progress' ? 'pulseGlow 2s ease-in-out infinite' : 'none'
                }}
              >
                 <GripVertical size={8} style={{opacity:0.5,marginTop:'2px',flexShrink:0}}/>
                 {t.status === 'in_progress' && <span style={{fontSize:'7px',fontWeight:'800',color:colors.success,backgroundColor:`${colors.success}22`,padding:'0 3px',borderRadius:'2px',lineHeight:'1.4',flexShrink:0,marginTop:'1px'}}>▶</span>}
                 {showBudgetWarning && <DollarSign size={10} color={colors.danger} style={{marginRight:'2px',marginTop:'2px',flexShrink:0}} />}
                 <div style={{display:'flex',flexDirection:'column',overflow:'hidden',lineHeight:'1.3',flex:1,minWidth:0}}>
                   <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{ti?.name || t.activityTypeName || 'Actividad'}</span>
                   {(t.fieldData?.expediente || t.caseExternalRefText || t.caseUid) && (() => {
                     const caseInfo = t.caseUid && cases ? cases.find(c => c.caseUid === t.caseUid) : null;
                     const caseLabel = caseInfo ? (caseInfo.title || caseInfo.caseType) : null;
                     const refLabel = t.fieldData?.expediente || t.caseExternalRefText;
                     const displayLabel = caseLabel || refLabel;
                     return displayLabel ? <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:'9px',opacity:0.7}}>{displayLabel}</span> : null;
                   })()}
                 </div>
                 <SyncIndicator taskId={t.id} taskSyncMap={taskSyncMap} lastBackupAt={lastBackupAt} onForceSync={onForceSync} colors={colors} size={10}/>
              </div>
            );
         })}
      </div>
    </div>
  );
};

// --- COMPONENTE DE SELECCIÓN CON BÚSQUEDA (AUTOCOMPLETE) ---
const SearchableSelect = ({ options, value, onChange, placeholder, colors, renderOption, getLabel, getValue }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(o => getValue(o) === value);
  const displayText = selectedOption ? getLabel(selectedOption) : '';

  useEffect(() => {
    if (!isOpen) setSearchText('');
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = searchText
    ? options.filter(o => getLabel(o).toLowerCase().includes(searchText.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} style={{position:'relative', width:'100%'}}>
      <div 
        onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 50); }}
        style={{
          width:'100%', backgroundColor:colors.bgPrimary, border:`1px solid ${isOpen ? colors.accent : colors.border}`,
          borderRadius:'6px', padding:'10px', color:colors.textPrimary, fontSize:'14px', cursor:'pointer',
          display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:'42px'
        }}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            placeholder={displayText || placeholder || 'Buscar...'}
            onClick={e => e.stopPropagation()}
            style={{
              flex:1, border:'none', outline:'none', backgroundColor:'transparent',
              color:colors.textPrimary, fontSize:'14px', padding:0
            }}
          />
        ) : (
          <span style={{color: displayText ? colors.textPrimary : colors.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
            {displayText || placeholder || 'Seleccione...'}
          </span>
        )}
        <ChevronRight size={14} style={{transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition:'transform 0.2s', color:colors.textMuted, flexShrink:0, marginLeft:'8px'}}/>
      </div>

      {isOpen && (
        <div style={{
          position:'absolute', top:'100%', left:0, right:0, zIndex:100,
          backgroundColor:colors.bgSecondary, border:`1px solid ${colors.accent}`,
          borderRadius:'0 0 6px 6px', boxShadow:'0 8px 24px rgba(0,0,0,0.4)',
          maxHeight:'220px', overflowY:'auto'
        }}>
          {filteredOptions.length === 0 ? (
            <div style={{padding:'12px', textAlign:'center', color:colors.textMuted, fontSize:'12px'}}>Sin resultados</div>
          ) : (
            filteredOptions.map((option, idx) => {
              const optValue = getValue(option);
              const isSelected = optValue === value;
              return (
                <div
                  key={idx}
                  onClick={() => { onChange(optValue); setIsOpen(false); setSearchText(''); }}
                  style={{
                    padding:'9px 12px', cursor:'pointer', fontSize:'13px',
                    backgroundColor: isSelected ? `${colors.accent}22` : 'transparent',
                    color: isSelected ? colors.accent : colors.textPrimary,
                    fontWeight: isSelected ? '600' : 'normal',
                    borderBottom: `1px solid ${colors.border}`,
                    display:'flex', alignItems:'center', gap:'8px'
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.backgroundColor = `${colors.accent}11`; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                >
                  {renderOption ? renderOption(option, isSelected) : getLabel(option)}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const TaskFormModalContent = ({ isOpen, onClose, task, day, onSave, onDelete, onDuplicate, tasks, colors, activityTypes, ppCodes, viaticumRates, currentMonthBudget, lodgingRates, sortedActivityTypes, getSortedSubtypes, taskSyncMap, lastBackupAt, onForceSync, cases, batches }) => {
   const isNew = !task;
   const taskStatus = task?.status || 'pending';
   
   const [form, setForm] = useState({ 
     typeId: 1, start: new Date(), end: new Date(), subtipo: '', observations: '', fieldData: {}, status: 'pending',
     repeat: { type: 'none' },
     logistics: { requiereVehiculo: false, dobleTraccion: false, tarjetaRuedo: false, viaticos: [], codigoPP: 'PPI-17-E18', lodgingLocation: null, lodgingCost: 0 }
   });
   
   const [showContinuationForm, setShowContinuationForm] = useState(false);
   const [contDate, setContDate] = useState('');
   const [contStart, setContStart] = useState('');
   const [contEnd, setContEnd] = useState('');
   const [showCloneForm, setShowCloneForm] = useState(false);
   const [cloneDate, setCloneDate] = useState('');
   const [cloneStart, setCloneStart] = useState('');
   const [cloneEnd, setCloneEnd] = useState('');
   const [showRepeat, setShowRepeat] = useState(false);
   const [overlapWarning, setOverlapWarning] = useState(null);
   const [currentCost, setCurrentCost] = useState(0);

   // Lodging Selection States
   const [selectedProvincia, setSelectedProvincia] = useState('');
   const [selectedCanton, setSelectedCanton] = useState('');
   const [selectedDistrito, setSelectedDistrito] = useState('');

   // Location & Contact States
   const [locationData, setLocationData] = useState({
     provincia: '',
     canton: '',
     distrito: '',
     lugar: '',
     otrasSenas: '',
     enlaceUbicacion: ''
   });
   const [contacts, setContacts] = useState([
     { nombre: '', telefono: '' }
   ]);

   // Filtered location data
   const [filteredCantones, setFilteredCantones] = useState([]);
   const [filteredDistritos, setFilteredDistritos] = useState([]);

   useEffect(() => {
      let initialForm;
      if(task) {
          initialForm = { 
            ...task, start: new Date(task.start), end: new Date(task.end), 
            logistics: task.logistics || { requiereVehiculo: false, dobleTraccion: false, tarjetaRuedo: false, viaticos: [], codigoPP: 'PPI-17-E18' },
            repeat: task.repeat || { type: 'none' },
            status: task.status || 'pending',
            seriesId: task.seriesId 
          };
          if(task.logistics && task.logistics.lodgingLocation) {
              setSelectedProvincia(task.logistics.lodgingLocation.provincia);
              setSelectedCanton(task.logistics.lodgingLocation.canton);
              setSelectedDistrito(task.logistics.lodgingLocation.distrito);
          } else {
              setSelectedProvincia(''); setSelectedCanton(''); setSelectedDistrito('');
          }
          
          // Load location and contact data if exists
          if (task.fieldData?.location) {
            setLocationData(task.fieldData.location);
            // Update filtered cantones based on provincia
            if (task.fieldData.location.provincia) {
              const provData = PROVINCIAS_CR.find(p => p.provincia === task.fieldData.location.provincia);
              if (provData) {
                setFilteredCantones(provData.cantones);
              }
            }
            // Update filtered distritos based on canton
            if (task.fieldData.location.canton) {
              const cantonData = filteredCantones.find(c => c.canton === task.fieldData.location.canton);
              if (cantonData) {
                setFilteredDistritos(cantonData.distritos);
              }
            }
          }
          if (task.fieldData?.contacts) {
            setContacts(task.fieldData.contacts);
          }
      } else if(day) {
         const s = new Date(day); s.setHours(8,0,0,0);
         initialForm = { typeId: 1, start: s, end: new Date(s.getTime()+90*60000), subtipo: '', observations: '', fieldData: {}, status: 'pending',
           repeat: { type: 'none' },
           logistics: { requiereVehiculo: false, dobleTraccion: false, tarjetaRuedo: false, viaticos: [], codigoPP: 'PPI-17-E18' }
         };
         setSelectedProvincia(''); setSelectedCanton(''); setSelectedDistrito('');
         setLocationData({
           provincia: '',
           canton: '',
           distrito: '',
           lugar: '',
           otrasSenas: '',
           enlaceUbicacion: ''
         });
         setContacts([{ nombre: '', telefono: '' }]);
      }
      setForm(initialForm);
      setOverlapWarning(null);
      
      const baseDate = task ? new Date(task.end) : new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      setContDate(toISODateString(baseDate));
      setContStart("08:00");
      setContEnd("12:00");
      setShowContinuationForm(false);
      
   }, [task, day, isOpen]);

   // Recalcular costo cada vez que cambian logistica o viaticos
   useEffect(() => {
       if (form) setCurrentCost(calculateTaskCost(form, viaticumRates));
   }, [form.logistics.viaticos, form.logistics.lodgingCost, viaticumRates]);

   const typeInfo = activityTypes.find(t => t.id === parseInt(form.typeId));
   const toInput = (d) => { if(!d) return ''; const x = new Date(d); x.setMinutes(x.getMinutes()-x.getTimezoneOffset()); return x.toISOString().slice(0,16); };

   const checkForOverlaps = (start, end) => {
    return tasks.filter(t => t.id !== task?.id && t.status !== 'completed' && checkOverlap(start.toISOString(), end.toISOString(), t.start, t.end));
   };

   const handleSave = (forcedStatus = null) => {
      const overlaps = checkForOverlaps(form.start, form.end);
      if (overlaps.length > 0 && !overlapWarning) { setOverlapWarning(overlaps); return; }
      
      // Combine location and contact data into fieldData
      const updatedFieldData = {
        ...form.fieldData,
        location: locationData,
        contacts: contacts
      };
      
      // Update the lugar field with formatted location
      if (locationData.provincia || locationData.canton || locationData.distrito || locationData.lugar || locationData.otrasSenas) {
        const lugarParts = [];
        if (locationData.provincia) lugarParts.push(locationData.provincia);
        if (locationData.canton) lugarParts.push(locationData.canton);
        if (locationData.distrito) lugarParts.push(locationData.distrito);
        if (locationData.lugar) lugarParts.push(locationData.lugar);
        if (locationData.otrasSenas) lugarParts.push(locationData.otrasSenas);
        updatedFieldData.lugar = lugarParts.join(', ');
      }
      
      const statusToSave = forcedStatus || form.status;
      const taskToSave = { 
        ...form, 
        fieldData: updatedFieldData,
        activityTypeName: typeInfo?.name || 'Actividad', 
        status: statusToSave 
      };
      onSave(taskToSave);
   };
   
   const handleConfirmContinuation = () => {
       if(!contDate || !contStart || !contEnd) return;
       const [y,m,d] = contDate.split('-').map(Number);
       const [sh, sm] = contStart.split(':').map(Number);
       const [eh, em] = contEnd.split(':').map(Number);
       const start = new Date(y, m-1, d, sh, sm);
       const end = new Date(y, m-1, d, eh, em);
       onDuplicate(task, start, end);
   };
   
   const handleConfirmClone = () => {
       if(!cloneDate || !cloneStart || !cloneEnd) return;
       const [y,m,d] = cloneDate.split('-').map(Number);
       const [sh, sm] = cloneStart.split(':').map(Number);
       const [eh, em] = cloneEnd.split(':').map(Number);
       const start = new Date(y, m-1, d, sh, sm);
       const end = new Date(y, m-1, d, eh, em);
       const clonedTask = { 
         ...form, 
         id: undefined, 
         seriesId: undefined, 
         sessions: [], 
         rescheduleCount: 0, 
         status: 'pending', 
         start: start.toISOString(), 
         end: end.toISOString(), 
         activityTypeName: typeInfo?.name || 'Actividad' 
       };
       onSave(clonedTask);
   };
   
   // Lodging Selection Logic
   const uniqueProvincias = useMemo(() => {
       if(!lodgingRates) return [];
       return [...new Set(lodgingRates.map(r => r.provincia))];
   }, [lodgingRates]);

   const filteredLodgingCantons = useMemo(() => {
       if(!selectedProvincia || !lodgingRates) return [];
       return [...new Set(lodgingRates.filter(r => r.provincia === selectedProvincia).map(r => r.canton))];
   }, [selectedProvincia, lodgingRates]);

   const filteredLodgingDistricts = useMemo(() => {
       if(!selectedProvincia || !selectedCanton || !lodgingRates) return [];
       const rates = lodgingRates.filter(r => r.provincia === selectedProvincia && r.canton === selectedCanton);
       let dists = [];
       rates.forEach(r => dists = [...dists, ...r.distritos]);
       return dists;
   }, [selectedProvincia, selectedCanton, lodgingRates]);

   const handleLodgingChange = (distrito) => {
       setSelectedDistrito(distrito);
       if(distrito && lodgingRates) {
           const rateObj = lodgingRates.find(r => r.provincia === selectedProvincia && r.canton === selectedCanton && r.distritos.includes(distrito));
           if(rateObj) {
               setForm({
                   ...form, 
                   logistics: {
                       ...form.logistics, 
                       lodgingLocation: { provincia: selectedProvincia, canton: selectedCanton, distrito },
                       lodgingCost: rateObj.monto
                   }
               });
           }
       }
   };

   // Location Handlers
   const handleProvinciaChange = (provincia) => {
     setLocationData({...locationData, provincia, canton: '', distrito: ''});
     const provData = PROVINCIAS_CR.find(p => p.provincia === provincia);
     setFilteredCantones(provData ? provData.cantones : []);
     setFilteredDistritos([]);
   };

   const handleCantonChange = (canton) => {
     setLocationData({...locationData, canton, distrito: ''});
     const cantonData = filteredCantones.find(c => c.canton === canton);
     setFilteredDistritos(cantonData ? cantonData.distritos : []);
   };

   const handleDistritoChange = (distrito) => {
     setLocationData({...locationData, distrito});
   };

   const handleLocationFieldChange = (field, value) => {
     setLocationData({...locationData, [field]: value});
   };

   // Contact Handlers
   const handleContactChange = (index, field, value) => {
     const newContacts = [...contacts];
     newContacts[index][field] = value;
     setContacts(newContacts);
   };

   const addContact = () => {
     if (contacts.length < 2) {
       setContacts([...contacts, { nombre: '', telefono: '' }]);
     }
   };

   const removeContact = (index) => {
     if (contacts.length > 1) {
       const newContacts = contacts.filter((_, i) => i !== index);
       setContacts(newContacts);
     }
   };

   // Copy location link to clipboard
   const copyLocationLink = () => {
     if (locationData.enlaceUbicacion) {
       navigator.clipboard.writeText(locationData.enlaceUbicacion);
       alert('Enlace copiado al portapapeles');
     }
   };

   const isBudgetExceeded = currentMonthBudget && (currentMonthBudget.spent + currentCost - (task ? calculateTaskCost(task, viaticumRates) : 0)) > currentMonthBudget.limit;

   const inputStyle = {width:'100%',backgroundColor:colors.bgPrimary,border:`1px solid ${colors.border}`,borderRadius:'6px',padding:'10px',color:colors.textPrimary,fontSize:'14px'};
   const labelStyle = {display:'block',fontSize:'11px',color:colors.textMuted,textTransform:'uppercase',fontWeight:'bold',marginBottom:'4px'};

   // Check if this activity type requires location & contact section
   const requiresLocationContact = [3, 10, 11, 12].includes(parseInt(form.typeId));

   return (
      <Modal isOpen={isOpen} onClose={onClose} title={isNew ? "Nueva Actividad" : "Detalle de Actividad"} colors={colors}>
         <div style={{display:'flex',flexDirection:'column',gap:'16px',color:colors.textSecondary}}>
            
            {/* Indicador de sincronización */}
            {!isNew && task?.id && (
              <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 12px',backgroundColor:colors.bgTertiary,borderRadius:'8px',fontSize:'12px',color:colors.textSecondary}}>
                <SyncIndicator taskId={task.id} taskSyncMap={taskSyncMap} lastBackupAt={lastBackupAt} onForceSync={onForceSync} colors={colors} size={16}/>
                <span style={{fontWeight:'500'}}>{(() => {
                  const info = taskSyncMap[task.id];
                  const st = info?.status || 'synced';
                  const backed = lastBackupAt && info?.at && info.at <= lastBackupAt;
                  if (st === 'saving') return 'Guardando en Firebase...';
                  if (st === 'error') return 'Error de sincronización — clic para reintentar';
                  if (backed) return 'Sincronizado + Respaldado';
                  return 'Sincronizado en Firebase';
                })()}</span>
              </div>
            )}

            {!isNew && !showContinuationForm && (
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', paddingBottom:'12px', borderBottom:`1px solid ${colors.border}`}}>
                    {taskStatus !== 'in_progress' && (
                        <button onClick={() => handleSave('in_progress')} style={{flex:1, padding:'10px', borderRadius:'6px', fontWeight:'bold', backgroundColor:colors.success, color:colors.bgPrimary, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>
                            <PlayCircle size={18}/> Iniciar
                        </button>
                    )}
                    {taskStatus === 'in_progress' && (
                        <button onClick={() => handleSave('paused')} style={{flex:1, padding:'10px', borderRadius:'6px', fontWeight:'bold', backgroundColor:colors.warning, color:colors.bgPrimary, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>
                            <PauseCircle size={18}/> Pausar
                        </button>
                    )}
                    {taskStatus !== 'completed' && (
                        <button onClick={() => handleSave('completed')} style={{flex:1, padding:'10px', borderRadius:'6px', fontWeight:'bold', backgroundColor:colors.accent, color:colors.bgPrimary, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}>
                            <CheckCircle size={18}/> Finalizar
                        </button>
                    )}
                </div>
            )}
            
            {!isNew && !showContinuationForm && !showCloneForm && (
                <div style={{display:'flex', gap:'8px', flexWrap:'wrap', justifyContent: 'space-between'}}>
                    <button onClick={() => document.getElementById('start-date-input')?.focus()} style={{padding:'8px 12px', borderRadius:'6px', fontSize:'12px', backgroundColor:colors.bgTertiary, color:colors.textMuted, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}><Calendar size={14}/> Reprogramar</button>
                    <button onClick={() => setShowContinuationForm(true)} style={{padding:'8px 12px', borderRadius:'6px', fontSize:'12px', backgroundColor:colors.bgTertiary, color:colors.textMuted, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}><ArrowRightCircle size={14}/> Programar Continuación</button>
                    <button onClick={() => { setShowCloneForm(true); const s = new Date(form.start); const e = new Date(form.end); setCloneDate(toISODateString(s)); setCloneStart(s.toTimeString().slice(0,5)); setCloneEnd(e.toTimeString().slice(0,5)); }} style={{padding:'8px 12px', borderRadius:'6px', fontSize:'12px', backgroundColor:colors.bgTertiary, color:colors.textMuted, border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}><Copy size={14}/> Clonar</button>
                    {taskStatus !== 'pending' && (
                        <button onClick={() => { if(confirm('¿Reiniciar esta actividad? Se borrarán las sesiones de tiempo y el estado volverá a "Pendiente".')) { setForm(f => ({ ...f, sessions: [], status: 'pending' })); onSave({ ...form, sessions: [], status: 'pending', activityTypeName: typeInfo?.name || 'Actividad' }); }}} style={{padding:'8px 12px', borderRadius:'6px', fontSize:'12px', backgroundColor:colors.danger+'15', color:colors.danger, border:`1px solid ${colors.danger}33`, cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}><RotateCcw size={14}/> Reiniciar</button>
                    )}
                    <button onClick={() => onDelete(task.id)} style={{color:colors.warning, backgroundColor:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px', fontSize:'12px'}}><Trash2 size={14}/></button>
                </div>
            )}

            {showCloneForm && (
                <div style={{backgroundColor:colors.bgTertiary, padding:'12px', borderRadius:'8px', border:`1px solid ${colors.success}`}}>
                    <h4 style={{fontSize:'12px', fontWeight:'bold', color:colors.success, marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px'}}><Copy size={14}/> Clonar Actividad</h4>
                    <p style={{fontSize:'11px', color:colors.textMuted, marginBottom:'12px'}}>Se creará una copia independiente de esta actividad con toda su información. Ajuste la fecha y hora de la copia.</p>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
                        <div style={{gridColumn:'span 2'}}>
                            <label style={labelStyle}>Fecha</label>
                            <input type="date" style={inputStyle} value={cloneDate} onChange={e => setCloneDate(e.target.value)} />
                        </div>
                        <div><label style={labelStyle}>Inicio</label><input type="time" style={inputStyle} value={cloneStart} onChange={e => setCloneStart(e.target.value)} /></div>
                        <div><label style={labelStyle}>Fin</label><input type="time" style={inputStyle} value={cloneEnd} onChange={e => setCloneEnd(e.target.value)} /></div>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                        <button onClick={() => setShowCloneForm(false)} style={{flex:1, padding:'8px', backgroundColor:'transparent', border:`1px solid ${colors.border}`, color:colors.textMuted, borderRadius:'6px', cursor:'pointer'}}>Cancelar</button>
                        <button onClick={handleConfirmClone} style={{flex:1, padding:'8px', backgroundColor:colors.success, color:colors.bgPrimary, fontWeight:'bold', borderRadius:'6px', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px'}}><Copy size={14}/> Clonar</button>
                    </div>
                </div>
            )}

            {showContinuationForm && (
                <div style={{backgroundColor:colors.bgTertiary, padding:'12px', borderRadius:'8px', border:`1px solid ${colors.accent}`}}>
                    <h4 style={{fontSize:'12px', fontWeight:'bold', color:colors.accent, marginBottom:'12px', display:'flex', alignItems:'center', gap:'6px'}}><CalendarPlus size={14}/> Programar Siguiente Sesión</h4>
                    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px'}}>
                        <div style={{gridColumn:'span 2'}}>
                            <label style={labelStyle}>Fecha</label>
                            <input type="date" style={inputStyle} value={contDate} onChange={e => setContDate(e.target.value)} />
                        </div>
                        <div><label style={labelStyle}>Inicio</label><input type="time" style={inputStyle} value={contStart} onChange={e => setContStart(e.target.value)} /></div>
                        <div><label style={labelStyle}>Fin</label><input type="time" style={inputStyle} value={contEnd} onChange={e => setContEnd(e.target.value)} /></div>
                    </div>
                    <div style={{display:'flex', gap:'8px'}}>
                        <button onClick={() => setShowContinuationForm(false)} style={{flex:1, padding:'8px', backgroundColor:'transparent', border:`1px solid ${colors.border}`, color:colors.textMuted, borderRadius:'6px', cursor:'pointer'}}>Cancelar</button>
                        <button onClick={handleConfirmContinuation} style={{flex:1, padding:'8px', backgroundColor:colors.accent, color:colors.bgPrimary, fontWeight:'bold', borderRadius:'6px', border:'none', cursor:'pointer'}}>Confirmar</button>
                    </div>
                </div>
            )}
            
            {/* Overlap Warning */}
            {overlapWarning && (
              <div style={{padding:'12px',backgroundColor:`${colors.danger}1a`,border:`1px solid ${colors.danger}`,borderRadius:'8px',color:colors.danger}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',fontWeight:'bold',marginBottom:'4px'}}><AlertTriangle size={16}/> Conflicto de Horario</div>
                <p style={{fontSize:'12px',marginBottom:'8px'}}>Esta actividad choca con: {overlapWarning.map(t => t.activityTypeName).join(', ')}</p>
                <div style={{display:'flex',gap:'8px'}}>
                  <button onClick={() => setOverlapWarning(null)} style={{padding:'6px 12px',backgroundColor:`${colors.danger}33`,borderRadius:'4px',fontSize:'12px',border:'none',color:colors.danger,cursor:'pointer'}}>Cancelar</button>
                  <button onClick={() => onSave({ ...form, activityTypeName: typeInfo?.name })} style={{padding:'6px 12px',backgroundColor:colors.danger,color:'white',borderRadius:'4px',fontSize:'12px',border:'none',cursor:'pointer'}}>Guardar de todos modos</button>
                </div>
              </div>
            )}

            {isBudgetExceeded && currentCost > 0 && (
                <div style={{padding:'12px',backgroundColor:`${colors.danger}1a`,border:`1px solid ${colors.danger}`,borderRadius:'8px',color:colors.danger, display:'flex', alignItems:'center', gap:'12px'}}>
                    <DollarSign size={24} />
                    <div>
                        <div style={{fontWeight:'bold'}}>Límite Presupuestario Excedido</div>
                        <div style={{fontSize:'12px'}}>Esta actividad excede el presupuesto disponible del mes.</div>
                    </div>
                </div>
            )}
            
            <div>
               <label style={labelStyle}>Tipo de Actividad</label>
               <SearchableSelect
                 options={sortedActivityTypes || activityTypes}
                 value={form.typeId}
                 onChange={val => setForm({...form, typeId: parseInt(val), subtipo: ''})}
                 placeholder="Buscar tipo de actividad..."
                 colors={colors}
                 getLabel={t => t.name}
                 getValue={t => t.id}
                 renderOption={(t, isSelected) => (
                   <>
                     <div style={{width:'12px',height:'12px',borderRadius:'50%',backgroundColor:t.color,flexShrink:0}}></div>
                     <span>{t.name}</span>
                   </>
                 )}
               />
            </div>

            {typeInfo?.subtypes?.length > 0 && (
               <div>
                  <label style={labelStyle}>Subtipo</label>
                  <SearchableSelect
                    options={(getSortedSubtypes ? getSortedSubtypes(form.typeId, typeInfo.subtypes) : typeInfo.subtypes).map(s => ({label: s, value: s}))}
                    value={form.subtipo}
                    onChange={val => setForm({...form, subtipo: val})}
                    placeholder="Buscar subtipo..."
                    colors={colors}
                    getLabel={o => o.label}
                    getValue={o => o.value}
                  />
               </div>
            )}

            {typeInfo?.fields?.map(field => (
              <div key={field}>
                <label style={labelStyle}>{FIELD_LABELS[field] || field}</label>
                <input type="text" style={inputStyle} value={form.fieldData?.[field] || ''} onChange={e => setForm({ ...form, fieldData: { ...form.fieldData, [field]: e.target.value } })}/>
              </div>
            ))}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'16px'}}>
               <div><label style={labelStyle}>Inicio</label><input id="start-date-input" type="datetime-local" style={inputStyle} value={toInput(form.start)} onChange={e=>setForm({...form, start: new Date(e.target.value)})}/></div>
               <div><label style={labelStyle}>Fin</label><input type="datetime-local" style={inputStyle} value={toInput(form.end)} onChange={e=>setForm({...form, end: new Date(e.target.value)})}/></div>
            </div>

            <div style={{borderTop:`1px solid ${colors.border}`,paddingTop:'12px'}}>
               <button onClick={() => setShowRepeat(!showRepeat)} style={{display:'flex',alignItems:'center',gap:'4px',fontSize:'12px',color:colors.accent,backgroundColor:'transparent',border:'none',cursor:'pointer',marginBottom:'8px'}}><Repeat size={12}/> Repetición {form.repeat.type !== 'none' && '(Activa)'}</button>
               {showRepeat && (
                 <div style={{padding:'12px',backgroundColor:colors.bgPrimary,borderRadius:'8px',border:`1px solid ${colors.border}`}}>
                    <select style={{...inputStyle,marginBottom:'8px'}} value={form.repeat.type} onChange={e => setForm({...form, repeat: { ...form.repeat, type: e.target.value }})}>
                       <option value="none">No repetir</option>
                       <option value="daily">Diariamente</option>
                       <option value="weekly">Semanalmente</option>
                    </select>
                    {form.repeat.type === 'weekly' && (
                       <div style={{display:'flex',gap:'4px',flexWrap:'wrap'}}>
                          {DAYS_OF_WEEK.map((d, i) => (
                             <button key={i} onClick={() => {
                                const days = form.repeat.days || [];
                                const newDays = days.includes(i) ? days.filter(x => x !== i) : [...days, i];
                                setForm({...form, repeat: { ...form.repeat, days: newDays }});
                             }} style={{padding:'6px 10px',borderRadius:'4px',fontSize:'12px',border:'none',cursor:'pointer',backgroundColor:form.repeat.days?.includes(i)?colors.success:colors.bgTertiary,color:form.repeat.days?.includes(i)?colors.bgPrimary:colors.textMuted}}>{d}</button>
                          ))}
                       </div>
                    )}
                 </div>
               )}
            </div>

            {/* UBICACIÓN Y CONTACTO - Solo para tipos específicos */}
            {requiresLocationContact && (
              <div style={{borderTop:`1px solid ${colors.border}`,paddingTop:'12px'}}>
                 <h4 style={{fontSize:'11px',fontWeight:'bold',color:colors.textMuted,textTransform:'uppercase',marginBottom:'8px'}}>Ubicación y Contacto</h4>
                 
                 {/* UBICACIÓN */}
                 <div style={{backgroundColor:colors.bgPrimary,padding:'12px',borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'12px'}}>
                    <h5 style={{fontSize:'10px',fontWeight:'bold',color:colors.accent,marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px'}}><MapPin size={10}/> Ubicación</h5>
                    
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
                      <div>
                        <label style={labelStyle}>Provincia</label>
                        <select 
                          value={locationData.provincia} 
                          onChange={e => handleProvinciaChange(e.target.value)}
                          style={{...inputStyle, padding:'6px'}}
                        >
                          <option value="">Seleccione...</option>
                          {PROVINCIAS_CR.map(p => (
                            <option key={p.provincia} value={p.provincia}>{p.provincia}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={labelStyle}>Cantón</label>
                        <select 
                          value={locationData.canton} 
                          onChange={e => handleCantonChange(e.target.value)}
                          disabled={!locationData.provincia}
                          style={{...inputStyle, padding:'6px'}}
                        >
                          <option value="">Seleccione...</option>
                          {filteredCantones.map(c => (
                            <option key={c.canton} value={c.canton}>{c.canton}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div style={{marginBottom:'8px'}}>
                      <label style={labelStyle}>Distrito</label>
                      <select 
                        value={locationData.distrito} 
                        onChange={e => handleDistritoChange(e.target.value)}
                        disabled={!locationData.canton}
                        style={{...inputStyle, padding:'6px'}}
                      >
                        <option value="">Seleccione...</option>
                        {filteredDistritos.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{marginBottom:'8px'}}>
                      <label style={labelStyle}>Lugar</label>
                      <input
                        type="text"
                        value={locationData.lugar || ''}
                        onChange={e => handleLocationFieldChange('lugar', e.target.value)}
                        style={{...inputStyle, padding:'6px'}}
                        placeholder="Nombre del lugar específico..."
                      />
                    </div>

                    <div style={{marginBottom:'8px'}}>
                      <label style={labelStyle}>Otras señas</label>
                      <textarea
                        value={locationData.otrasSenas}
                        onChange={e => handleLocationFieldChange('otrasSenas', e.target.value)}
                        style={{...inputStyle, padding:'6px', height:'60px'}}
                        placeholder="Detalles de la ubicación..."
                      />
                    </div>

                    <div>
                      <label style={labelStyle}>Enlace de ubicación (Waze o Maps)</label>
                      <div style={{display:'flex', gap:'4px', marginBottom:'4px'}}>
                        <input 
                          type="text" 
                          value={locationData.enlaceUbicacion} 
                          onChange={e => handleLocationFieldChange('enlaceUbicacion', e.target.value)}
                          style={{...inputStyle, padding:'6px', flex:1}}
                          placeholder="https://waze.com/ul/... o https://maps.app.goo.gl/..."
                        />
                        <button 
                          type="button"
                          onClick={copyLocationLink}
                          style={{padding:'6px 8px', backgroundColor:colors.bgTertiary, color:colors.textPrimary, border:`1px solid ${colors.border}`, borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', gap:'2px'}}
                          title="Copiar enlace"
                        >
                          <Copy size={12}/>
                        </button>
                      </div>
                      <div style={{display:'flex', gap:'4px'}}>
                        <button 
                          type="button"
                          onClick={() => {
                            if (locationData.enlaceUbicacion) {
                              window.open(locationData.enlaceUbicacion, '_blank');
                            }
                          }}
                          disabled={!locationData.enlaceUbicacion}
                          style={{padding:'6px 12px', backgroundColor:colors.accent, color:colors.bgPrimary, border:'none', borderRadius:'4px', cursor:'pointer', flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:'4px', opacity: locationData.enlaceUbicacion ? 1 : 0.5}}
                        >
                          <ExternalLink size={12}/> Abrir enlace
                        </button>
                      </div>
                    </div>
                 </div>
                 
                 {/* CONTACTOS */}
                 <div style={{backgroundColor:colors.bgPrimary,padding:'12px',borderRadius:'8px',border:`1px solid ${colors.border}`}}>
                    <h5 style={{fontSize:'10px',fontWeight:'bold',color:colors.accent,marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px'}}><User size={10}/> Contactos</h5>
                    
                    {contacts.map((contact, index) => (
                      <div key={index} style={{marginBottom:'12px', borderBottom:`1px solid ${colors.border}`, paddingBottom:'12px'}}>
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px'}}>
                          <div>
                            <label style={labelStyle}>Nombre</label>
                            <input 
                              type="text" 
                              value={contact.nombre} 
                              onChange={e => handleContactChange(index, 'nombre', e.target.value)}
                              style={{...inputStyle, padding:'6px'}}
                              placeholder="Nombre completo"
                            />
                          </div>
                          <div>
                            <label style={labelStyle}>Teléfono</label>
                            <input 
                              type="text" 
                              value={contact.telefono} 
                              onChange={e => handleContactChange(index, 'telefono', e.target.value)}
                              style={{...inputStyle, padding:'6px'}}
                              placeholder="Número telefónico"
                            />
                          </div>
                        </div>
                        {contacts.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => removeContact(index)}
                            style={{marginTop:'8px', padding:'4px 8px', backgroundColor:colors.danger, color:colors.bgPrimary, border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'10px', display:'flex', alignItems:'center', gap:'2px'}}
                          >
                            <Trash2 size={10}/> Eliminar contacto
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {contacts.length < 2 && (
                      <button 
                        type="button"
                        onClick={addContact}
                        style={{padding:'6px 12px', backgroundColor:colors.bgTertiary, color:colors.textPrimary, border:`1px solid ${colors.border}`, borderRadius:'4px', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px'}}
                      >
                        <Plus size={12}/> Agregar segundo contacto
                      </button>
                    )}
                 </div>
              </div>
            )}

            {typeInfo?.logistics && (
              <div style={{borderTop:`1px solid ${colors.border}`,paddingTop:'12px'}}>
                 <h4 style={{fontSize:'11px',fontWeight:'bold',color:colors.textMuted,textTransform:'uppercase',marginBottom:'8px'}}>Logística</h4>
                 <div style={{backgroundColor:colors.bgPrimary,padding:'12px',borderRadius:'8px',border:`1px solid ${colors.border}`}}>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'12px'}}>
                      <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:colors.textSecondary}}><input type="checkbox" checked={form.logistics.requiereVehiculo} onChange={e => setForm({...form, logistics: {...form.logistics, requiereVehiculo: e.target.checked}})}/> Vehículo</label>
                      <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:colors.textSecondary}}><input type="checkbox" checked={form.logistics.dobleTraccion} onChange={e => setForm({...form, logistics: {...form.logistics, dobleTraccion: e.target.checked}})}/> Doble Tracción</label>
                      <label style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:colors.textSecondary}}><input type="checkbox" checked={form.logistics.tarjetaRuedo} onChange={e => setForm({...form, logistics: {...form.logistics, tarjetaRuedo: e.target.checked}})}/> Tarjeta Ruedo</label>
                    </div>
                    
                    <div style={{borderTop:`1px solid ${colors.border}`,paddingTop:'8px'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'6px'}}>
                          <h5 style={{fontSize:'10px',fontWeight:'bold',color:colors.textSecondary,margin:0}}>VIÁTICOS</h5>
                          <span style={{fontSize:'11px',fontWeight:'bold',color:colors.success}}>{formatMoney(currentCost)}</span>
                      </div>
                      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'8px'}}>
                        {['Desayuno', 'Almuerzo', 'Cena', 'Hospedaje'].map(v => (
                           <label key={v} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'12px',color:colors.textSecondary}}>
                             <input type="checkbox" checked={(form.logistics.viaticos || []).includes(v)} onChange={e => {
                               const current = form.logistics.viaticos || [];
                               let updated = e.target.checked ? [...current, v] : current.filter(x => x !== v);
                               if(!e.target.checked && v === 'Hospedaje') {
                                   // Clear lodging data if unchecked
                                   setForm({...form, logistics: {...form.logistics, viaticos: updated, lodgingLocation: null, lodgingCost: 0}});
                                   setSelectedProvincia(''); setSelectedCanton(''); setSelectedDistrito('');
                               } else {
                                   setForm({...form, logistics: {...form.logistics, viaticos: updated}});
                               }
                             }}/> {v}
                           </label>
                        ))}
                      </div>
                      
                      {/* SELECCIÓN DE HOSPEDAJE */}
                      {form.logistics.viaticos && form.logistics.viaticos.includes('Hospedaje') && lodgingRates && lodgingRates.length > 0 && (
                          <div style={{marginTop:'12px', padding:'10px', backgroundColor:colors.bgSecondary, borderRadius:'6px', border:`1px solid ${colors.accent}`}}>
                              <h5 style={{fontSize:'10px',fontWeight:'bold',color:colors.accent,marginBottom:'8px',display:'flex',alignItems:'center',gap:'4px'}}><MapPin size={10}/> Destino Hospedaje</h5>
                              <div style={{display:'grid', gap:'8px'}}>
                                  <select value={selectedProvincia} onChange={e => { setSelectedProvincia(e.target.value); setSelectedCanton(''); setSelectedDistrito(''); }} style={{padding:'6px', fontSize:'11px', borderRadius:'4px', border:`1px solid ${colors.border}`, backgroundColor:colors.bgPrimary, color:colors.textPrimary}}>
                                      <option value="">Provincia...</option>
                                      {uniqueProvincias.map(p => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                  <select value={selectedCanton} onChange={e => { setSelectedCanton(e.target.value); setSelectedDistrito(''); }} disabled={!selectedProvincia} style={{padding:'6px', fontSize:'11px', borderRadius:'4px', border:`1px solid ${colors.border}`, backgroundColor:colors.bgPrimary, color:colors.textPrimary}}>
                                      <option value="">Cantón...</option>
                                      {filteredLodgingCantons.map(c => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  <select value={selectedDistrito} onChange={e => handleLodgingChange(e.target.value)} disabled={!selectedCanton} style={{padding:'6px', fontSize:'11px', borderRadius:'4px', border:`1px solid ${colors.border}`, backgroundColor:colors.bgPrimary, color:colors.textPrimary}}>
                                      <option value="">Distrito...</option>
                                      {filteredLodgingDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>
                              </div>
                              {form.logistics.lodgingCost > 0 && (
                                  <div style={{marginTop:'8px', fontSize:'11px', color:colors.success, textAlign:'right'}}>Tarifa: {formatMoney(form.logistics.lodgingCost)}</div>
                              )}
                          </div>
                      )}
                    </div>
                    
                    <div style={{marginTop:'12px'}}>
                      <label style={{fontSize:'10px',fontWeight:'bold',color:colors.textSecondary}}>Código PP</label>
                      <input list="ppCodesList" type="text" style={{...inputStyle,marginTop:'4px',padding:'6px'}} value={form.logistics.codigoPP} onChange={e => setForm({...form, logistics: {...form.logistics, codigoPP: e.target.value}})}/>
                      <datalist id="ppCodesList">
                          {ppCodes.map((pp, i) => <option key={i} value={typeof pp === 'string' ? pp : pp.code} label={typeof pp === 'string' ? '' : pp.description} />)}
                      </datalist>
                    </div>
                 </div>
              </div>
            )}

            {/* Sección Caso / Expediente (opcional) */}
            {cases && <CaseLinkSection form={form} setForm={setForm} cases={cases} colors={colors} tasks={tasks} />}

            {/* Sección Lote (opcional) */}
            {batches && <BatchLinkSection form={form} setForm={setForm} batches={batches} colors={colors} />}

            <div>
               <label style={labelStyle}>Observaciones</label>
               <textarea style={{...inputStyle,height:'80px',resize:'vertical'}} value={form.observations} onChange={e=>setForm({...form, observations: e.target.value})}></textarea>
            </div>
            <div style={{paddingTop:'16px',display:'flex',justifyContent:'flex-end',gap:'8px'}}>
               <button onClick={onClose} style={{padding:'10px 20px',backgroundColor:'transparent',border:'none',color:colors.textMuted,cursor:'pointer'}}>Cancelar</button>
               {!isNew && form.status !== 'in_progress' && (
                   <button onClick={() => { onSave({ ...form, activityTypeName: typeInfo?.name || 'Actividad', status: 'in_progress' }); }} style={{padding:'10px 20px',backgroundColor:colors.accent,color:colors.bgPrimary,fontWeight:'bold',borderRadius:'6px',border:'none',cursor:'pointer', display:'flex', alignItems:'center', gap:'6px'}}><PlayCircle size={16}/> Iniciar</button>
               )}
               <button onClick={() => handleSave()} style={{padding:'10px 20px',backgroundColor:colors.success,color:colors.bgPrimary,fontWeight:'bold',borderRadius:'6px',border:'none',cursor:'pointer', display:'flex', alignItems:'center', gap:'4px'}}><Save size={16}/> Guardar</button>
            </div>
         </div>
      </Modal>
   );
};

const ReportsModal = ({ isOpen, onClose, tasks, markers, dayOverrides, colors, onImportBackup, activityTypes, viaticumRates, trashTasks, onExportBackup, onImportBackupJSON, onUploadBackupToStorage, onListStorageBackups, onRestoreFromStorage, cases, batches }) => {
  const [activeTab, setActiveTab] = useState('prog_real');
  const [executedStart, setExecutedStart] = useState('');
  const [executedEnd, setExecutedEnd] = useState('');
  const [scheduledStart, setScheduledStart] = useState('');
  const [scheduledEnd, setScheduledEnd] = useState('');
  const [teleworkStart, setTeleworkStart] = useState('');
  const [teleworkEnd, setTeleworkEnd] = useState('');
  const fileInputRef = useRef(null);
  const jsonFileInputRef = useRef(null);
  const [storageBackups, setStorageBackups] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const todayStr = toISODateString(today);
      
      // Función para verificar si es día hábil
      const isWorkingDay = (date) => {
        const day = date.getDay();
        const isoDate = toISODateString(date);
        const isHoliday = HOLIDAYS_CR_2026.some(h => h.date === isoDate);
        return day !== 0 && day !== 6 && !isHoliday;
      };

      // ========== CORRECCIÓN PARA ACTIVIDADES REALIZADAS ==========
      // Hasta: último día hábil anterior (excluyendo hoy)
      let lastWorkingDay = new Date(today);
      lastWorkingDay.setDate(lastWorkingDay.getDate() - 1);
      
      // Retroceder hasta encontrar un día hábil
      while (!isWorkingDay(lastWorkingDay)) {
        lastWorkingDay.setDate(lastWorkingDay.getDate() - 1);
      }

      // Desde: El lunes de la semana del "lastWorkingDay"
      let previousMonday = new Date(lastWorkingDay);
      const dayOfWeek = previousMonday.getDay();
      // Cálculo correcto para obtener el lunes
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      previousMonday.setDate(previousMonday.getDate() + diffToMonday);
      
      // Asegurar que el lunes también sea hábil
      while (!isWorkingDay(previousMonday)) {
        previousMonday.setDate(previousMonday.getDate() - 1);
      }

      // ========== CORRECCIÓN PARA ACTIVIDADES PROGRAMADAS ==========
      // Desde: Hoy si es hábil, sino siguiente hábil
      let scheduleStart = new Date(today);
      while (!isWorkingDay(scheduleStart)) {
        scheduleStart.setDate(scheduleStart.getDate() + 1);
      }

      // Hasta: Viernes de esta semana (ajustar si no es hábil)
      let nextFriday = new Date(scheduleStart);
      const fridayDiff = (5 - nextFriday.getDay() + 7) % 7;
      nextFriday.setDate(nextFriday.getDate() + fridayDiff);
      
      // Asegurar que sea día hábil
      while (!isWorkingDay(nextFriday)) {
        nextFriday.setDate(nextFriday.getDate() - 1);
      }

      setExecutedStart(toISODateString(previousMonday));
      setExecutedEnd(toISODateString(lastWorkingDay));
      setScheduledStart(toISODateString(scheduleStart));
      setScheduledEnd(toISODateString(nextFriday));
      setTeleworkStart('2026-01-01');
      setTeleworkEnd('2026-01-31');
    }
  }, [isOpen]);

  const reportData = useMemo(() => {
    // Parsear fechas correctamente para evitar problemas de zona horaria
    const parseLocalDate = (dateStr) => {
      if (!dateStr) return new Date();
      const [y, m, d] = dateStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    
    // Función para obtener solo la fecha (YYYY-MM-DD) de un timestamp y convertirla a Date local
    const getDateOnly = (dateInput) => {
      // Usar toISODateString que ya maneja correctamente la zona horaria
      const isoStr = toISODateString(new Date(dateInput));
      const [y, m, d] = isoStr.split('-').map(Number);
      return new Date(y, m - 1, d);
    };
    
    const execStart = parseLocalDate(executedStart);
    const execEnd = parseLocalDate(executedEnd);
    const schedStart = parseLocalDate(scheduledStart);
    const schedEnd = parseLocalDate(scheduledEnd);

    const realized = tasks.filter(t => {
        const taskDate = getDateOnly(t.start);
        const inRange = taskDate >= execStart && taskDate <= execEnd;
        const hasWork = (t.sessions && t.sessions.length > 0) || t.status === 'completed' || t.status === 'in_progress';
        return inRange && hasWork;
    }).sort((a, b) => new Date(a.start) - new Date(b.start)); // Orden cronológico ascendente

    // Actividades programadas: incluir pending, in_progress y paused (no completadas)
    const scheduled = tasks.filter(t => {
        const taskDate = getDateOnly(t.start);
        const inRange = taskDate >= schedStart && taskDate <= schedEnd;
        return t.status !== 'completed' && inRange;
    }).sort((a, b) => new Date(a.start) - new Date(b.start)); // Orden cronológico ascendente

    const pending = tasks.filter(t => t.status !== 'completed' && (new Date(t.end) < new Date() || t.status === 'paused'))
                         .sort((a, b) => new Date(a.start) - new Date(b.start)); // Orden cronológico ascendente

    return { realized, scheduled, pending };
  }, [tasks, executedStart, executedEnd, scheduledStart, scheduledEnd]);

  // --- NUEVOS REPORTES ---
  const ppStats = useMemo(() => {
    const stats = {};
    tasks.forEach(t => {
        if (t.status === 'completed') {
            const pp = t.logistics?.codigoPP || 'Sin Asignar';
            const cost = calculateTaskCost(t, viaticumRates);
            stats[pp] = (stats[pp] || 0) + cost;
        }
    });
    return stats;
  }, [tasks, viaticumRates]);

  const monthlyDetails = useMemo(() => {
    return tasks.map(t => {
        const date = new Date(t.start);
        const month = MONTH_NAMES[date.getMonth()];
        const pp = t.logistics?.codigoPP || 'Sin Asignar';
        const planned = calculateTaskCost(t, viaticumRates);
        const executed = t.status === 'completed' ? planned : 0;
        const desc = `${t.activityTypeName} ${t.subtipo ? '- ' + t.subtipo : ''} ${t.fieldData?.expediente ? 'Exp: ' + t.fieldData.expediente : ''} ${t.fieldData?.informe ? 'Inf: ' + t.fieldData.informe : ''}`;
        return { month, pp, planned, executed, desc, sortDate: date };
    }).sort((a,b) => a.sortDate - b.sortDate);
  }, [tasks, viaticumRates]);
  // -----------------------

  const teleworkReportData = useMemo(() => {
    if (!teleworkStart || !teleworkEnd) return [];
    const [startY, startM, startD] = teleworkStart.split('-').map(Number);
    const [endY, endM, endD] = teleworkEnd.split('-').map(Number);
    const start = new Date(startY, startM - 1, startD); start.setHours(0,0,0,0);
    const end = new Date(endY, endM - 1, endD); end.setHours(23,59,59,999);

    const calculateDefaultModality = (dateStr) => {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dObj = new Date(y, m - 1, d);
      const dow = dObj.getDay();
      const isHoliday = HOLIDAYS_CR_2026.some(h => h.date === dateStr);
      if (dow === 0 || dow === 6 || isHoliday) return 'none';
      if ([1, 4, 5].includes(dow)) return 'telework';
      return 'presencial';
    };

    const relevantTasks = tasks.filter(t => {
      const d = new Date(t.start);
      if (d < start || d > end) return false;
      const iso = toISODateString(d);
      const modality = dayOverrides[iso] || calculateDefaultModality(iso);
      if (modality !== 'telework') return false;
      return (t.sessions && t.sessions.length > 0) || t.status !== 'pending';
    });
    return relevantTasks.sort((a,b) => new Date(a.start) - new Date(b.start));
  }, [teleworkStart, teleworkEnd, dayOverrides, tasks]);

  // ========== ESTILOS BASE PARA XLSX ==========
  const borderStyle = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };
  
  const headerStyle = {
    font: { bold: true, color: { rgb: '000000' }, sz: 10 },
    alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
    border: borderStyle
  };
  
  const cellStyleCenter = {
    font: { color: { rgb: '000000' }, sz: 11 },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: borderStyle
  };
  
  const cellStyleLeft = {
    font: { color: { rgb: '000000' }, sz: 11 },
    alignment: { horizontal: 'left', vertical: 'center' },
    border: borderStyle
  };

  // ========== FUNCIÓN PARA EXPORTAR A XLSX CON ESTILOS ==========
  const exportToXLSX = (wsData, merges, colWidths, fileName, sheetName = 'Reporte') => {
    try {
      const wb = XLSX.utils.book_new();
      const ws = {};
      
      // Determinar rango de la hoja
      let maxRow = 0;
      let maxCol = 0;
      
      // Escribir datos con estilos
      wsData.forEach((row, rowIndex) => {
        row.forEach((cellData, colIndex) => {
          const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
          if (cellData !== null && cellData !== undefined) {
            ws[cellRef] = cellData;
          }
          if (colIndex > maxCol) maxCol = colIndex;
        });
        if (rowIndex > maxRow) maxRow = rowIndex;
      });
      
      // Establecer rango
      ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRow, c: maxCol } });
      
      // Aplicar merges
      if (merges && merges.length > 0) {
        ws['!merges'] = merges;
      }
      
      // Aplicar anchos de columna
      if (colWidths) {
        ws['!cols'] = colWidths;
      }
      
      // Agregar hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // Descargar archivo
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0,10)}.xlsx`);
      
    } catch (error) {
      console.error('Error al exportar XLSX:', error);
      alert('Error al generar archivo Excel: ' + error.message);
    }
  };

  // ========== FUNCIÓN PRINCIPAL DE EXPORTACIÓN ==========
  const exportReport = (mode) => {
    let wsData = [];
    let merges = [];
    let colWidths = [];
    let fileName = '';
    
    if (mode === 'scheduled') {
      // ===== ACTIVIDADES PROGRAMADAS =====
      // Encabezado fila 1 (con N° como primera columna)
      wsData.push([
        { v: 'N°', s: headerStyle },
        { v: 'Fecha', s: headerStyle },
        { v: 'Lugar', s: headerStyle },
        { v: 'Actividad', s: headerStyle },
        { v: 'Expediente', s: headerStyle },
        { v: 'Acompañantes', s: headerStyle },
        { v: 'Vehículo', s: headerStyle },
        { v: '', s: headerStyle },
        { v: 'Doble T.', s: headerStyle },
        { v: '', s: headerStyle },
        { v: 'Tarj. ruedo', s: headerStyle },
        { v: '', s: headerStyle },
        { v: 'Viáticos', s: headerStyle },
        { v: '', s: headerStyle },
        { v: '', s: headerStyle },
        { v: '', s: headerStyle },
        { v: 'Cód. PP', s: headerStyle }
      ]);

      // Encabezado fila 2
      wsData.push([
        { v: '', s: headerStyle },
        { v: '', s: headerStyle },
        { v: '', s: headerStyle },
        { v: '', s: headerStyle },
        { v: '', s: headerStyle },
        { v: '', s: headerStyle },
        { v: 'Sí', s: headerStyle },
        { v: 'No', s: headerStyle },
        { v: 'Sí', s: headerStyle },
        { v: 'No', s: headerStyle },
        { v: 'Sí', s: headerStyle },
        { v: 'No', s: headerStyle },
        { v: 'D*', s: headerStyle },
        { v: 'A**', s: headerStyle },
        { v: 'C***', s: headerStyle },
        { v: 'H****', s: headerStyle },
        { v: '', s: headerStyle }
      ]);

      // Merges para encabezados (shifted +1 for N° column)
      merges = [
        { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },   // N°
        { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } },   // Fecha
        { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } },   // Lugar
        { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } },   // Actividad
        { s: { r: 0, c: 4 }, e: { r: 1, c: 4 } },   // Expediente
        { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } },   // Acompañantes
        { s: { r: 0, c: 6 }, e: { r: 0, c: 7 } },   // Vehículo
        { s: { r: 0, c: 8 }, e: { r: 0, c: 9 } },   // Doble T.
        { s: { r: 0, c: 10 }, e: { r: 0, c: 11 } },  // Tarj. ruedo
        { s: { r: 0, c: 12 }, e: { r: 0, c: 15 } },  // Viáticos
        { s: { r: 0, c: 16 }, e: { r: 1, c: 16 } }   // Cód. PP
      ];

      // Agrupar datos por fecha
      const groupedByDate = {};
      reportData.scheduled.forEach((t) => {
        const dateKey = new Date(t.start).toLocaleDateString('es-CR');
        if (!groupedByDate[dateKey]) groupedByDate[dateKey] = [];
        groupedByDate[dateKey].push(t);
      });

      const orderedEntries = Object.entries(groupedByDate).sort((a, b) => {
        return new Date(a[1][0].start) - new Date(b[1][0].start);
      });
      // Ordenar actividades dentro de cada día por hora de inicio
      orderedEntries.forEach(([, group]) => group.sort((a, b) => new Date(a.start) - new Date(b.start)));

      let currentRow = 2; // Después de las 2 filas de encabezado
      let globalRowNum = 0; // Consecutivo global

      orderedEntries.forEach(([dateStr, tasksInDate]) => {
        const rowCount = tasksInDate.length;
        const startRow = currentRow;

        // Calcular valores consolidados del día
        const anyReqVeh = tasksInDate.some(tt => !!tt.logistics?.requiereVehiculo);
        const anyDoble = tasksInDate.some(tt => !!tt.logistics?.dobleTraccion);
        const anyTarj = tasksInDate.some(tt => !!tt.logistics?.tarjetaRuedo);
        const anyDes = tasksInDate.some(tt => (tt.logistics?.viaticos || []).includes('Desayuno'));
        const anyAlm = tasksInDate.some(tt => (tt.logistics?.viaticos || []).includes('Almuerzo'));
        const anyCen = tasksInDate.some(tt => (tt.logistics?.viaticos || []).includes('Cena'));
        const anyHos = tasksInDate.some(tt => (tt.logistics?.viaticos || []).includes('Hospedaje'));

        const acompFirst = tasksInDate[0].fieldData?.asistentes || '';
        const acompAllSame = tasksInDate.every(tt => (tt.fieldData?.asistentes || '') === acompFirst);

        const ppFirst = tasksInDate[0].logistics?.codigoPP || 'PPI-17-E18';
        const ppAllSame = tasksInDate.every(tt => (tt.logistics?.codigoPP || 'PPI-17-E18') === ppFirst);

        // --- Calcular LUGAR DE LA GIRA a nivel de DÍA ---
        const isoDay = toISODateString(new Date(tasksInDate[0].start));
        let dayModality = dayOverrides[isoDay];
        if (!dayModality) {
          const [yy, mm, dd] = isoDay.split('-').map(Number);
          const dObjDay = new Date(yy, mm - 1, dd);
          const dowDay = dObjDay.getDay();
          const isHolidayDay = HOLIDAYS_CR_2026.some(h => h.date === isoDay);
          if (dowDay === 0 || dowDay === 6 || isHolidayDay) dayModality = 'none';
          else if ([1, 4, 5].includes(dowDay)) dayModality = 'telework';
          else dayModality = 'presencial';
        }
        let lugarDelDia;
        if (dayModality === 'telework') {
          lugarDelDia = 'Teletrabajo';
        } else {
          const primeraInspeccion = tasksInDate.find(tt => tt.typeId === 3 || tt.activityTypeName === 'Inspección');
          if (primeraInspeccion) {
            const loc = primeraInspeccion.fieldData?.location;
            if (loc?.lugar) {
              lugarDelDia = loc.lugar;
            } else if (loc?.distrito) {
              lugarDelDia = loc.distrito + (loc.canton ? ', ' + loc.canton : '');
            } else if (loc?.canton) {
              lugarDelDia = loc.canton;
            } else if (primeraInspeccion.fieldData?.lugar) {
              const partes = primeraInspeccion.fieldData.lugar.split(',').map(s => s.trim());
              lugarDelDia = partes.length >= 2 ? partes[1] : primeraInspeccion.fieldData.lugar;
            } else {
              lugarDelDia = 'OSRO';
            }
          } else {
            lugarDelDia = 'OSRO';
          }
        }

        // Short date format for Excel
        const dObj = new Date(tasksInDate[0].start);
        const shortDateStr = `${dObj.getDate()}/${dObj.getMonth()+1}/${String(dObj.getFullYear()).slice(-2)}`;

        tasksInDate.forEach((t, idx) => {
          const isFirst = idx === 0;
          globalRowNum++;

          // Tipos que no llevan lugar de gira ni código PP (ausencias/personales)
          const noLugarNoPPTypes = [14, 15, 16, 17, 19];
          const isNoLugar = noLugarNoPPTypes.includes(parseInt(t.typeId));
          const lugar = isNoLugar ? '' : lugarDelDia;
          let actividad = t.activityTypeName;
          if (t.subtipo) actividad += ` - ${t.subtipo}`;
          const linkedCase = t.caseUid && cases ? cases.find(c => c.caseUid === t.caseUid) : null;
          const linkedBatch = t.batchUid && batches ? batches.find(b => b.batchUid === t.batchUid) : null;
          const expParts = [];
          if (t.fieldData?.expediente) expParts.push(t.fieldData.expediente);
          if (linkedCase?.title) expParts.push(linkedCase.title);
          else if (t.caseExternalRefText) expParts.push(t.caseExternalRefText);
          if (linkedBatch?.title) expParts.push('Lote: ' + linkedBatch.title);
          const expediente = expParts.join(' | ');

          const row = [
            { v: globalRowNum, s: cellStyleCenter },
            isFirst ? { v: shortDateStr, s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            { v: lugar, s: cellStyleLeft },
            { v: actividad, s: cellStyleLeft },
            { v: expediente, s: cellStyleLeft },
            (acompAllSame && !isFirst) ? { v: '', s: cellStyleLeft } : { v: t.fieldData?.asistentes || '', s: cellStyleLeft },
            isFirst ? { v: anyReqVeh ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: !anyReqVeh ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: anyDoble ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: !anyDoble ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: anyTarj ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: !anyTarj ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: anyDes ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: anyAlm ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: anyCen ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            isFirst ? { v: anyHos ? 'X' : '', s: cellStyleCenter } : { v: '', s: cellStyleCenter },
            (ppAllSame && !isFirst) ? { v: '', s: cellStyleCenter } : { v: isNoLugar ? '' : (t.logistics?.codigoPP || 'PPI-17-E18'), s: cellStyleCenter }
          ];

          wsData.push(row);
          currentRow++;
        });

        // Agregar merges para celdas fusionadas por fecha (shifted +1 for N° column)
        if (rowCount > 1) {
          // Fecha
          merges.push({ s: { r: startRow, c: 1 }, e: { r: startRow + rowCount - 1, c: 1 } });
          // Vehículo Sí
          merges.push({ s: { r: startRow, c: 6 }, e: { r: startRow + rowCount - 1, c: 6 } });
          // Vehículo No
          merges.push({ s: { r: startRow, c: 7 }, e: { r: startRow + rowCount - 1, c: 7 } });
          // Doble T. Sí
          merges.push({ s: { r: startRow, c: 8 }, e: { r: startRow + rowCount - 1, c: 8 } });
          // Doble T. No
          merges.push({ s: { r: startRow, c: 9 }, e: { r: startRow + rowCount - 1, c: 9 } });
          // Tarj. ruedo Sí
          merges.push({ s: { r: startRow, c: 10 }, e: { r: startRow + rowCount - 1, c: 10 } });
          // Tarj. ruedo No
          merges.push({ s: { r: startRow, c: 11 }, e: { r: startRow + rowCount - 1, c: 11 } });
          // Viáticos D
          merges.push({ s: { r: startRow, c: 12 }, e: { r: startRow + rowCount - 1, c: 12 } });
          // Viáticos A
          merges.push({ s: { r: startRow, c: 13 }, e: { r: startRow + rowCount - 1, c: 13 } });
          // Viáticos C
          merges.push({ s: { r: startRow, c: 14 }, e: { r: startRow + rowCount - 1, c: 14 } });
          // Viáticos H
          merges.push({ s: { r: startRow, c: 15 }, e: { r: startRow + rowCount - 1, c: 15 } });
          // Acompañantes (si todos iguales)
          if (acompAllSame) {
            merges.push({ s: { r: startRow, c: 5 }, e: { r: startRow + rowCount - 1, c: 5 } });
          }
          // Código PP (si todos iguales)
          if (ppAllSame) {
            merges.push({ s: { r: startRow, c: 16 }, e: { r: startRow + rowCount - 1, c: 16 } });
          }
        }
      });

      colWidths = [
        { wch: 5 },  // N°
        { wch: 8 },  // Fecha
        { wch: 14 }, // Lugar
        { wch: 30 }, // Actividad
        { wch: 12 }, // Expediente
        { wch: 16 }, // Acompañantes
        { wch: 4 },  // Veh Sí
        { wch: 4 },  // Veh No
        { wch: 4 },  // Doble Sí
        { wch: 4 },  // Doble No
        { wch: 4 },  // Tarj Sí
        { wch: 4 },  // Tarj No
        { wch: 4 },  // D
        { wch: 4 },  // A
        { wch: 4 },  // C
        { wch: 4 },  // H
        { wch: 10 }  // Cód. PP
      ];

      fileName = 'reporte_programadas';

    } else if (mode === 'realized') {
      // ===== ACTIVIDADES REALIZADAS =====
      const realizedHeaders = [
        { v: 'N°', s: headerStyle },
        { v: 'Fecha', s: headerStyle },
        { v: 'Actividad', s: headerStyle },
        { v: 'Expediente/Caso', s: headerStyle },
        { v: 'Oficio', s: headerStyle },
        { v: 'Estado', s: headerStyle },
        { v: 'Tiempo', s: headerStyle }
      ];
      wsData.push(realizedHeaders);

      reportData.realized.forEach((t, idx) => {
        const dur = (t.sessions || []).reduce((a, s) => a + ((s.end ? new Date(s.end) : new Date()) - new Date(s.start)), 0);
        const linkedCase = t.caseUid && cases ? cases.find(c => c.caseUid === t.caseUid) : null;
        const linkedBatch = t.batchUid && batches ? batches.find(b => b.batchUid === t.batchUid) : null;
        // Construir Expediente/Caso unificado
        const expParts = [];
        if (t.fieldData?.expediente) expParts.push(t.fieldData.expediente);
        if (linkedCase?.title) expParts.push(linkedCase.title);
        else if (t.caseExternalRefText) expParts.push(t.caseExternalRefText);
        if (linkedBatch?.title) expParts.push('Lote: ' + linkedBatch.title);
        const expedienteCaso = expParts.join(' | ');
        const row = [
          { v: idx + 1, s: cellStyleCenter },
          { v: new Date(t.start).toLocaleDateString('es-CR'), s: cellStyleCenter },
          { v: t.activityTypeName + (t.subtipo ? ' - ' + t.subtipo : ''), s: cellStyleLeft },
          { v: expedienteCaso, s: cellStyleLeft },
          { v: t.fieldData?.informe || '', s: cellStyleLeft },
          { v: t.status, s: cellStyleCenter },
          { v: formatDuration(dur), s: cellStyleCenter }
        ];
        wsData.push(row);
      });

      colWidths = [{ wch: 5 }, { wch: 12 }, { wch: 40 }, { wch: 28 }, { wch: 16 }, { wch: 15 }, { wch: 12 }];
      fileName = 'reporte_realizadas';
      
    } else if (mode === 'pending') {
      // ===== ACTIVIDADES PENDIENTES =====
      const pendingHeaders = [
        { v: 'N°', s: headerStyle },
        { v: 'Fecha Original', s: headerStyle },
        { v: 'Actividad', s: headerStyle },
        { v: 'Expediente/Caso', s: headerStyle },
        { v: 'Rezago (días)', s: headerStyle },
        { v: 'Tiempo Invertido', s: headerStyle },
        { v: 'Sesiones', s: headerStyle }
      ];
      wsData.push(pendingHeaders);

      reportData.pending.forEach((t, idx) => {
        const lag = Math.floor((new Date() - new Date(t.start)) / (1000 * 60 * 60 * 24));
        const dur = (t.sessions || []).reduce((a, s) => a + ((s.end ? new Date(s.end) : new Date()) - new Date(s.start)), 0);
        const desc = `${t.activityTypeName}${t.subtipo ? ' - ' + t.subtipo : ''}`;
        const linkedCase = t.caseUid && cases ? cases.find(c => c.caseUid === t.caseUid) : null;
        const linkedBatch = t.batchUid && batches ? batches.find(b => b.batchUid === t.batchUid) : null;
        // Construir Expediente/Caso unificado
        const expParts = [];
        if (t.fieldData?.expediente) expParts.push(t.fieldData.expediente);
        if (linkedCase?.title) expParts.push(linkedCase.title);
        else if (t.caseExternalRefText) expParts.push(t.caseExternalRefText);
        if (linkedBatch?.title) expParts.push('Lote: ' + linkedBatch.title);
        if (t.fieldData?.informe) expParts.push('Inf: ' + t.fieldData.informe);
        const expedienteCaso = expParts.join(' | ');
        const row = [
          { v: idx + 1, s: cellStyleCenter },
          { v: new Date(t.start).toLocaleDateString('es-CR'), s: cellStyleCenter },
          { v: desc, s: cellStyleLeft },
          { v: expedienteCaso, s: cellStyleLeft },
          { v: lag > 0 ? lag : 0, s: cellStyleCenter },
          { v: formatDuration(dur), s: cellStyleCenter },
          { v: t.sessions ? t.sessions.length : 0, s: cellStyleCenter }
        ];
        wsData.push(row);
      });

      colWidths = [{ wch: 5 }, { wch: 14 }, { wch: 40 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 10 }];
      fileName = 'reporte_pendientes';
      
    } else if (mode === 'telework') {
      // ===== TELETRABAJO =====
      wsData.push([
        { v: 'Fecha', s: headerStyle },
        { v: 'Actividad', s: headerStyle },
        { v: 'Código', s: headerStyle },
        { v: 'Estado', s: headerStyle },
        { v: 'Tiempo', s: headerStyle }
      ]);
      
      teleworkReportData.forEach(t => {
        const durationMs = (t.sessions || []).reduce((acc, s) => acc + ((s.end ? new Date(s.end) : new Date()) - new Date(s.start)), 0);
        wsData.push([
          { v: new Date(t.start).toLocaleDateString('es-CR'), s: cellStyleCenter },
          { v: `${t.activityTypeName}${t.subtipo ? ` - ${t.subtipo}` : ''}`, s: cellStyleLeft },
          { v: t.logistics?.codigoPP || '', s: cellStyleCenter },
          { v: t.status === 'completed' ? 'Finalizado' : 'Sin finalizar', s: cellStyleCenter },
          { v: formatDuration(durationMs), s: cellStyleCenter }
        ]);
      });
      
      colWidths = [{ wch: 12 }, { wch: 45 }, { wch: 12 }, { wch: 14 }, { wch: 12 }];
      fileName = 'reporte_teletrabajo';
      
    } else if (mode === 'pp_accumulated') {
      // ===== ACUMULADO PP =====
      wsData.push([
        { v: 'Código PP', s: headerStyle },
        { v: 'Monto Liquidado', s: headerStyle }
      ]);
      
      Object.entries(ppStats).forEach(([pp, amount]) => {
        wsData.push([
          { v: pp, s: cellStyleLeft },
          { v: formatMoney(amount), s: cellStyleCenter }
        ]);
      });
      
      // Fila de total
      const total = Object.values(ppStats).reduce((a, b) => a + b, 0);
      wsData.push([
        { v: 'TOTAL', s: { ...headerStyle, font: { ...headerStyle.font, bold: true } } },
        { v: formatMoney(total), s: { ...headerStyle, font: { ...headerStyle.font, bold: true } } }
      ]);
      
      colWidths = [{ wch: 20 }, { wch: 18 }];
      fileName = 'reporte_acumulado_pp';
      
    } else if (mode === 'monthly_detailed') {
      // ===== DETALLE MENSUAL =====
      wsData.push([
        { v: 'Mes', s: headerStyle },
        { v: 'Código PP', s: headerStyle },
        { v: 'Monto Programado', s: headerStyle },
        { v: 'Monto Ejecutado', s: headerStyle },
        { v: 'Detalle Actividad', s: headerStyle }
      ]);
      
      monthlyDetails.forEach(item => {
        wsData.push([
          { v: item.month, s: cellStyleCenter },
          { v: item.pp, s: cellStyleCenter },
          { v: formatMoney(item.planned), s: cellStyleCenter },
          { v: formatMoney(item.executed), s: cellStyleCenter },
          { v: item.desc, s: cellStyleLeft }
        ]);
      });
      
      colWidths = [{ wch: 12 }, { wch: 14 }, { wch: 18 }, { wch: 18 }, { wch: 50 }];
      fileName = 'reporte_detalle_mensual';
      
    } else if (mode === 'total') {
      // Para respaldo mantener CSV
      exportToCSV('total');
      return;
    }
    
    // Exportar a XLSX
    exportToXLSX(wsData, merges, colWidths, fileName);
  };

  // ========== FUNCIÓN CSV SOLO PARA RESPALDO ==========
  const exportToCSV = (mode) => {
    let csv = '';
    const BOM = "\uFEFF";

    if (mode === 'total') {
      csv = BOM + 'ID,FullJsonData\n';
      tasks.forEach(t => { 
        const json = JSON.stringify(t, (key, value) => {
          if (typeof value === 'string') {
            return value.normalize('NFC');
          }
          return value;
        }).replace(/"/g, '""'); 
        csv += `${t.id},"${json}"\n`; 
      });
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); 
    link.href = URL.createObjectURL(blob); 
    link.download = `reporte_${mode}_${new Date().toISOString().slice(0,10)}.csv`; 
    link.click();
  };

  const handleFileImport = (event) => { /* ... existing import logic ... */ };

  // ========== GENERADOR DE VISOR DE SOLO LECTURA ==========
  const generateReadOnlyViewer = () => {
    const allTasks = tasks.map(t => ({
      id: t.id, typeId: t.typeId, activityTypeName: t.activityTypeName || '', subtipo: t.subtipo || '',
      start: t.start, end: t.end, status: t.status || 'pending', observations: t.observations || '',
      fieldData: t.fieldData || {}, logistics: t.logistics || {}, sessions: t.sessions || [],
      caseExternalRefText: t.caseExternalRefText || null, caseUid: t.caseUid || null
    }));
    const embeddedData = {
      tasks: allTasks,
      dayOverrides: dayOverrides || {},
      activityTypes: activityTypes.map(at => ({ id: at.id, name: at.name, color: at.color, subtypes: at.subtypes || [], fields: at.fields || [] })),
      holidays: HOLIDAYS_CR_2026,
      efemerides: EFEMERIDES_2026,
      viaticumRates: viaticumRates,
      documents: documents.map(d => ({ docUid: d.docUid, docType: d.docType, periodStart: d.periodStart, periodEnd: d.periodEnd, fileName: d.fileName, downloadURL: d.downloadURL, uploadedAt: d.uploadedAt, fileSize: d.fileSize })),
      generatedAt: new Date().toISOString(),
      generatedBy: 'Calendario SINAC - ACOPAC OSRO',
      firebase: {
        config: { apiKey: "AIzaSyADhSpkSwZGGIjFi6U2swx0WJNq0AD7AVk", authDomain: "calendariosinacv1.firebaseapp.com", projectId: "calendariosinacv1", storageBucket: "calendariosinacv1.firebasestorage.app", messagingSenderId: "900985221783", appId: "1:900985221783:web:d5b6407eb23abf9190efd2" },
        appId: "calendariosinacv1",
        userUid: (typeof getAuth !== 'undefined' && getAuth().currentUser) ? getAuth().currentUser.uid : null
      }
    };

    const viewerHTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Programación de Actividades | SINAC - ACOPAC - Orotina</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&family=Source+Sans+3:wght@300;400;600;700;800&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js">CLOSE_SCRIPT_TAG
<script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js">CLOSE_SCRIPT_TAG
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js">CLOSE_SCRIPT_TAG
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js">CLOSE_SCRIPT_TAG
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js">CLOSE_SCRIPT_TAG
<style>
:root{
  --forest:#1B4332;--forest-mid:#2D6A4F;--forest-light:#40916C;
  --leaf:#52B788;--leaf-light:#B7E4C7;--leaf-pale:#E8F5EE;--leaf-bg:#F4FAF7;
  --ink:#1F2937;--ink-mid:#374151;--ink-soft:#6B7280;--ink-faint:#9CA3AF;
  --line:#D1D5DB;--line-light:#E5E7EB;--surface:#F9FAFB;--white:#FFFFFF;
  --warn:#92400E;--warn-bg:#FEF3C7;--warn-border:#FDE68A;
  --danger:#991B1B;--danger-bg:#FEF2F2;
  --info:#1E40AF;--info-bg:#DBEAFE;
  --ok:#166534;--ok-bg:#DCFCE7;
  --font:'Source Sans 3',system-ui,-apple-system,'Segoe UI',sans-serif;
  --font-head:'Merriweather',Georgia,'Times New Roman',serif;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:var(--font);background:var(--surface);color:var(--ink);line-height:1.65;font-size:15px;-webkit-font-smoothing:antialiased}

/* ===== HEADER ===== */
.header{
  background:var(--forest);color:var(--white);padding:0;
  position:sticky;top:0;z-index:100;
  box-shadow:0 2px 12px rgba(27,67,50,0.25);
}
.header-inner{
  max-width:1200px;margin:0 auto;padding:18px 28px;
  display:flex;align-items:center;gap:18px;
}
.header-icon{
  width:48px;height:48px;flex-shrink:0;
  background:rgba(255,255,255,0.1);border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  border:1px solid rgba(255,255,255,0.08);
}
.header-icon svg{width:28px;height:28px;fill:none;stroke:var(--white);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.header-text{flex:1}
.header h1{font-family:var(--font-head);font-size:20px;font-weight:700;line-height:1.3;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.header .badge{
  display:inline-flex;align-items:center;gap:5px;
  background:rgba(255,255,255,0.12);
  padding:4px 12px;border-radius:4px;font-family:var(--font);
  font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;
}
.badge-dot{width:6px;height:6px;border-radius:50%;background:var(--leaf)}
.header .sub{font-size:13px;opacity:0.7;margin-top:3px;font-weight:300}

/* ===== LAYOUT ===== */
.container{max-width:1200px;margin:0 auto;padding:24px 28px}

/* ===== TABS ===== */
.tabs{
  display:flex;gap:0;background:var(--white);
  margin-bottom:24px;border:1px solid var(--line);
  border-radius:6px;overflow-x:auto;
  -webkit-overflow-scrolling:touch;scrollbar-width:none;
}
.tabs::-webkit-scrollbar{display:none}
.tab{
  padding:12px 20px;border:none;background:transparent;cursor:pointer;
  font-weight:600;font-size:14px;color:var(--ink-soft);white-space:nowrap;
  transition:all 0.15s ease;border-right:1px solid var(--line-light);
  letter-spacing:0.01em;
}
.tab:last-child{border-right:none}
.tab:hover:not(.active){background:var(--leaf-bg);color:var(--forest-mid)}
.tab.active{background:var(--forest);color:var(--white)}
.tab:focus-visible{outline:2px solid var(--leaf);outline-offset:-2px}

/* ===== CARDS ===== */
.card{
  background:var(--white);border-radius:6px;
  padding:28px;margin-bottom:20px;
  border:1px solid var(--line);
}
.card h2{
  font-family:var(--font-head);font-size:18px;font-weight:700;
  color:var(--forest);margin-bottom:20px;padding-bottom:14px;
  border-bottom:1px solid var(--line);
}

/* ===== INPUTS ===== */
.search-box{
  width:100%;padding:12px 16px;border:1px solid var(--line);
  border-radius:4px;font-size:15px;font-family:var(--font);
  outline:none;transition:border 0.15s,box-shadow 0.15s;
  background:var(--white);color:var(--ink);
}
.search-box:focus{border-color:var(--forest-mid);box-shadow:0 0 0 3px rgba(45,106,79,0.12)}
.search-box::placeholder{color:var(--ink-faint)}

/* ===== CALENDAR ===== */
.cal-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.cal-nav button{
  background:var(--white);border:1px solid var(--line);cursor:pointer;
  padding:10px 18px;border-radius:4px;font-weight:600;
  color:var(--ink-mid);font-size:14px;font-family:var(--font);
  transition:all 0.15s ease;
}
.cal-nav button:hover{background:var(--leaf-bg);border-color:var(--leaf-light);color:var(--forest)}
.cal-nav .month-title{font-family:var(--font-head);font-size:20px;font-weight:700;color:var(--forest)}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:4px;overflow:hidden}
.cal-header{background:var(--forest);padding:12px 4px;text-align:center;font-size:12px;font-weight:700;color:var(--white);text-transform:uppercase;letter-spacing:0.08em}
.cal-day{
  background:var(--white);min-height:82px;padding:6px;cursor:pointer;
  position:relative;transition:background 0.12s;
}
.cal-day:hover{background:var(--leaf-bg)}
.cal-day.selected{background:var(--leaf-pale);box-shadow:inset 0 0 0 2px var(--forest-mid)}
.cal-day.today{box-shadow:inset 0 0 0 2px var(--warn)}
.cal-day.other-month{background:var(--surface);opacity:0.5}
.cal-day .num{font-size:14px;font-weight:700;margin-bottom:4px;color:var(--ink-mid)}
.cal-day.today .num{color:var(--warn);font-weight:800}
.cal-day .tag{
  font-size:10px;padding:2px 5px;border-radius:3px;display:block;
  margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
  max-width:100%;font-weight:500;line-height:1.4;
}
.tag-telework{background:var(--leaf-pale);color:var(--forest);font-weight:600}
.tag-presencial{background:var(--info-bg);color:var(--info);font-weight:600}
.tag-holiday{background:var(--danger-bg);color:var(--danger);font-weight:600}
.tag-none{background:var(--surface);color:var(--ink-faint);font-weight:600}
.tag-task{background:var(--surface);color:var(--ink-mid);border-left:2px solid var(--forest-mid)}
.tag-more{background:var(--surface);color:var(--ink-soft);font-weight:600;font-style:italic}

/* Modality badge (top-right corner, inline in flex header) */
.mod-badge{
  font-size:9px;font-weight:700;padding:3px 7px;border-radius:3px;
  letter-spacing:0.03em;line-height:1;white-space:nowrap;flex-shrink:0;
}
.mod-telework{background:#D8F3DC;color:#1B4332}
.mod-presencial{background:#DBEAFE;color:#1E40AF}
.mod-none{background:#E5E7EB;color:#6B7280}
.mod-holiday{background:#FECACA;color:#991B1B}

/* Day cell background by modality */
.cal-day.day-telework{background:#FAFFF8}
.cal-day.day-presencial{background:#F8FAFF}
.cal-day.day-holiday{background:#FFFAF8}
.cal-day.day-none{background:var(--surface)}
.cal-day.day-telework:hover{background:#F0FFF4}
.cal-day.day-presencial:hover{background:#EFF6FF}
.cal-day.day-holiday:hover{background:#FFF5F5}

/* Overlap warning */
.overlap-warn{color:#DC2626;font-size:13px;font-weight:bold;cursor:help;margin-left:2px;line-height:1}

/* Weekend toggle */
.view-controls{display:flex;align-items:center;margin-bottom:16px;gap:12px}
.weekend-toggle{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-mid);cursor:pointer;font-weight:500}
.weekend-toggle input{width:16px;height:16px;accent-color:var(--forest);cursor:pointer}

/* 5-col grid (no weekends) */
.cal-grid.no-weekends{grid-template-columns:repeat(5,1fr)}

/* ===== DAY DETAIL ===== */
.day-detail{
  border-left:4px solid var(--forest);padding:16px 20px;margin-bottom:12px;
  background:var(--surface);border-radius:0 4px 4px 0;
}
.day-detail .act-name{font-weight:700;font-size:16px;margin-bottom:8px;color:var(--forest)}
.day-detail .act-field{font-size:14px;color:var(--ink-mid);margin-bottom:4px;line-height:1.6}
.day-detail .act-field span{font-weight:700;color:var(--ink)}

/* ===== STATUS BADGES ===== */
.day-detail .status-badge,.report-table .status-badge{
  display:inline-block;padding:3px 10px;border-radius:3px;
  font-size:11px;font-weight:700;letter-spacing:0.03em;text-transform:uppercase;
}
.status-pending{background:var(--warn-bg);color:var(--warn)}
.status-in_progress{background:var(--info-bg);color:var(--info)}
.status-completed{background:var(--ok-bg);color:var(--ok)}
.status-paused{background:var(--danger-bg);color:var(--danger)}

/* ===== REPORT TABLES ===== */
.report-table{width:100%;border-collapse:collapse;font-size:13px;border:1px solid var(--line)}
.report-table th{
  background:var(--forest);color:var(--white);padding:10px 8px;
  text-align:center;font-size:11px;font-weight:700;
  letter-spacing:0.05em;text-transform:uppercase;
  border-right:1px solid rgba(255,255,255,0.1);
}
.report-table th:last-child{border-right:none}
.report-table td{
  padding:8px;border-bottom:1px solid var(--line-light);
  border-right:1px solid var(--line-light);text-align:center;
  font-size:13px;color:var(--ink-mid);vertical-align:middle;
}
.report-table td:last-child{border-right:none}
.report-table tbody tr:nth-child(even){background:var(--surface)}
.report-table tbody tr:hover{background:var(--leaf-bg)}

/* ===== SEARCH ===== */
.search-results{margin-top:14px}
.search-result-item{
  padding:16px 20px;border-left:4px solid var(--forest);
  background:var(--surface);border-radius:0 4px 4px 0;
  margin-bottom:10px;cursor:pointer;transition:all 0.12s;
  border:1px solid var(--line);border-left:4px solid var(--forest);
}
.search-result-item:hover{background:var(--leaf-bg)}
.search-result-item .sr-title{font-weight:700;font-size:15px;color:var(--forest)}
.search-result-item .sr-detail{font-size:13px;color:var(--ink-soft);margin-top:3px}
.search-result-item .sr-detail strong{color:var(--ink-mid)}

/* ===== LEGEND ===== */
.legend{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px}
.legend-item{
  font-size:13px;color:var(--ink-mid);background:var(--white);
  padding:5px 12px;border-radius:4px;border:1px solid var(--line);
  font-weight:500;
}
.legend-item strong{font-weight:700;color:var(--forest)}
.legend-dot{display:none}

/* (view-toggle and week-view removed - monthly only) */

/* ===== PDF BUTTON ===== */
.btn-pdf{
  padding:8px 16px;background:var(--forest);color:var(--white);
  border:none;border-radius:4px;font-size:13px;font-weight:700;
  cursor:pointer;font-family:var(--font);letter-spacing:0.02em;
  transition:background 0.15s;
}
.btn-pdf:hover{background:var(--forest-mid)}
.btn-pdf:focus-visible{outline:2px solid var(--leaf);outline-offset:2px}

/* ===== SUMMARY CARDS ===== */
.summary-card{
  padding:20px 16px;border-radius:6px;text-align:center;cursor:pointer;
  transition:transform 0.15s ease,box-shadow 0.15s ease;
}
.summary-card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,0.1)}
.summary-card.active{transform:translateY(-1px);box-shadow:0 2px 8px rgba(0,0,0,0.12);outline:2px solid var(--forest-light)}

/* ===== LIVE INDICATOR ===== */
.live-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:0.04em;margin-left:8px;vertical-align:middle}

/* ===== SHORTCUT BUTTON ===== */
.btn-shortcut{
  padding:6px 14px;background:rgba(255,255,255,0.15);color:var(--white);
  border:1px solid rgba(255,255,255,0.25);border-radius:4px;font-size:12px;font-weight:600;
  cursor:pointer;font-family:var(--font);letter-spacing:0.02em;
  transition:background 0.15s;display:inline-flex;align-items:center;gap:6px;
  white-space:nowrap;flex-shrink:0;
}
.btn-shortcut:hover{background:rgba(255,255,255,0.25)}
.btn-shortcut svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.live-badge.connected{background:#DCFCE7;color:#166534}
.live-badge.disconnected{background:#FEF2F2;color:#991B1B}
.live-badge.connecting{background:#FEF3C7;color:#92400E}
.live-dot{width:8px;height:8px;border-radius:50%;display:inline-block}
.live-badge.connected .live-dot{background:#22C55E;animation:livePulse 2s ease-in-out infinite}
.live-badge.disconnected .live-dot{background:#EF4444}
.live-badge.connecting .live-dot{background:#F59E0B;animation:livePulse 1s ease-in-out infinite}
@keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.4}}
.last-sync{font-size:10px;color:var(--ink-faint);margin-left:8px}

/* ===== EMPTY STATE ===== */
.empty-state{text-align:center;padding:48px 24px;color:var(--ink-faint)}
.empty-state p{font-size:15px;max-width:360px;margin:0 auto;line-height:1.6}

/* (week view removed) */

/* ===== FOOTER ===== */
.footer{
  text-align:center;padding:24px 28px;font-size:12px;color:var(--ink-faint);
  border-top:1px solid var(--line);margin-top:36px;background:var(--white);
}
.footer-inner{max-width:1200px;margin:0 auto}
.footer-brand{font-weight:700;color:var(--forest);font-size:13px;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:4px}
.footer-divider{width:40px;height:2px;background:var(--leaf-light);border-radius:1px;margin:8px auto}

/* ===== DATE FILTER ROW ===== */
.date-filter-row{
  display:flex;gap:12px;align-items:center;flex-wrap:wrap;
  margin-bottom:18px;padding:14px 18px;
  background:var(--surface);border-radius:4px;border:1px solid var(--line);
}
.date-filter-row label{font-size:13px;font-weight:700;color:var(--ink-mid);text-transform:uppercase;letter-spacing:0.05em}

/* ===== RESPONSIVE ===== */
@media(max-width:768px){
  .container{padding:14px}
  .card{padding:18px}
  .header-inner{padding:14px 16px;gap:12px}
  .header-icon{width:40px;height:40px}
  .header-icon svg{width:22px;height:22px}
  .header h1{font-size:17px}
  .header .sub{font-size:11px}
  .cal-day{min-height:58px;padding:4px}
  .cal-day .num{font-size:12px}
  .cal-day .tag{font-size:9px;padding:1px 4px}
  .cal-header{font-size:10px;padding:8px 3px}
  .tabs{gap:0}
  .tab{padding:10px 13px;font-size:12px}
  .report-table{font-size:11px}
  .report-table th{padding:8px 4px;font-size:9px}
  .report-table td{padding:6px 4px;font-size:11px}
  .cal-nav .month-title{font-size:17px}
  .day-detail{padding:12px 14px}
  .day-detail .act-name{font-size:14px}
  .day-detail .act-field{font-size:13px}
  .date-filter-row{padding:10px 12px;gap:8px}
}

/* ===== PRINT ===== */
@media print{
  *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
  body{background:var(--white);font-size:12px}
  .header{position:relative;box-shadow:none;border-bottom:2px solid var(--forest)}
  .tabs,.view-controls,.cal-nav button,.date-filter-row{display:none!important}
  .card{border:1px solid var(--line);break-inside:avoid;page-break-inside:avoid}
  .cal-day{min-height:44px}
  .cal-day:hover,.card:hover,.report-table tbody tr:hover,.day-detail:hover{background:inherit}
  .container{max-width:100%;padding:8px}
  .footer{border-top:1px solid var(--line)}
  .report-table th{background:var(--forest)!important;color:var(--white)!important}
}

/* ===== ACCESSIBILITY ===== */
:focus-visible{outline:2px solid var(--forest-mid);outline-offset:2px;border-radius:2px}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important}}
@media(prefers-contrast:more){
  .cal-day .tag{font-weight:700;border:1px solid currentColor}
  .report-table td{border-color:var(--ink-faint)}
  .tab{border-bottom:2px solid transparent}
  .tab.active{border-bottom-color:var(--white)}
  body{font-size:16px}
}
</style>
</head>
<body>

<div class="header">
  <div class="header-inner">
    <div class="header-icon">
      <svg viewBox="0 0 24 24"><path d="M12 3c-1.5 2-4 4-7 4.5C5.5 13 8 17 12 21c4-4 6.5-8 7-13.5C16 7 13.5 5 12 3z"/><path d="M12 8v6M9 11h6" stroke-width="1.4"/></svg>
    </div>
    <div class="header-text">
      <h1>Programación de Actividades <span class="badge"><span class="badge-dot"></span> Solo Lectura</span><span id="liveBadge" class="live-badge connecting"><span class="live-dot"></span><span id="liveLabel">Conectando...</span></span></h1>
      <div class="sub">SINAC &middot; ACOPAC &middot; Oficina Subregional de Orotina &nbsp;|&nbsp; Generado: GENERATED_DATE<span id="lastSync" class="last-sync"></span></div>
    </div>
    <button class="btn-shortcut" onclick="crearAccesoDirecto()" title="Guardar en carpeta Agendas ACOPAC en el Escritorio">
      <svg viewBox="0 0 24 24"><path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"/></svg>
      Crear Acceso Directo
    </button>
  </div>
</div>

<div class="container">
  <div class="tabs" id="mainTabs" role="tablist">
    <button class="tab active" onclick="switchTab('calendar')" role="tab" aria-selected="true">Calendario</button>
    <button class="tab" onclick="switchTab('search')" role="tab" aria-selected="false">Buscar</button>
    <button class="tab" onclick="switchTab('reportA')" role="tab" aria-selected="false">A. Realizadas</button>
    <button class="tab" onclick="switchTab('reportB')" role="tab" aria-selected="false">B. Programadas</button>
    <button class="tab" onclick="switchTab('reportC')" role="tab" aria-selected="false">C. Pendientes</button>
    <button class="tab" onclick="switchTab('reportD')" role="tab" aria-selected="false">D. Presupuesto</button>
    <button class="tab" onclick="switchTab('summary')" role="tab" aria-selected="false">Resumen</button>
    <button class="tab" onclick="switchTab('documents')" role="tab" aria-selected="false">Documentos</button>
  </div>

  <!-- CALENDAR TAB -->
  <div id="tab-calendar" class="tab-content" role="tabpanel">
    <div class="card">
      <div class="view-controls">
<label class="weekend-toggle" title="Mostrar u ocultar sábado y domingo">
  <input type="checkbox" id="chkWeekends" onchange="toggleWeekends()">
  <span>Mostrar fines de semana</span>
</label>
      </div>
      <div class="cal-nav">
<button onclick="navCalendar(-1)" aria-label="Mes anterior">&larr; Anterior</button>
<span class="month-title" id="calTitle"></span>
<button onclick="navCalendar(1)" aria-label="Mes siguiente">Siguiente &rarr;</button>
      </div>
      <div class="legend" id="legendBox" role="list" aria-label="Leyenda de tipos de actividad"></div>
      <div class="cal-grid" id="calGrid" role="grid" aria-label="Calendario de actividades"></div>
    </div>
    <div class="card" id="dayDetailCard" style="display:none">
      <h2 id="dayDetailTitle">Detalle del día</h2>
      <div id="dayDetailContent"></div>
    </div>
  </div>

  <!-- SEARCH TAB -->
  <div id="tab-search" class="tab-content" style="display:none" role="tabpanel">
    <div class="card">
      <h2>Buscar por Expediente o Informe</h2>
      <input type="text" class="search-box" id="searchInput" placeholder="Escriba número de expediente, informe, actividad, tema, asistentes..." oninput="doSearch(this.value)" aria-label="Campo de búsqueda">
      <div class="search-results" id="searchResults" role="region" aria-live="polite">
<div class="empty-state"><p>Ingrese un término para buscar en todas las actividades.</p></div>
      </div>
    </div>
  </div>

  <!-- REPORT A TAB -->
  <div id="tab-reportA" class="tab-content" style="display:none" role="tabpanel">
    <div class="card">
      <h2>A. Actividades Realizadas</h2>
      <div class="date-filter-row">
<label for="realStart">Desde:</label>
<input type="date" id="realStart" class="search-box" style="width:auto;padding:8px 12px;max-width:180px" onchange="renderReportA()">
<label for="realEnd">Hasta:</label>
<input type="date" id="realEnd" class="search-box" style="width:auto;padding:8px 12px;max-width:180px" onchange="renderReportA()">
<button class="btn-pdf" onclick="exportPDF_A()">Descargar PDF</button>
      </div>
      <div style="overflow-x:auto" id="reportAContainer"></div>
    </div>
  </div>

  <!-- REPORT B TAB -->
  <div id="tab-reportB" class="tab-content" style="display:none" role="tabpanel">
    <div class="card">
      <h2>B. Actividades Programadas</h2>
      <div class="date-filter-row">
<label for="schedStart">Desde:</label>
<input type="date" id="schedStart" class="search-box" style="width:auto;padding:8px 12px;max-width:180px" onchange="renderReportB()">
<label for="schedEnd">Hasta:</label>
<input type="date" id="schedEnd" class="search-box" style="width:auto;padding:8px 12px;max-width:180px" onchange="renderReportB()">
<button class="btn-pdf" onclick="exportPDF_B()">Descargar PDF</button>
      </div>
      <div style="overflow-x:auto" id="reportBContainer"></div>
    </div>
  </div>

  <!-- REPORT C TAB (Pendientes) -->
  <div id="tab-reportC" class="tab-content" style="display:none" role="tabpanel">
    <div class="card">
      <h2>C. Actividades Pendientes</h2>
      <div style="margin-bottom:14px"><button class="btn-pdf" onclick="exportPDF_C()">Descargar PDF</button></div>
      <div style="overflow-x:auto" id="reportCContainer"></div>
    </div>
  </div>

  <!-- REPORT D TAB (Presupuesto) -->
  <div id="tab-reportD" class="tab-content" style="display:none" role="tabpanel">
    <div class="card">
      <h2>D. Presupuesto de Viáticos</h2>
      <div style="margin-bottom:14px"><button class="btn-pdf" onclick="exportPDF_D()">Descargar PDF</button></div>
      <div style="overflow-x:auto" id="reportDContainer"></div>
    </div>
  </div>

  <!-- SUMMARY TAB -->
  <div id="tab-summary" class="tab-content" style="display:none" role="tabpanel">
    <div class="card">
      <h2>Resumen General</h2>
      <div id="summaryContent"></div>
    </div>
  </div>

  <!-- DOCUMENTS TAB -->
  <div id="tab-documents" class="tab-content" style="display:none" role="tabpanel">
    <div class="card">
      <h2 style="display:flex;align-items:center;gap:10px">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        Documentos
      </h2>
      <p style="color:#8a9bae;font-size:14px;margin-bottom:16px">Informes y comprobantes firmados disponibles para descarga.</p>

      <!-- Search bar -->
      <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;margin-bottom:20px;padding:14px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
        <div style="flex:1;min-width:140px">
          <label style="display:block;font-size:11px;font-weight:600;color:#8a9bae;margin-bottom:4px">Desde</label>
          <input type="date" id="docSearchFrom" style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.2);color:#e0f0f0;font-size:13px" onchange="filterDocuments()">
        </div>
        <div style="flex:1;min-width:140px">
          <label style="display:block;font-size:11px;font-weight:600;color:#8a9bae;margin-bottom:4px">Hasta</label>
          <input type="date" id="docSearchTo" style="width:100%;padding:8px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:rgba(0,0,0,0.2);color:#e0f0f0;font-size:13px" onchange="filterDocuments()">
        </div>
        <button onclick="clearDocFilter()" style="padding:8px 14px;border-radius:6px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#8a9bae;cursor:pointer;font-size:12px">Limpiar</button>
        <button onclick="downloadAllVisible()" style="padding:8px 14px;border-radius:6px;border:none;background:#22c55e;color:#0a1214;cursor:pointer;font-weight:600;font-size:12px">Descargar todos</button>
      </div>

      <div id="documentsContent"></div>
    </div>
  </div>
</div>

<div class="footer">
  <div class="footer-inner">
    <div class="footer-brand">SINAC &middot; ACOPAC</div>
    <div class="footer-divider"></div>
    <div>Visor de solo lectura generado automáticamente &middot; Documento no editable</div>
  </div>
</div>

<script>
// ========== EMBEDDED DATA ==========
var DATA = EMBEDDED_JSON;
var LIVE_CONNECTED = false;
var ACTIVE_TAB = "calendar";

// ========== FIREBASE LIVE CONNECTION ==========
function updateLiveStatus(status, msg){
  var badge=document.getElementById("liveBadge");
  var label=document.getElementById("liveLabel");
  if(!badge||!label)return;
  badge.className="live-badge "+status;
  label.textContent=msg;
}

function updateLastSync(){
  var el=document.getElementById("lastSync");
  if(!el)return;
  var now=new Date();
  el.textContent=" | Sincronizado: "+now.toLocaleTimeString("es-CR");
}

function refreshCurrentView(){
  renderLegend();
  if(ACTIVE_TAB==="calendar")renderCalendar();
  if(ACTIVE_TAB==="reportA")renderReportA();
  if(ACTIVE_TAB==="reportB")renderReportB();
  if(ACTIVE_TAB==="reportC")renderReportC();
  if(ACTIVE_TAB==="reportD")renderReportD();
  if(ACTIVE_TAB==="summary")renderSummary();
  if(ACTIVE_TAB==="documents")renderDocuments();
  // If a day is selected, refresh its detail
  if(selectedDate){selectDay(selectedDate)}
}

function initFirebase(){
  if(!DATA.firebase||!DATA.firebase.config||!DATA.firebase.userUid){
    updateLiveStatus("disconnected","Sin datos de conexion");
    return;
  }
  if(typeof firebase==="undefined"){
    updateLiveStatus("disconnected","SDK no disponible");
    return;
  }
  try{
    var app=firebase.initializeApp(DATA.firebase.config);
    var auth=firebase.auth();
    var db=firebase.firestore();

    // Enable offline persistence
    db.enablePersistence().catch(function(err){console.warn("Persistence:",err)});

    updateLiveStatus("connecting","Conectando...");

    auth.signInAnonymously().then(function(){
      var fbUid=DATA.firebase.userUid;

      // Listen to tasks collection
      db.collection("users").doc(fbUid).collection("tasks")
.onSnapshot(function(snapshot){
  var liveTasks=[];
  snapshot.forEach(function(doc){
    var d=doc.data();
    d.id=doc.id;
    liveTasks.push(d);
  });
  DATA.tasks=liveTasks;
  LIVE_CONNECTED=true;
  updateLiveStatus("connected","En Vivo");
  updateLastSync();
  refreshCurrentView();
},function(err){
  console.warn("Tasks listener error:",err);
  updateLiveStatus("disconnected","Error: "+err.code);
});

      // Listen to documents collection
      db.collection("users").doc(fbUid).collection("documents")
.onSnapshot(function(snapshot){
  var liveDocs=[];
  snapshot.forEach(function(doc){
    var d=doc.data();
    d.id=doc.id;
    liveDocs.push(d);
  });
  DATA.documents=liveDocs;
  updateLastSync();
  if(ACTIVE_TAB==="documents")renderDocuments();
},function(err){
  console.warn("Documents listener error:",err);
});

      // Listen to settings (dayOverrides, activityTypes, viaticumRates)
      db.collection("users").doc(fbUid).collection("data").doc("calendar_settings")
.onSnapshot(function(docSnap){
  if(docSnap.exists){
    var s=docSnap.data();
    if(s.overrides)DATA.dayOverrides=s.overrides;
    if(s.activityTypes)DATA.activityTypes=s.activityTypes;
    if(s.viaticumRates)DATA.viaticumRates=s.viaticumRates;
    updateLastSync();
    refreshCurrentView();
  }
},function(err){
  console.warn("Settings listener error:",err);
});

    }).catch(function(err){
      console.error("Auth error:",err);
      updateLiveStatus("disconnected","Auth fallida");
    });

  }catch(e){
    console.error("Firebase init error:",e);
    updateLiveStatus("disconnected","Error de conexion");
  }
}
const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAY_NAMES = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
const DAY_NAMES_FULL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();
let selectedDate = null;
let showWeekends = false;

function toISO(date){
  const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
  return y+'-'+m+'-'+d;
}

function parseLocal(s){if(!s)return new Date();const p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])}

function getModality(dateStr){
  if(DATA.dayOverrides[dateStr])return DATA.dayOverrides[dateStr];
  const d=parseLocal(dateStr);const dow=d.getDay();
  if(DATA.holidays.some(h=>h.date===dateStr))return'holiday';
  if(dow===0||dow===6)return'none';
  if([1,4,5].includes(dow))return'telework';
  return'presencial';
}

function getModalityLabel(m){
  if(m==='telework')return'Teletrabajo';if(m==='presencial')return'Presencial';if(m==='holiday')return'Feriado';return'No laboral';
}

function getTasksForDate(dateStr){
  return DATA.tasks.filter(t=>{
    const tDate=toISO(new Date(t.start));
    return tDate===dateStr;
  }).sort((a,b)=>new Date(a.start)-new Date(b.start));
}

function getTypeColor(typeId){
  const at=DATA.activityTypes.find(a=>a.id===typeId);
  return at?at.color:'#718096';
}

function getStatusLabel(s){
  if(s==='completed')return'Finalizada';if(s==='in_progress')return'En curso';if(s==='paused')return'Pausada';return'Pendiente';
}

function getLugarDelDia(dateStr, tasksInDate){
  const mod = getModality(dateStr);
  if(mod==='telework') return 'Teletrabajo';
  const insp = tasksInDate.find(t=>t.typeId===3||t.activityTypeName==='Inspección');
  if(insp){
    const loc = insp.fieldData?.location;
    if(loc?.lugar) return loc.lugar;
    if(loc?.distrito) return loc.distrito + (loc.canton ? ', ' + loc.canton : '');
    if(loc?.canton) return loc.canton;
    if(insp.fieldData?.lugar){
      const p = insp.fieldData.lugar.split(',').map(s=>s.trim());
      return p.length>=2?p[1]:insp.fieldData.lugar;
    }
  }
  return 'OSRO';
}

function formatDuration(ms){
  if(!ms)return'0m';const m=Math.floor((ms/(1000*60))%60);const h=Math.floor(ms/(1000*60*60));return h+'h '+m+'m';
}

function getTotalWorked(task){
  if(!task.sessions||!task.sessions.length)return 0;
  return task.sessions.reduce((sum,s)=>sum+(s.end?new Date(s.end)-new Date(s.start):0),0);
}

// ========== TAB SWITCHING ==========
function switchTab(tabId){
  ACTIVE_TAB=tabId;
  document.querySelectorAll('.tab-content').forEach(function(el){el.style.display='none'});
  document.querySelectorAll('.tab').forEach(function(el){el.classList.remove('active')});
  document.getElementById('tab-'+tabId).style.display='block';
  if(event&&event.target)event.target.classList.add('active');
  if(tabId==='reportA')renderReportA();
  if(tabId==='reportB')renderReportB();
  if(tabId==='reportC')renderReportC();
  if(tabId==='reportD')renderReportD();
  if(tabId==='summary')renderSummary();
  if(tabId==='documents')renderDocuments();
}

// ========== CALENDAR ==========
function toggleWeekends(){
  showWeekends=document.getElementById('chkWeekends').checked;
  renderCalendar();
}

function navCalendar(dir){
  currentMonth+=dir;
  if(currentMonth>11){currentMonth=0;currentYear++}
  if(currentMonth<0){currentMonth=11;currentYear--}
  renderCalendar();
}

function renderCalendar(){
  const grid=document.getElementById('calGrid');
  const title=document.getElementById('calTitle');
  grid.innerHTML='';
  
  // Headers: 5 or 7 columns
  const allLabels=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const dayLabels=showWeekends?allLabels:allLabels.slice(0,5);
  grid.classList.toggle('no-weekends',!showWeekends);
  dayLabels.forEach(d=>{
    const el=document.createElement('div');el.className='cal-header';el.textContent=d;grid.appendChild(el);
  });

  const todayStr=toISO(new Date());
  let days=[];

  title.textContent=MONTH_NAMES[currentMonth]+' '+currentYear;
  const firstDay=new Date(currentYear,currentMonth,1);
  const lastDay=new Date(currentYear,currentMonth+1,0);
  let startDow=firstDay.getDay();if(startDow===0)startDow=7;
  for(let i=startDow-1;i>0;i--){
    const d=new Date(currentYear,currentMonth,1-i);
    days.push({date:d,otherMonth:true});
  }
  for(let i=1;i<=lastDay.getDate();i++){
    days.push({date:new Date(currentYear,currentMonth,i),otherMonth:false});
  }
  while(days.length%7!==0){
    const last=days[days.length-1].date;
    const next=new Date(last);next.setDate(last.getDate()+1);
    days.push({date:next,otherMonth:true});
  }

  // Filter weekends if hidden
  if(!showWeekends){
    days=days.filter(({date})=>{const dow=date.getDay();return dow!==0&&dow!==6;});
  }

  days.forEach(({date,otherMonth})=>{
    const iso=toISO(date);
    const mod=getModality(iso);
    const tasksDay=getTasksForDate(iso);
    const holiday=DATA.holidays.find(h=>h.date===iso);

    // Modality CSS class for cell background
    let modClass='';
    if(holiday||mod==='holiday')modClass=' day-holiday';
    else if(mod==='telework')modClass=' day-telework';
    else if(mod==='presencial')modClass=' day-presencial';
    else modClass=' day-none';

    const el=document.createElement('div');
    el.className='cal-day'+modClass+(otherMonth?' other-month':'')+(iso===todayStr?' today':'')+(selectedDate===iso?' selected':'');

    // Detect overlaps (excluding completed)
    const activeTasks=tasksDay.filter(t=>t.status!=='completed');
    let hasOverlap=false;
    for(let i=0;i<activeTasks.length&&!hasOverlap;i++){
      for(let j=i+1;j<activeTasks.length&&!hasOverlap;j++){
const t1s=new Date(activeTasks[i].start).getTime(),t1e=new Date(activeTasks[i].end).getTime();
const t2s=new Date(activeTasks[j].start).getTime(),t2e=new Date(activeTasks[j].end).getTime();
if(t1s<t2e&&t1e>t2s)hasOverlap=true;
      }
    }

    // Day number + overlap warning (left) + modality badge (right)
    let numHTML='<div style="display:flex;justify-content:space-between;align-items:flex-start">';
    numHTML+='<div style="display:flex;align-items:center;gap:3px"><span class="num">'+date.getDate()+'</span>';
    if(hasOverlap)numHTML+='<span class="overlap-warn" title="Actividades con horarios traslapados"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#DC2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></span>';
    numHTML+='</div>';

    // Modality badge (top-right)
    if(holiday){
      numHTML+='<span class="mod-badge mod-holiday">Feriado</span>';
    } else if(mod==='telework'){
      numHTML+='<span class="mod-badge mod-telework">Teletrabajo</span>';
    } else if(mod==='presencial'){
      numHTML+='<span class="mod-badge mod-presencial">Presencial</span>';
    } else {
      numHTML+='<span class="mod-badge mod-none">Ninguno</span>';
    }
    numHTML+='</div>';

    // Holiday name
    if(holiday){
      numHTML+='<div class="tag tag-holiday" style="margin-top:2px">'+holiday.name+'</div>';
    }

    // Tasks: 2 lines per task (line 1: tipo, line 2: expediente/boleta/acta/obs)
    tasksDay.slice(0,3).forEach(t=>{
      const tipo=t.activityTypeName||'Actividad';
      const secondLine=t.fieldData?.expediente||t.fieldData?.boleta||t.fieldData?.acta||t.observations||t.fieldData?.anotaciones||'';
      const tooltip=(tipo+(t.subtipo?' - '+t.subtipo:'')+(t.fieldData?.expediente?' (Exp: '+t.fieldData.expediente+')':'')).replace(/"/g,'&quot;');
      numHTML+='<div class="tag tag-task" title="'+tooltip+'">';
      numHTML+='<div style="font-weight:600;line-height:1.3">'+tipo.substring(0,22)+(tipo.length>22?'…':'')+'</div>';
      if(secondLine)numHTML+='<div style="font-size:9px;opacity:0.7;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+secondLine.substring(0,24)+(secondLine.length>24?'…':'')+'</div>';
      numHTML+='</div>';
    });
    if(tasksDay.length>3)numHTML+='<div class="tag tag-more">+'+(tasksDay.length-3)+' más</div>';

    el.innerHTML=numHTML;
    el.onclick=function(){selectDay(iso)};
    grid.appendChild(el);
  });
}

function selectDay(iso){
  selectedDate=iso;
  renderCalendar();
  const card=document.getElementById('dayDetailCard');
  const titleEl=document.getElementById('dayDetailTitle');
  const content=document.getElementById('dayDetailContent');
  const d=parseLocal(iso);
  const mod=getModality(iso);
  const tasks=getTasksForDate(iso);
  
  titleEl.textContent=DAY_NAMES_FULL[d.getDay()]+' '+d.getDate()+' de '+MONTH_NAMES[d.getMonth()]+' '+d.getFullYear()+' — '+getModalityLabel(mod);
  
  if(tasks.length===0){
    content.innerHTML='<div class="empty-state"><p>No hay actividades programadas para este día.</p></div>';
  } else {
    const lugar=getLugarDelDia(iso,tasks);
    let html='<div style="margin-bottom:14px;padding:12px 16px;background:#F4FAF7;border-radius:4px;font-size:14px;border:1px solid #B7E4C7"><strong style="color:#1B4332">Lugar:</strong> <span style="color:#2D6A4F;font-weight:600">'+lugar+'</span></div>';
    tasks.forEach(t=>{
      const worked=getTotalWorked(t);
      html+='<div class="day-detail">';
      html+='<div class="act-name">'+(t.activityTypeName||'Actividad')+(t.subtipo?' — '+t.subtipo:'')+'</div>';
      html+='<div class="act-field"><span>Horario:</span> '+new Date(t.start).toLocaleTimeString('es-CR',{hour:'2-digit',minute:'2-digit'})+' - '+new Date(t.end).toLocaleTimeString('es-CR',{hour:'2-digit',minute:'2-digit'})+'</div>';
      html+='<div class="act-field"><span>Estado:</span> <span class="status-badge status-'+t.status+'">'+getStatusLabel(t.status)+'</span></div>';
      if(worked>0)html+='<div class="act-field"><span>Tiempo trabajado:</span> '+formatDuration(worked)+'</div>';
      if(t.fieldData?.expediente)html+='<div class="act-field"><span>Expediente:</span> '+t.fieldData.expediente+'</div>';
      if(t.fieldData?.informe)html+='<div class="act-field"><span>Informe:</span> '+t.fieldData.informe+'</div>';
      if(t.fieldData?.asistentes)html+='<div class="act-field"><span>Asistentes:</span> '+t.fieldData.asistentes+'</div>';
      if(t.fieldData?.lugar)html+='<div class="act-field"><span>Ubicación:</span> '+t.fieldData.lugar+'</div>';
      if(t.fieldData?.tema)html+='<div class="act-field"><span>Tema:</span> '+t.fieldData.tema+'</div>';
      if(t.fieldData?.boleta)html+='<div class="act-field"><span>Boleta:</span> '+t.fieldData.boleta+'</div>';
      if(t.caseExternalRefText)html+='<div class="act-field"><span>Ref. expediente:</span> '+t.caseExternalRefText+'</div>';
      if(t.observations)html+='<div class="act-field"><span>Observaciones:</span> '+t.observations+'</div>';
      if(t.logistics?.codigoPP)html+='<div class="act-field"><span>Código PP:</span> '+t.logistics.codigoPP+'</div>';
      if(t.logistics?.viaticos&&t.logistics.viaticos.length>0)html+='<div class="act-field"><span>Viáticos:</span> '+t.logistics.viaticos.join(', ')+'</div>';
      if(t.logistics?.requiereVehiculo)html+='<div class="act-field"><span>Vehículo:</span> Sí'+(t.logistics.dobleTraccion?' (Doble tracción)':'')+'</div>';
      html+='</div>';
    });
    content.innerHTML=html;
  }
  card.style.display='block';
}

// ========== SEARCH ==========
function doSearch(query){
  const results=document.getElementById('searchResults');
  if(!query||query.length<2){
    results.innerHTML='<div class="empty-state"><p>Ingrese al menos 2 caracteres para buscar.</p></div>';
    return;
  }
  const q=query.toLowerCase();
  const found=DATA.tasks.filter(t=>{
    const exp=(t.fieldData?.expediente||'').toLowerCase();
    const inf=(t.fieldData?.informe||'').toLowerCase();
    const name=(t.activityTypeName||'').toLowerCase();
    const sub=(t.subtipo||'').toLowerCase();
    const tema=(t.fieldData?.tema||'').toLowerCase();
    const obs=(t.observations||'').toLowerCase();
    const lugar=(t.fieldData?.lugar||'').toLowerCase();
    const asis=(t.fieldData?.asistentes||'').toLowerCase();
    const caseRef=(t.caseExternalRefText||'').toLowerCase();
    return exp.includes(q)||inf.includes(q)||name.includes(q)||sub.includes(q)||tema.includes(q)||obs.includes(q)||lugar.includes(q)||asis.includes(q)||caseRef.includes(q);
  }).sort((a,b)=>new Date(a.start)-new Date(b.start));

  if(found.length===0){
    results.innerHTML='<div class="empty-state"><p>No se encontraron resultados para "'+query+'".</p></div>';
    return;
  }

  let html='<p style="font-size:13px;color:#2D6A4F;margin-bottom:12px;font-weight:600;background:#F4FAF7;display:inline-block;padding:5px 14px;border-radius:4px;border:1px solid #B7E4C7">'+found.length+' resultado(s)</p>';
  found.forEach(t=>{
    const d=new Date(t.start);
    const iso=toISO(d);
    html+='<div class="search-result-item" onclick="switchToCalendarAndSelect(\\''+iso+'\\')">';
    html+='<div class="sr-title">'+(t.activityTypeName||'Actividad')+(t.subtipo?' — '+t.subtipo:'')+'</div>';
    html+='<div class="sr-detail">'+d.toLocaleDateString('es-CR',{weekday:'long',year:'numeric',month:'long',day:'numeric'})+'</div>';
    if(t.fieldData?.expediente)html+='<div class="sr-detail"><strong>Expediente:</strong> '+t.fieldData.expediente+'</div>';
    if(t.fieldData?.informe)html+='<div class="sr-detail"><strong>Informe:</strong> '+t.fieldData.informe+'</div>';
    html+='<div class="sr-detail"><strong>Estado:</strong> '+getStatusLabel(t.status)+'</div>';
    html+='</div>';
  });
  results.innerHTML=html;
}

function switchToCalendarAndSelect(iso){
  const d=parseLocal(iso);
  currentYear=d.getFullYear();
  currentMonth=d.getMonth();
  // Switch to calendar tab
  document.querySelectorAll('.tab-content').forEach(el=>el.style.display='none');
  document.querySelectorAll('.tab').forEach(el=>el.classList.remove('active'));
  document.getElementById('tab-calendar').style.display='block';
  document.querySelectorAll('.tab')[0].classList.add('active');
  selectedDate=iso;
  renderCalendar();
  selectDay(iso);
  document.getElementById('dayDetailCard').scrollIntoView({behavior:'smooth'});
}

// ========== REPORT A (Realizadas) ==========
function renderReportA(){
  const startVal=document.getElementById('realStart').value;
  const endVal=document.getElementById('realEnd').value;
  if(!startVal||!endVal){document.getElementById('reportAContainer').innerHTML='<div class="empty-state"><p>Seleccione rango de fechas.</p></div>';return}
  const startD=parseLocal(startVal);const endD=parseLocal(endVal);endD.setHours(23,59,59);
  
  const realized=DATA.tasks.filter(t=>{
    const td=new Date(t.start);const iso=toISO(td);const ld=parseLocal(iso);
    return ld>=startD&&ld<=endD&&((t.sessions&&t.sessions.length>0)||t.status==='completed'||t.status==='in_progress');
  }).sort((a,b)=>new Date(a.start)-new Date(b.start));

  if(realized.length===0){document.getElementById('reportAContainer').innerHTML='<div class="empty-state"><p>No hay actividades realizadas en este periodo.</p></div>';return}

  let html='<table class="report-table"><thead><tr><th>N°</th><th>Fecha</th><th>Actividad Realizada</th><th>Expediente/Caso</th><th>Oficio</th><th>Tiempo</th><th>Estado</th></tr></thead><tbody>';
  realized.forEach((t,idx)=>{
    const d=new Date(t.start);
    const worked=getTotalWorked(t);
    const linkedCase=t.caseUid&&DATA.cases?DATA.cases.find(c=>c.caseUid===t.caseUid):null;
    const linkedBatch=t.batchUid&&DATA.batches?DATA.batches.find(b=>b.batchUid===t.batchUid):null;
    const expParts=[];
    if(t.fieldData?.expediente)expParts.push(t.fieldData.expediente);
    if(linkedCase?.title)expParts.push(linkedCase.title);
    else if(t.caseExternalRefText)expParts.push(t.caseExternalRefText);
    if(linkedBatch?.title)expParts.push('Lote: '+linkedBatch.title);
    const expedienteCaso=expParts.join(' | ');
    html+='<tr>';
    html+='<td>'+(idx+1)+'</td>';
    html+='<td>'+d.toLocaleDateString('es-CR')+'</td>';
    html+='<td style="text-align:left">'+(t.activityTypeName||'')+(t.subtipo?' - '+t.subtipo:'')+'</td>';
    html+='<td>'+expedienteCaso+'</td>';
    html+='<td>'+(t.fieldData?.informe||'')+'</td>';
    html+='<td>'+formatDuration(worked)+'</td>';
    html+='<td><span class="status-badge status-'+t.status+'">'+getStatusLabel(t.status)+'</span></td>';
    html+='</tr>';
  });
  html+='</tbody></table>';
  document.getElementById('reportAContainer').innerHTML=html;
}

// ========== REPORT B (Programadas) ==========
function renderReportB(){
  const startVal=document.getElementById('schedStart').value;
  const endVal=document.getElementById('schedEnd').value;
  if(!startVal||!endVal){document.getElementById('reportBContainer').innerHTML='<div class="empty-state"><p>Seleccione rango de fechas.</p></div>';return}
  const startD=parseLocal(startVal);const endD=parseLocal(endVal);endD.setHours(23,59,59);
  
  const scheduled=DATA.tasks.filter(t=>{
    const td=new Date(t.start);const iso=toISO(td);const ld=parseLocal(iso);
    return ld>=startD&&ld<=endD&&t.status!=='completed';
  }).sort((a,b)=>new Date(a.start)-new Date(b.start));

  if(scheduled.length===0){document.getElementById('reportBContainer').innerHTML='<div class="empty-state"><p>No hay actividades programadas en este periodo.</p></div>';return}

  const noLugarTypes=[14,15,16,17,19];
  const grouped={};
  scheduled.forEach(t=>{
    const d=new Date(t.start);
    const key=d.getDate()+'/'+(d.getMonth()+1)+'/'+String(d.getFullYear()).slice(-2);
    if(!grouped[key])grouped[key]=[];
    grouped[key].push(t);
  });

  let html='<table class="report-table"><thead><tr><th rowspan="2">N°</th><th rowspan="2">Fecha</th><th rowspan="2">Lugar</th><th rowspan="2">Actividad</th><th rowspan="2">Expediente</th><th rowspan="2">Acompañantes</th><th colspan="2">Vehículo</th><th colspan="2">Doble T.</th><th colspan="2">Tarj. Ruedo</th><th colspan="4">Viáticos</th><th rowspan="2">Cód. PP</th></tr><tr><th>Sí</th><th>No</th><th>Sí</th><th>No</th><th>Sí</th><th>No</th><th>D</th><th>A</th><th>C</th><th>H</th></tr></thead><tbody>';

  let globalRowNumHTML=0;
  const entries=Object.entries(grouped).sort((a,b)=>new Date(a[1][0].start)-new Date(b[1][0].start));
  entries.forEach(([,g])=>g.sort((a,b)=>new Date(a.start)-new Date(b.start)));
  entries.forEach(([dateStr,tasksInDate])=>{
    const rc=tasksInDate.length;
    const iso=toISO(new Date(tasksInDate[0].start));
    const lugarDia=getLugarDelDia(iso,tasksInDate);
    const anyVeh=tasksInDate.some(t=>!!t.logistics?.requiereVehiculo);
    const anyDoble=tasksInDate.some(t=>!!t.logistics?.dobleTraccion);
    const anyTarj=tasksInDate.some(t=>!!t.logistics?.tarjetaRuedo);
    const anyDes=tasksInDate.some(t=>(t.logistics?.viaticos||[]).includes('Desayuno'));
    const anyAlm=tasksInDate.some(t=>(t.logistics?.viaticos||[]).includes('Almuerzo'));
    const anyCen=tasksInDate.some(t=>(t.logistics?.viaticos||[]).includes('Cena'));
    const anyHos=tasksInDate.some(t=>(t.logistics?.viaticos||[]).includes('Hospedaje'));

    tasksInDate.forEach((t,idx)=>{
      globalRowNumHTML++;
      const isFirst=idx===0;
      const isNoLugar=noLugarTypes.includes(parseInt(t.typeId));
      const act=(t.activityTypeName||'')+(t.subtipo?' - '+t.subtipo:'');
      const linkedCaseHTML=t.caseUid&&DATA.cases?DATA.cases.find(c=>c.caseUid===t.caseUid):null;
      const linkedBatchHTML=t.batchUid&&DATA.batches?DATA.batches.find(b=>b.batchUid===t.batchUid):null;
      const expPartsHTML=[];
      if(t.fieldData?.expediente) expPartsHTML.push(t.fieldData.expediente);
      if(linkedCaseHTML?.title) expPartsHTML.push(linkedCaseHTML.title);
      else if(t.caseExternalRefText) expPartsHTML.push(t.caseExternalRefText);
      if(linkedBatchHTML?.title) expPartsHTML.push('Lote: '+linkedBatchHTML.title);
      const exp=expPartsHTML.join(' | ');
      html+='<tr>';
      html+='<td>'+globalRowNumHTML+'</td>';
      if(isFirst)html+='<td rowspan="'+rc+'">'+dateStr+'</td>';
      html+='<td style="text-align:left">'+(isNoLugar?'':lugarDia)+'</td>';
      html+='<td style="text-align:left">'+act+'</td>';
      html+='<td>'+exp+'</td>';
      html+='<td>'+(t.fieldData?.asistentes||'')+'</td>';
      if(isFirst){
html+='<td rowspan="'+rc+'">'+(anyVeh?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(!anyVeh?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(anyDoble?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(!anyDoble?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(anyTarj?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(!anyTarj?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(anyDes?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(anyAlm?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(anyCen?'X':'')+'</td>';
html+='<td rowspan="'+rc+'">'+(anyHos?'X':'')+'</td>';
      }
      html+='<td>'+(isNoLugar?'':(t.logistics?.codigoPP||'PPI-17-E18'))+'</td>';
      html+='</tr>';
    });
  });
  html+='</tbody></table>';
  document.getElementById('reportBContainer').innerHTML=html;
}

// ========== REPORT C (Pendientes) ==========
function renderReportC(){
  const now=new Date();
  const pending=DATA.tasks.filter(t=>{
    return t.status!=='completed'&&(new Date(t.end)<now||t.status==='paused');
  }).sort((a,b)=>new Date(a.start)-new Date(b.start));

  if(pending.length===0){
    document.getElementById('reportCContainer').innerHTML='<div class="empty-state"><p>No hay actividades pendientes. ¡Todo al día!</p></div>';
    return;
  }

  let html='<table class="report-table"><thead><tr><th>N°</th><th>Fecha Original</th><th>Actividad</th><th>Expediente/Caso</th><th>Rezago</th><th>Tiempo Invertido</th><th>Sesiones</th></tr></thead><tbody>';
  pending.forEach((t,idx)=>{
    const lagDays=Math.floor((now-new Date(t.start))/(1000*60*60*24));
    const lagText=lagDays>0?lagDays+' días':'0 días';
    const lagColor=lagDays>7?'color:#B91C1C;font-weight:700':'';
    const worked=getTotalWorked(t);
    const desc=(t.activityTypeName||'')+(t.subtipo?' - '+t.subtipo:'');
    const linkedCase=t.caseUid&&DATA.cases?DATA.cases.find(c=>c.caseUid===t.caseUid):null;
    const linkedBatch=t.batchUid&&DATA.batches?DATA.batches.find(b=>b.batchUid===t.batchUid):null;
    const expParts=[];
    if(t.fieldData?.expediente)expParts.push(t.fieldData.expediente);
    if(linkedCase?.title)expParts.push(linkedCase.title);
    else if(t.caseExternalRefText)expParts.push(t.caseExternalRefText);
    if(linkedBatch?.title)expParts.push('Lote: '+linkedBatch.title);
    if(t.fieldData?.informe)expParts.push('Inf: '+t.fieldData.informe);
    const expedienteCaso=expParts.join(' | ');
    html+='<tr>';
    html+='<td>'+(idx+1)+'</td>';
    html+='<td>'+new Date(t.start).toLocaleDateString('es-CR')+'</td>';
    html+='<td style="text-align:left">'+desc+'</td>';
    html+='<td>'+expedienteCaso+'</td>';
    html+='<td style="'+lagColor+'">'+lagText+'</td>';
    html+='<td>'+formatDuration(worked)+'</td>';
    html+='<td>'+(t.sessions?t.sessions.length:0)+'</td>';
    html+='</tr>';
  });
  html+='</tbody></table>';
  document.getElementById('reportCContainer').innerHTML=html;
}

// ========== SUMMARY ==========
function renderSummary(){
  const total=DATA.tasks.length;
  const now=new Date();
  const completed=DATA.tasks.filter(t=>t.status==='completed');
  const inProgressList=DATA.tasks.filter(t=>t.status==='in_progress');
  const programadas=DATA.tasks.filter(t=>t.status==='pending');
  const pendientes=DATA.tasks.filter(t=>t.status!=='completed'&&(new Date(t.end)<now||t.status==='paused'));

  // Count by type
  const byType={};
  DATA.tasks.forEach(t=>{
    const name=t.activityTypeName||'Sin tipo';
    byType[name]=(byType[name]||0)+1;
  });

  // Count by month
  const byMonth={};
  DATA.tasks.forEach(t=>{
    const d=new Date(t.start);
    const key=MONTH_NAMES[d.getMonth()]+' '+d.getFullYear();
    byMonth[key]=(byMonth[key]||0)+1;
  });

  // Helper to build a task list table
  function buildListHTML(tasks,id){
    if(tasks.length===0)return '<div id="detail-'+id+'" style="display:none;margin-bottom:20px;padding:12px;background:var(--surface);border:1px solid var(--line);border-radius:4px"><p style="color:var(--ink-faint);font-style:italic">No hay actividades.</p></div>';
    var h='<div id="detail-'+id+'" style="display:none;margin-bottom:20px">';
    h+='<table class="report-table"><thead><tr><th>Fecha</th><th style="text-align:left">Actividad</th><th>Expediente</th><th>Estado</th></tr></thead><tbody>';
    tasks.sort(function(a,b){return new Date(a.start)-new Date(b.start)}).forEach(function(t){
      h+='<tr>';
      h+='<td>'+new Date(t.start).toLocaleDateString("es-CR")+'</td>';
      h+='<td style="text-align:left">'+(t.activityTypeName||"")+(t.subtipo?" - "+t.subtipo:"")+'</td>';
      h+='<td>'+(t.fieldData?.expediente||"")+'</td>';
      h+='<td><span class="status-badge status-'+t.status+'">'+getStatusLabel(t.status)+'</span></td>';
      h+='</tr>';
    });
    h+='</tbody></table></div>';
    return h;
  }

  var html='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px;margin-bottom:16px">';
  html+='<div class="summary-card" style="background:#F4FAF7;border:1px solid #B7E4C7" onclick="toggleSummaryDetail(this,&quot;total&quot;)"><div style="font-size:36px;font-weight:800;color:#1B4332">'+total+'</div><div style="font-size:12px;color:#2D6A4F;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px">Total</div></div>';
  html+='<div class="summary-card" style="background:#F4FAF7;border:1px solid #B7E4C7" onclick="toggleSummaryDetail(this,&quot;completed&quot;)"><div style="font-size:36px;font-weight:800;color:#166534">'+completed.length+'</div><div style="font-size:12px;color:#2D6A4F;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px">Finalizadas</div></div>';
  html+='<div class="summary-card" style="background:#DBEAFE;border:1px solid #93C5FD" onclick="toggleSummaryDetail(this,&quot;inprogress&quot;)"><div style="font-size:36px;font-weight:800;color:#1E40AF">'+inProgressList.length+'</div><div style="font-size:12px;color:#374151;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px">En curso</div></div>';
  html+='<div class="summary-card" style="background:#FEF3C7;border:1px solid #FDE68A" onclick="toggleSummaryDetail(this,&quot;programadas&quot;)"><div style="font-size:36px;font-weight:800;color:#92400E">'+programadas.length+'</div><div style="font-size:12px;color:#374151;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px">Programadas</div></div>';
  html+='<div class="summary-card" style="background:#FFF7ED;border:2px solid #F59E0B" onclick="toggleSummaryDetail(this,&quot;pendientes&quot;)"><div style="font-size:36px;font-weight:800;color:#B45309">'+pendientes.length+'</div><div style="font-size:12px;color:#92400E;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-top:6px">Pendientes</div></div>';
  html+='</div>';

  // Expandable detail lists
  html+=buildListHTML(DATA.tasks,"total");
  html+=buildListHTML(completed,"completed");
  html+=buildListHTML(inProgressList,"inprogress");
  html+=buildListHTML(programadas,"programadas");
  html+=buildListHTML(pendientes,"pendientes");

  html+='<h3 style="font-family:Merriweather,Georgia,serif;font-size:17px;font-weight:700;margin-bottom:12px;color:#1B4332;padding-bottom:10px;border-bottom:1px solid #D1D5DB">Por tipo de actividad</h3>';
  html+='<table class="report-table" style="margin-bottom:28px"><thead><tr><th style="text-align:left">Tipo</th><th>Cantidad</th></tr></thead><tbody>';
  Object.entries(byType).sort(function(a,b){return b[1]-a[1]}).forEach(function(e){
    html+='<tr><td style="text-align:left;font-weight:600">'+e[0]+'</td><td style="font-weight:700">'+e[1]+'</td></tr>';
  });
  html+='</tbody></table>';

  html+='<h3 style="font-family:Merriweather,Georgia,serif;font-size:17px;font-weight:700;margin-bottom:12px;color:#1B4332;padding-bottom:10px;border-bottom:1px solid #D1D5DB">Por mes</h3>';
  html+='<table class="report-table"><thead><tr><th>Mes</th><th>Cantidad</th></tr></thead><tbody>';
  Object.entries(byMonth).forEach(function(e){
    html+='<tr><td style="font-weight:600">'+e[0]+'</td><td style="font-weight:700">'+e[1]+'</td></tr>';
  });
  html+='</tbody></table>';

  document.getElementById("summaryContent").innerHTML=html;
}

// Toggle summary detail panels
function toggleSummaryDetail(el,id){
  var panel=document.getElementById("detail-"+id);
  if(!panel)return;
  var isVisible=panel.style.display!=="none";
  ["total","completed","inprogress","programadas","pendientes"].forEach(function(k){
    var d=document.getElementById("detail-"+k);
    if(d)d.style.display="none";
  });
  document.querySelectorAll(".summary-card").forEach(function(c){c.classList.remove("active")});
  if(!isVisible){panel.style.display="block";el.classList.add("active")}
}

// ========== LEGEND ==========
function renderLegend(){
  let html='';
  DATA.activityTypes.forEach(at=>{
    const count=DATA.tasks.filter(t=>t.typeId===at.id).length;
    if(count>0){
      html+='<div class="legend-item">'+at.name+' <strong>('+count+')</strong></div>';
    }
  });
  document.getElementById('legendBox').innerHTML=html;
}

// ========== BUDGET CALCULATION ==========
function calcCost(task){
  if(!task.logistics||!task.logistics.viaticos||task.logistics.viaticos.length===0)return 0;
  const rates=DATA.viaticumRates||{};
  let cost=0;
  const v=task.logistics.viaticos;
  if(v.includes('Desayuno'))cost+=rates.breakfast||0;
  if(v.includes('Almuerzo'))cost+=rates.lunch||0;
  if(v.includes('Cena'))cost+=rates.dinner||0;
  if(v.includes('Hospedaje'))cost+=task.logistics.lodgingCost||rates.lodging||0;
  return cost;
}

function formatCRC(n){return'₡'+n.toLocaleString('es-CR')}

// ========== REPORT D (Presupuesto) ==========
function renderReportD(){
  const withViat=DATA.tasks.filter(t=>t.logistics&&t.logistics.viaticos&&t.logistics.viaticos.length>0);
  if(withViat.length===0){
    document.getElementById('reportDContainer').innerHTML='<div class="empty-state"><p>No hay actividades con viáticos asignados.</p></div>';
    return;
  }

  function buildSemTable(tasks,label){
    const groups={};
    tasks.forEach(t=>{
      const pp=t.logistics?.codigoPP||'Sin Asignar';
      if(!groups[pp])groups[pp]={tasks:[],total:0};
      groups[pp].tasks.push(t);
      groups[pp].total+=calcCost(t);
    });

    const sorted=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0]));
    if(sorted.length===0)return'<p style="color:var(--ink-faint);padding:12px;font-style:italic">No hay actividades con viáticos en este semestre.</p>';

    let grandTotal=0;
    let html='<h3 style="font-family:Merriweather,Georgia,serif;font-size:16px;font-weight:700;margin:20px 0 12px;color:#1B4332;padding-bottom:8px;border-bottom:1px solid #D1D5DB">'+label+'</h3>';
    html+='<table class="report-table"><thead><tr><th style="text-align:left">Código PP</th><th>Monto Total</th><th>Monto Individual</th><th>Fecha</th><th style="text-align:left">Actividades</th></tr></thead><tbody>';
    sorted.forEach(([pp,data])=>{
      grandTotal+=data.total;
      const rc=data.tasks.length;
      data.tasks.sort((a,b)=>new Date(a.start)-new Date(b.start)).forEach((t,idx)=>{
const cost=calcCost(t);
const tipo=t.activityTypeName||'Actividad';
const exp=t.fieldData?.expediente?'Exp. '+t.fieldData.expediente:'';
const inf=t.fieldData?.informe?'Inf. '+t.fieldData.informe:(t.fieldData?.boleta?'Bol. '+t.fieldData.boleta:(t.observations?'Obs: '+t.observations.substring(0,40):''));
const desc=[tipo,exp,inf].filter(Boolean).join(' - ');
const fecha=new Date(t.start).toLocaleDateString('es-CR');
html+='<tr>';
if(idx===0){
  html+='<td rowspan="'+rc+'" style="text-align:left;font-weight:700;white-space:nowrap;vertical-align:top">'+pp+'</td>';
  html+='<td rowspan="'+rc+'" style="font-weight:700;white-space:nowrap;vertical-align:top">'+formatCRC(data.total)+'</td>';
}
html+='<td style="white-space:nowrap;text-align:right">'+formatCRC(cost)+'</td>';
html+='<td style="white-space:nowrap">'+fecha+'</td>';
html+='<td style="text-align:left;font-size:12px">'+desc+'</td>';
html+='</tr>';
      });
    });
    html+='<tr style="background:#F4FAF7;font-weight:800"><td style="text-align:right">TOTAL</td><td>'+formatCRC(grandTotal)+'</td><td colspan="3"></td></tr>';
    html+='</tbody></table>';
    return html;
  }

  const sem1=withViat.filter(t=>{const m=new Date(t.start).getMonth();return m>=0&&m<=5;});
  const sem2=withViat.filter(t=>{const m=new Date(t.start).getMonth();return m>=6&&m<=11;});

  let html=buildSemTable(sem1,'I Semestre (Enero — Junio)');
  html+=buildSemTable(sem2,'II Semestre (Julio — Diciembre)');
  document.getElementById('reportDContainer').innerHTML=html;
}

// ========== PDF EXPORT FUNCTIONS ==========
function makePDF(title,headers,rows,filename,orientation){
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:orientation||'landscape',unit:'mm',format:'letter'});
  doc.setFont('helvetica','bold');
  doc.setFontSize(14);
  doc.setTextColor(27,67,50);
  doc.text(title,14,16);
  doc.setFontSize(9);
  doc.setFont('helvetica','normal');
  doc.setTextColor(100,100,100);
  doc.text('SINAC - ACOPAC - Oficina Subregional de Orotina',14,22);
  doc.text('Generado: '+new Date().toLocaleDateString('es-CR',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),14,27);
  doc.autoTable({
    head:[headers],
    body:rows,
    startY:32,
    theme:'grid',
    headStyles:{fillColor:[27,67,50],textColor:255,fontSize:8,fontStyle:'bold',halign:'center'},
    bodyStyles:{fontSize:7.5,textColor:[55,65,81],cellPadding:2},
    alternateRowStyles:{fillColor:[244,250,247]},
    styles:{lineColor:[209,213,219],lineWidth:0.2,overflow:'linebreak'},
    margin:{left:14,right:14}
  });
  doc.save(filename);
}

function exportPDF_A(){
  const startVal=document.getElementById('realStart').value;
  const endVal=document.getElementById('realEnd').value;
  if(!startVal||!endVal){alert('Seleccione rango de fechas.');return}
  const startD=parseLocal(startVal);const endD=parseLocal(endVal);endD.setHours(23,59,59);
  const realized=DATA.tasks.filter(t=>{
    const td=new Date(t.start);const iso=toISO(td);const ld=parseLocal(iso);
    return ld>=startD&&ld<=endD&&((t.sessions&&t.sessions.length>0)||t.status==='completed'||t.status==='in_progress');
  }).sort((a,b)=>new Date(a.start)-new Date(b.start));
  if(realized.length===0){alert('No hay datos para exportar.');return}
  const headers=['N°','Fecha','Actividad Realizada','Expediente/Caso','Oficio','Tiempo','Estado'];
  const rows=realized.map((t,idx)=>{
    const linkedCase=t.caseUid&&DATA.cases?DATA.cases.find(c=>c.caseUid===t.caseUid):null;
    const linkedBatch=t.batchUid&&DATA.batches?DATA.batches.find(b=>b.batchUid===t.batchUid):null;
    const expParts=[];
    if(t.fieldData?.expediente)expParts.push(t.fieldData.expediente);
    if(linkedCase?.title)expParts.push(linkedCase.title);
    else if(t.caseExternalRefText)expParts.push(t.caseExternalRefText);
    if(linkedBatch?.title)expParts.push('Lote: '+linkedBatch.title);
    return[
      String(idx+1),
      new Date(t.start).toLocaleDateString('es-CR'),
      (t.activityTypeName||'')+(t.subtipo?' - '+t.subtipo:''),
      expParts.join(' | '),
      t.fieldData?.informe||'',
      formatDuration(getTotalWorked(t)),
      getStatusLabel(t.status)
    ];
  });
  makePDF('A. Actividades Realizadas ('+startVal+' a '+endVal+')',headers,rows,'reporte_A_realizadas.pdf');
}

function exportPDF_B(){
  const startVal=document.getElementById('schedStart').value;
  const endVal=document.getElementById('schedEnd').value;
  if(!startVal||!endVal){alert('Seleccione rango de fechas.');return}
  const startD=parseLocal(startVal);const endD=parseLocal(endVal);endD.setHours(23,59,59);
  const scheduled=DATA.tasks.filter(t=>{
    const td=new Date(t.start);const iso=toISO(td);const ld=parseLocal(iso);
    return ld>=startD&&ld<=endD&&t.status!=='completed';
  }).sort((a,b)=>new Date(a.start)-new Date(b.start));
  if(scheduled.length===0){alert('No hay datos para exportar.');return}
  const noLugarTypes=[14,15,16,17,19];
  const headers=['N°','Fecha','Lugar','Actividad','Expediente','Acompañ.','Veh.','Doble','Tarj.','D','A','C','H','Cód. PP'];
  const rows=scheduled.map((t,idx)=>{
    const iso=toISO(new Date(t.start));
    const isNoLugar=noLugarTypes.includes(parseInt(t.typeId));
    const v=t.logistics?.viaticos||[];
    return[
      String(idx+1),
      new Date(t.start).toLocaleDateString('es-CR'),
      isNoLugar?'':getLugarDelDia(iso,[t]),
      (t.activityTypeName||'')+(t.subtipo?' - '+t.subtipo:''),
      t.fieldData?.expediente||'',
      t.fieldData?.asistentes||'',
      t.logistics?.requiereVehiculo?'X':'',
      t.logistics?.dobleTraccion?'X':'',
      t.logistics?.tarjetaRuedo?'X':'',
      v.includes('Desayuno')?'X':'',
      v.includes('Almuerzo')?'X':'',
      v.includes('Cena')?'X':'',
      v.includes('Hospedaje')?'X':'',
      isNoLugar?'':(t.logistics?.codigoPP||'PPI-17-E18')
    ];
  });
  makePDF('B. Actividades Programadas ('+startVal+' a '+endVal+')',headers,rows,'reporte_B_programadas.pdf');
}

function exportPDF_C(){
  const now=new Date();
  const pending=DATA.tasks.filter(t=>t.status!=='completed'&&(new Date(t.end)<now||t.status==='paused')).sort((a,b)=>new Date(a.start)-new Date(b.start));
  if(pending.length===0){alert('No hay datos para exportar.');return}
  const headers=['N°','Fecha Original','Actividad','Expediente/Caso','Rezago','Tiempo Invertido','Sesiones'];
  const rows=pending.map((t,idx)=>{
    const lagDays=Math.floor((now-new Date(t.start))/(1000*60*60*24));
    const desc=(t.activityTypeName||'')+(t.subtipo?' - '+t.subtipo:'');
    const linkedCase=t.caseUid&&DATA.cases?DATA.cases.find(c=>c.caseUid===t.caseUid):null;
    const linkedBatch=t.batchUid&&DATA.batches?DATA.batches.find(b=>b.batchUid===t.batchUid):null;
    const expParts=[];
    if(t.fieldData?.expediente)expParts.push(t.fieldData.expediente);
    if(linkedCase?.title)expParts.push(linkedCase.title);
    else if(t.caseExternalRefText)expParts.push(t.caseExternalRefText);
    if(linkedBatch?.title)expParts.push('Lote: '+linkedBatch.title);
    if(t.fieldData?.informe)expParts.push('Inf: '+t.fieldData.informe);
    return[
      String(idx+1),
      new Date(t.start).toLocaleDateString('es-CR'),
      desc,
      expParts.join(' | '),
      (lagDays>0?lagDays:0)+' días',
      formatDuration(getTotalWorked(t)),
      String(t.sessions?t.sessions.length:0)
    ];
  });
  makePDF('C. Actividades Pendientes',headers,rows,'reporte_C_pendientes.pdf');
}

function exportPDF_D(){
  const withViat=DATA.tasks.filter(t=>t.logistics&&t.logistics.viaticos&&t.logistics.viaticos.length>0);
  if(withViat.length===0){alert('No hay datos para exportar.');return}
  const{jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'landscape',unit:'mm',format:'letter'});
  doc.setFont('helvetica','bold');doc.setFontSize(14);doc.setTextColor(27,67,50);
  doc.text('D. Presupuesto de Viáticos',14,16);
  doc.setFontSize(9);doc.setFont('helvetica','normal');doc.setTextColor(100,100,100);
  doc.text('SINAC - ACOPAC - Oficina Subregional de Orotina',14,22);
  doc.text('Generado: '+new Date().toLocaleDateString('es-CR',{weekday:'long',year:'numeric',month:'long',day:'numeric'}),14,27);

  function addSemTable(tasks,label,startY){
    const groups={};
    tasks.forEach(t=>{
      const pp=t.logistics?.codigoPP||'Sin Asignar';
      if(!groups[pp])groups[pp]={tasks:[],total:0};
      groups[pp].tasks.push(t);
      groups[pp].total+=calcCost(t);
    });
    const sorted=Object.entries(groups).sort((a,b)=>a[0].localeCompare(b[0]));
    if(sorted.length===0){
      doc.setFontSize(10);doc.setFont('helvetica','italic');doc.setTextColor(150,150,150);
      doc.text(label+': Sin actividades con viáticos',14,startY+5);
      return startY+12;
    }
    doc.setFontSize(11);doc.setFont('helvetica','bold');doc.setTextColor(27,67,50);
    doc.text(label,14,startY);
    let grandTotal=0;
    const rows=[];
    sorted.forEach(([pp,data])=>{
      grandTotal+=data.total;
      data.tasks.sort((a,b)=>new Date(a.start)-new Date(b.start)).forEach((t,idx)=>{
const cost=calcCost(t);
const tipo=t.activityTypeName||'Actividad';
const exp=t.fieldData?.expediente?'Exp. '+t.fieldData.expediente:'';
const inf=t.fieldData?.informe?'Inf. '+t.fieldData.informe:(t.fieldData?.boleta?'Bol. '+t.fieldData.boleta:(t.observations?'Obs: '+t.observations.substring(0,40):''));
const desc=[tipo,exp,inf].filter(Boolean).join(' - ');
const fecha=new Date(t.start).toLocaleDateString('es-CR');
rows.push([idx===0?pp:'',idx===0?formatCRC(data.total):'',formatCRC(cost),fecha,desc]);
      });
    });
    rows.push([{content:'TOTAL',styles:{halign:'right',fontStyle:'bold'}},{content:formatCRC(grandTotal),styles:{fontStyle:'bold'}},'','','']);
    doc.autoTable({
      head:[['Código PP','Monto Total','Monto Indiv.','Fecha','Actividades']],
      body:rows,
      startY:startY+4,
      theme:'grid',
      headStyles:{fillColor:[27,67,50],textColor:255,fontSize:8,fontStyle:'bold',halign:'center'},
      bodyStyles:{fontSize:7,textColor:[55,65,81],cellPadding:2},
      columnStyles:{0:{cellWidth:28},1:{cellWidth:22,halign:'right'},2:{cellWidth:22,halign:'right'},3:{cellWidth:22},4:{cellWidth:'auto'}},
      alternateRowStyles:{fillColor:[244,250,247]},
      styles:{lineColor:[209,213,219],lineWidth:0.2,overflow:'linebreak'},
      margin:{left:14,right:14}
    });
    return doc.lastAutoTable.finalY+10;
  }

  const sem1=withViat.filter(t=>{const m=new Date(t.start).getMonth();return m>=0&&m<=5;});
  const sem2=withViat.filter(t=>{const m=new Date(t.start).getMonth();return m>=6&&m<=11;});

  let y=addSemTable(sem1,'I Semestre (Enero — Junio)',34);
  if(y>170){doc.addPage();y=20;}
  addSemTable(sem2,'II Semestre (Julio — Diciembre)',y);
  doc.save('reporte_D_presupuesto.pdf');
}

// ========== DOCUMENTS ==========
var DOC_TYPE_LABELS={teletrabajo:'Informes mensuales de teletrabajo',programacion_ejecucion:'Informes de programación y ejecución semanal',comprobantes:'Comprobantes'};
var DOC_TYPE_ORDER=['teletrabajo','programacion_ejecucion','comprobantes'];
var visibleDocIds=[];

function fmtDocDate(iso){
  if(!iso)return '—';
  try{var d=new Date(iso.indexOf('T')>=0?iso:iso+'T00:00:00');return d.toLocaleDateString('es-CR',{day:'2-digit',month:'2-digit',year:'numeric'});}catch(e){return '—';}
}

function fmtSize(bytes){
  if(!bytes)return '';
  if(bytes<1024)return bytes+' B';
  if(bytes<1048576)return (bytes/1024).toFixed(1)+' KB';
  return (bytes/1048576).toFixed(1)+' MB';
}

function getFilteredDocs(){
  var docs=(DATA.documents||[]).slice();
  var from=document.getElementById('docSearchFrom')?.value||'';
  var to=document.getElementById('docSearchTo')?.value||'';
  if(from){docs=docs.filter(function(d){return(d.periodEnd||'')>=from;});}
  if(to){docs=docs.filter(function(d){return(d.periodStart||'')<=to;});}
  return docs;
}

function renderDocuments(){
  var container=document.getElementById('documentsContent');
  if(!container)return;
  var docs=getFilteredDocs();
  visibleDocIds=docs.map(function(d){return d.docUid;});

  if(!DATA.documents||DATA.documents.length===0){
    container.innerHTML='<div class="empty-state"><p>No hay documentos disponibles.</p></div>';
    return;
  }

  if(docs.length===0){
    container.innerHTML='<div class="empty-state"><p>No se encontraron documentos en el período seleccionado.</p></div>';
    return;
  }

  var grouped={};
  DOC_TYPE_ORDER.forEach(function(t){grouped[t]=[];});
  docs.forEach(function(d){if(grouped[d.docType])grouped[d.docType].push(d);});
  DOC_TYPE_ORDER.forEach(function(t){grouped[t].sort(function(a,b){return(a.periodStart||'').localeCompare(b.periodStart||'');});});

  var html='';
  DOC_TYPE_ORDER.forEach(function(type){
    var list=grouped[type]||[];
    var label=DOC_TYPE_LABELS[type]||type;
    html+='<div style="margin-bottom:24px">';
    html+='<h3 style="font-size:15px;font-weight:700;color:#2D6A4F;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid rgba(45,106,79,0.2);display:flex;align-items:center;gap:8px">';
    html+='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
    html+=label+' <span style="font-size:11px;font-weight:400;color:#8a9bae;background:rgba(255,255,255,0.05);padding:2px 8px;border-radius:10px">'+list.length+'</span></h3>';

    if(list.length===0){
      html+='<p style="font-size:13px;color:#8a9bae;padding:12px;text-align:center">Sin documentos de este tipo.</p>';
    }else{
      html+='<table class="report-table"><thead><tr><th style="text-align:left">Documento</th><th>Período</th><th>Tamaño</th><th>Subido</th><th style="width:80px">Acción</th></tr></thead><tbody>';
      list.forEach(function(d){
        html+='<tr>';
        html+='<td style="text-align:left;font-weight:500">'+(d.fileName||'documento.pdf')+'</td>';
        html+='<td>'+fmtDocDate(d.periodStart)+' — '+fmtDocDate(d.periodEnd)+'</td>';
        html+='<td>'+fmtSize(d.fileSize)+'</td>';
        html+='<td>'+fmtDocDate(d.uploadedAt?d.uploadedAt.split('T')[0]:'')+'</td>';
        html+='<td><a href="'+d.downloadURL+'" target="_blank" rel="noopener" download="'+(d.fileName||'documento.pdf')+'" style="display:inline-flex;align-items:center;gap:4px;padding:5px 10px;border-radius:4px;background:#22c55e;color:#0a1214;text-decoration:none;font-size:11px;font-weight:600" title="Descargar">';
        html+='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>';
        html+='PDF</a></td>';
        html+='</tr>';
      });
      html+='</tbody></table>';
    }
    html+='</div>';
  });

  container.innerHTML=html;
}

function filterDocuments(){renderDocuments();}
function clearDocFilter(){
  var f=document.getElementById('docSearchFrom');
  var t=document.getElementById('docSearchTo');
  if(f)f.value='';
  if(t)t.value='';
  renderDocuments();
}

function downloadAllVisible(){
  var docs=(DATA.documents||[]).filter(function(d){return visibleDocIds.indexOf(d.docUid)>=0;});
  if(docs.length===0){alert('No hay documentos para descargar.');return;}
  if(!confirm('Se descargarán '+docs.length+' documento(s). ¿Continuar?'))return;
  var delay=0;
  docs.forEach(function(d){
    setTimeout(function(){
      var a=document.createElement('a');
      a.href=d.downloadURL;
      a.target='_blank';
      a.rel='noopener';
      a.download=d.fileName||'documento.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    },delay);
    delay+=500;
  });
}

// ========== INIT ==========
function init(){
  const today=new Date();
  const dow=today.getDay();
  // Monday of current week
  const monday=new Date(today);
  monday.setDate(today.getDate()-(dow===0?6:dow-1));
  // Friday of current week
  const friday=new Date(monday);
  friday.setDate(monday.getDate()+4);

  const mondayISO=toISO(monday);
  const fridayISO=toISO(friday);

  // Report A: Monday to Friday of current week
  document.getElementById('realStart').value=mondayISO;
  document.getElementById('realEnd').value=fridayISO;
  // Report B: Monday to Friday of current week
  document.getElementById('schedStart').value=mondayISO;
  document.getElementById('schedEnd').value=fridayISO;
  
  renderLegend();
  renderCalendar();

  // Connect to Firebase for live updates
  initFirebase();
}

// ========== CREAR ACCESO DIRECTO ==========
async function crearAccesoDirecto(){
  var fileName='visor_programacion_'+toISO(new Date())+'.html';
  // Intentar File System Access API (Chrome/Edge)
  if(window.showDirectoryPicker){
    try{
      var dirHandle=await window.showDirectoryPicker({startIn:'desktop',mode:'readwrite'});
      var folderHandle=await dirHandle.getDirectoryHandle('Agendas ACOPAC',{create:true});
      var fileHandle=await folderHandle.getFileHandle(fileName,{create:true});
      var writable=await fileHandle.createWritable();
      await writable.write(new Blob(['<!DOCTYPE html>'+document.documentElement.outerHTML],{type:'text/html;charset=utf-8'}));
      await writable.close();
      alert('Archivo guardado en:\\n\\nAgendas ACOPAC / '+fileName+'\\n\\nPuede crear un acceso directo de esa carpeta en su escritorio.');
      return;
    }catch(e){
      if(e.name==='AbortError')return;
      console.warn('File System API error, usando descarga normal:',e);
    }
  }
  // Fallback: descargar archivo normalmente
  var blob=new Blob(['<!DOCTYPE html>'+document.documentElement.outerHTML],{type:'text/html;charset=utf-8'});
  var a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=fileName;
  a.click();
  URL.revokeObjectURL(a.href);
  alert('Archivo descargado: '+fileName+'\\n\\nPara crear el acceso directo:\\n1. Cree una carpeta llamada "Agendas ACOPAC" en su Escritorio\\n2. Mueva el archivo descargado a esa carpeta\\n3. Haga clic derecho en la carpeta > Enviar a > Escritorio (crear acceso directo)');
}

init();
CLOSE_SCRIPT_TAG
</body>
</html>`;

    // Replace placeholders
    const dataJSON = JSON.stringify(embeddedData);
    const finalHTML = viewerHTML
      .replace('EMBEDDED_JSON', dataJSON)
      .replace(/CLOSE_SCRIPT_TAG/g, '</' + 'script>')
      .replace('GENERATED_DATE', new Date().toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));

    const blob = new Blob([finalHTML], { type: 'text/html;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `visor_programacion_${new Date().toISOString().slice(0,10)}.html`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const inputStyle = {width:'100%',backgroundColor:colors.bgPrimary,border:`1px solid ${colors.border}`,borderRadius:'6px',padding:'8px',color:colors.textPrimary,fontSize:'13px'};
  const tabStyle = (isActive) => ({padding:'10px 16px',borderRadius:'8px 8px 0 0',fontWeight:'bold',cursor:'pointer',border:'none',backgroundColor:isActive?colors.bgPrimary:'transparent',color:isActive?colors.accent:colors.textMuted,borderBottom:isActive?`2px solid ${colors.accent}`:'none', whiteSpace: 'nowrap'});
  const thStyle = {padding:'8px 4px',textAlign:'center',borderBottom:`1px solid ${colors.border}`,borderRight:`1px solid ${colors.border}`,fontSize:'10px',fontWeight:'bold',color:colors.textMuted,backgroundColor:colors.bgTertiary};
  const tdStyle = {padding:'6px 4px',textAlign:'center',borderBottom:`1px solid ${colors.border}`,borderRight:`1px solid ${colors.border}`,fontSize:'11px',color:colors.textSecondary};

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generador de Reportes" size="xl" colors={colors}>
      <div style={{display:'flex',gap:'8px',marginBottom:'20px',borderBottom:`1px solid ${colors.border}`,paddingBottom:'8px', overflowX:'auto'}}>
        <button onClick={() => setActiveTab('prog_real')} style={tabStyle(activeTab === 'prog_real')}>Programadas / Realizadas</button>
        <button onClick={() => setActiveTab('telework')} style={tabStyle(activeTab === 'telework')}>Teletrabajo</button>
        <button onClick={() => setActiveTab('financial')} style={tabStyle(activeTab === 'financial')}>Financiero</button>
        <button onClick={() => setActiveTab('total')} style={tabStyle(activeTab === 'total')}>Respaldo</button>
      </div>

      {activeTab === 'prog_real' && (
        <div>
           <div style={{backgroundColor:colors.bgPrimary,padding:'16px',borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'20px'}}>
            <h4 style={{color:colors.success,fontWeight:'bold',textTransform:'uppercase',fontSize:'11px',marginBottom:'12px'}}>A. Actividades Realizadas</h4>
            <div style={{display:'flex',gap:'12px',marginBottom:'12px'}}>
              <div style={{flex:1}}><label style={{fontSize:'11px',color:colors.textMuted}}>Desde</label><input type="date" style={inputStyle} value={executedStart} onChange={e => setExecutedStart(e.target.value)} /></div>
              <div style={{flex:1}}><label style={{fontSize:'11px',color:colors.textMuted}}>Hasta</label><input type="date" style={inputStyle} value={executedEnd} onChange={e => setExecutedEnd(e.target.value)} /></div>
            </div>
            <div style={{width:'100%',overflowX:'auto', maxHeight: '200px', overflowY: 'auto'}}>
              <table style={{width:'100%',fontSize:'12px',borderCollapse:'collapse'}}>
                <thead><tr style={{backgroundColor:colors.bgSecondary,color:colors.textMuted}}><th style={{padding:'8px',textAlign:'center',width:'35px'}}>N°</th><th style={{padding:'8px',textAlign:'left'}}>Fecha</th><th>Actividad</th><th>Expediente/Caso</th><th>Oficio</th><th>Estado</th><th>Tiempo</th></tr></thead>
                <tbody>
                  {reportData.realized.length === 0 ? (
                      <tr><td colSpan="7" style={{padding:'16px',textAlign:'center',color:colors.textMuted,fontStyle:'italic'}}>No hay actividades registradas en este periodo.</td></tr>
                  ) : (
                      reportData.realized.map((t, idx) => {
                          const dur = (t.sessions || []).reduce((a, s) => a + ((s.end ? new Date(s.end) : new Date()) - new Date(s.start)), 0);
                          const linkedCase = t.caseUid && cases ? cases.find(c => c.caseUid === t.caseUid) : null;
                          const linkedBatch = t.batchUid && batches ? batches.find(b => b.batchUid === t.batchUid) : null;
                          const expParts = [];
                          if (t.fieldData?.expediente) expParts.push(t.fieldData.expediente);
                          if (linkedCase?.title) expParts.push(linkedCase.title);
                          else if (t.caseExternalRefText) expParts.push(t.caseExternalRefText);
                          if (linkedBatch?.title) expParts.push('Lote: ' + linkedBatch.title);
                          const expedienteCaso = expParts.join(' | ');
                          return (<tr key={t.id} style={{borderBottom:`1px solid ${colors.border}`}}><td style={{textAlign:'center'}}>{idx + 1}</td><td>{new Date(t.start).toLocaleDateString()}</td><td>{t.activityTypeName}{t.subtipo ? ' - ' + t.subtipo : ''}</td><td>{expedienteCaso}</td><td>{t.fieldData?.informe || ''}</td><td>{t.status}</td><td>{formatDuration(dur)}</td></tr>);
                      })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',marginTop:'8px'}}>
              <button onClick={() => exportReport('realized')} style={{display:'flex',alignItems:'center',gap:'8px',backgroundColor:colors.bgTertiary,color:colors.accent,padding:'6px 12px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'11px'}}>
                <FileSpreadsheet size={14}/> Exportar a Excel (XLSX)
              </button>
            </div>
           </div>

           <div style={{backgroundColor:colors.bgPrimary,padding:'16px',borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'20px'}}>
            <h4 style={{color:colors.accent,fontWeight:'bold',textTransform:'uppercase',fontSize:'11px',marginBottom:'12px'}}>B. Actividades Programadas</h4>
            <div style={{display:'flex',gap:'12px',marginBottom:'12px'}}>
              <div style={{flex:1}}><label style={{fontSize:'11px',color:colors.textMuted}}>Desde</label><input type="date" style={inputStyle} value={scheduledStart} onChange={e => setScheduledStart(e.target.value)} /></div>
              <div style={{flex:1}}><label style={{fontSize:'11px',color:colors.textMuted}}>Hasta</label><input type="date" style={inputStyle} value={scheduledEnd} onChange={e => setScheduledEnd(e.target.value)} /></div>
            </div>
            <div style={{width:'100%',overflowX:'auto', maxHeight: '200px', overflowY:'auto'}}>
                 <table style={{width:'100%',borderCollapse:'collapse',border:`1px solid ${colors.border}`}}>
                    <thead>
                      <tr>
                        <th rowSpan="2" style={{...thStyle,minWidth:'35px'}}>N°</th>
                        <th rowSpan="2" style={{...thStyle,minWidth:'60px'}}>Fecha</th>
                        <th rowSpan="2" style={{...thStyle,minWidth:'70px'}}>Lugar</th>
                        <th rowSpan="2" style={{...thStyle,minWidth:'120px'}}>Actividad</th>
                        <th rowSpan="2" style={{...thStyle,minWidth:'60px'}}>Expediente</th>
                        <th rowSpan="2" style={{...thStyle,minWidth:'80px'}}>Acompañantes</th>
                        <th colSpan="2" style={{...thStyle}}>Vehículo</th>
                        <th colSpan="2" style={{...thStyle}}>Doble T.</th>
                        <th colSpan="2" style={{...thStyle}}>Tarj. ruedo</th>
                        <th colSpan="4" style={{...thStyle}}>Viáticos</th>
                        <th rowSpan="2" style={{...thStyle,minWidth:'60px'}}>Cód. PP</th>
                      </tr>
                      <tr>
                        <th style={{...thStyle,fontSize:'9px'}}>Sí</th>
                        <th style={{...thStyle,fontSize:'9px'}}>No</th>
                        <th style={{...thStyle,fontSize:'9px'}}>Sí</th>
                        <th style={{...thStyle,fontSize:'9px'}}>No</th>
                        <th style={{...thStyle,fontSize:'9px'}}>Sí</th>
                        <th style={{...thStyle,fontSize:'9px'}}>No</th>
                        <th style={{...thStyle,fontSize:'9px'}}>D*</th>
                        <th style={{...thStyle,fontSize:'9px'}}>A**</th>
                        <th style={{...thStyle,fontSize:'9px'}}>C***</th>
                        <th style={{...thStyle,fontSize:'9px'}}>H****</th>
                      </tr>
                    </thead>
                    <tbody>
                        {reportData.scheduled.length === 0 ? (
                            <tr><td colSpan="17" style={{padding:'16px',textAlign:'center',color:colors.textMuted,fontStyle:'italic'}}>No hay programación futura en este periodo.</td></tr>
                        ) : (
                            (() => {
                              const groupedByDate = {};
                              let globalRowCounter = 0;
                              reportData.scheduled.forEach((t, index) => {
                                const d = new Date(t.start);
                                const dateStr = `${d.getDate()}/${d.getMonth()+1}/${String(d.getFullYear()).slice(-2)}`;
                                if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
                                groupedByDate[dateStr].push({ ...t, __origIndex: index });
                              });

                              // Mantener orden cronológico (ya viene ordenado), pero aseguramos orden por fecha + inicio
                              const entries = Object.entries(groupedByDate).sort((a, b) => {
                                const da = new Date(a[1][0].start);
                                const db = new Date(b[1][0].start);
                                return da - db;
                              });
                              // Ordenar actividades dentro de cada día por hora de inicio
                              entries.forEach(([, group]) => group.sort((a, b) => new Date(a.start) - new Date(b.start)));

                              return entries.flatMap(([dateStr, tasksInDate]) => {
                                const rowCount = tasksInDate.length;
                                const firstTask = tasksInDate[0];
                                const firstViat = firstTask.logistics?.viaticos || [];

                                const getViatArr = (task) => task.logistics?.viaticos || [];
                                const getCodigoPP = (task) => task.logistics?.codigoPP || 'PPI-17-E18';

                                // Determinar qué columnas se fusionan por FECHA (logística/viáticos del día) y cuáles se fusionan solo si son idénticas en TODO el grupo
                                // Vehículo y viáticos se consideran "gastos administrativos del día": se fusionan siempre por fecha.
                                const requiereVehiculoAllSame = true;
                                const dobleTraccionAllSame = true;
                                const tarjetaRuedoAllSame = true;

                                const desayunoAllSame = true;
                                const almuerzoAllSame = true;
                                const cenaAllSame = true;
                                const hospedajeAllSame = true;

                                // Acompañantes: fusionar solo si el contenido es idéntico en TODO el grupo
                                const acompanantesAllSame = tasksInDate.every(tt => String(tt.fieldData?.asistentes || '') === String(firstTask.fieldData?.asistentes || ''));

                                // Código PP: fusionar solo si el contenido es idéntico en TODO el grupo
                                const codigoPPAllSame = tasksInDate.every(tt => String(getCodigoPP(tt)) === String(getCodigoPP(firstTask)));

                                // Valores (para celdas fusionadas del día / o primeras filas)
                                const anyReqVeh = tasksInDate.some(tt => !!tt.logistics?.requiereVehiculo);
                                const anyDoble = tasksInDate.some(tt => !!tt.logistics?.dobleTraccion);
                                const anyTarj = tasksInDate.some(tt => !!tt.logistics?.tarjetaRuedo);

                                const vehSiDay = anyReqVeh ? 'X' : '';
                                const vehNoDay = !anyReqVeh ? 'X' : '';
                                const dobleSiDay = anyDoble ? 'X' : '';
                                const dobleNoDay = !anyDoble ? 'X' : '';
                                const tarjSiDay = anyTarj ? 'X' : '';
                                const tarjNoDay = !anyTarj ? 'X' : '';

                                const anyDes = tasksInDate.some(tt => (getViatArr(tt).includes('Desayuno')));
                                const anyAlm = tasksInDate.some(tt => (getViatArr(tt).includes('Almuerzo')));
                                const anyCen = tasksInDate.some(tt => (getViatArr(tt).includes('Cena')));
                                const anyHos = tasksInDate.some(tt => (getViatArr(tt).includes('Hospedaje')));

                                const Dday = anyDes ? 'X' : '';
                                const Aday = anyAlm ? 'X' : '';
                                const Cday = anyCen ? 'X' : '';
                                const Hday = anyHos ? 'X' : '';

                                const codigoPPDay = getCodigoPP(firstTask);

                                // --- Calcular LUGAR DE LA GIRA a nivel de DÍA ---
                                const isoDayHTML = toISODateString(new Date(firstTask.start));
                                let dayModalityHTML = dayOverrides[isoDayHTML];
                                if (!dayModalityHTML) {
                                  const [yyy, mmm, ddd] = isoDayHTML.split('-').map(Number);
                                  const dObjHTML = new Date(yyy, mmm - 1, ddd);
                                  const dowHTML = dObjHTML.getDay();
                                  const isHolidayHTML = HOLIDAYS_CR_2026.some(h => h.date === isoDayHTML);
                                  if (dowHTML === 0 || dowHTML === 6 || isHolidayHTML) dayModalityHTML = 'none';
                                  else if ([1, 4, 5].includes(dowHTML)) dayModalityHTML = 'telework';
                                  else dayModalityHTML = 'presencial';
                                }
                                let lugarDelDiaHTML;
                                if (dayModalityHTML === 'telework') {
                                  lugarDelDiaHTML = 'Teletrabajo';
                                } else {
                                  const primeraInspeccionHTML = tasksInDate.find(tt => tt.typeId === 3 || tt.activityTypeName === 'Inspección');
                                  if (primeraInspeccionHTML) {
                                    const loc = primeraInspeccionHTML.fieldData?.location;
                                    if (loc?.lugar) {
                                      lugarDelDiaHTML = loc.lugar;
                                    } else if (loc?.distrito) {
                                      lugarDelDiaHTML = loc.distrito + (loc.canton ? ', ' + loc.canton : '');
                                    } else if (loc?.canton) {
                                      lugarDelDiaHTML = loc.canton;
                                    } else if (primeraInspeccionHTML.fieldData?.lugar) {
                                      const partesHTML = primeraInspeccionHTML.fieldData.lugar.split(',').map(s => s.trim());
                                      lugarDelDiaHTML = partesHTML.length >= 2 ? partesHTML[1] : primeraInspeccionHTML.fieldData.lugar;
                                    } else {
                                      lugarDelDiaHTML = 'OSRO';
                                    }
                                  } else {
                                    lugarDelDiaHTML = 'OSRO';
                                  }
                                }

                                return tasksInDate.map((t, idxInGroup) => {
                                  globalRowCounter++;
                                  const isFirstInGroup = idxInGroup === 0;

                                  // Tipos que no llevan lugar de gira ni código PP (ausencias/personales)
                                  const noLugarNoPPTypesHTML = [14, 15, 16, 17, 19];
                                  const isNoLugarHTML = noLugarNoPPTypesHTML.includes(parseInt(t.typeId));
                                  const lugar = isNoLugarHTML ? '' : lugarDelDiaHTML;
                                  const actividad = `${t.activityTypeName}${t.subtipo ? ' - ' + t.subtipo : ''}`;
                                  const expediente = t.fieldData?.expediente || '';
                                  const acomp = t.fieldData?.asistentes || '';

                                  return (
                                    <tr key={`${t.id}-${idxInGroup}`} style={{borderBottom:`1px solid ${colors.border}`}}>
                                      <td style={tdStyle}>{globalRowCounter}</td>
                                      {isFirstInGroup && (
                                        <td style={tdStyle} rowSpan={rowCount}>{dateStr}</td>
                                      )}

                                      <td style={tdStyle}>{lugar}</td>
                                      <td style={tdStyle}>{actividad}</td>
                                      <td style={tdStyle}>{expediente}</td>
                                      {acompanantesAllSame ? (
                                        isFirstInGroup && (
                                          <td style={tdStyle} rowSpan={rowCount}>{acomp}</td>
                                        )
                                      ) : (
                                        <td style={tdStyle}>{acomp}</td>
                                      )}

                                      {requiereVehiculoAllSame ? (
                                        isFirstInGroup && (
                                          <>
                                            <td style={tdStyle} rowSpan={rowCount}>{vehSiDay}</td>
                                            <td style={tdStyle} rowSpan={rowCount}>{vehNoDay}</td>
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <td style={tdStyle}>{t.logistics?.requiereVehiculo ? 'X' : ''}</td>
                                          <td style={tdStyle}>{!t.logistics?.requiereVehiculo ? 'X' : ''}</td>
                                        </>
                                      )}

                                      {dobleTraccionAllSame ? (
                                        isFirstInGroup && (
                                          <>
                                            <td style={tdStyle} rowSpan={rowCount}>{dobleSiDay}</td>
                                            <td style={tdStyle} rowSpan={rowCount}>{dobleNoDay}</td>
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <td style={tdStyle}>{t.logistics?.dobleTraccion ? 'X' : ''}</td>
                                          <td style={tdStyle}>{!t.logistics?.dobleTraccion ? 'X' : ''}</td>
                                        </>
                                      )}

                                      {tarjetaRuedoAllSame ? (
                                        isFirstInGroup && (
                                          <>
                                            <td style={tdStyle} rowSpan={rowCount}>{tarjSiDay}</td>
                                            <td style={tdStyle} rowSpan={rowCount}>{tarjNoDay}</td>
                                          </>
                                        )
                                      ) : (
                                        <>
                                          <td style={tdStyle}>{t.logistics?.tarjetaRuedo ? 'X' : ''}</td>
                                          <td style={tdStyle}>{!t.logistics?.tarjetaRuedo ? 'X' : ''}</td>
                                        </>
                                      )}

                                      {desayunoAllSame ? (
                                        isFirstInGroup && (
                                          <td style={tdStyle} rowSpan={rowCount}>{Dday}</td>
                                        )
                                      ) : (
                                        <td style={tdStyle}>{(t.logistics?.viaticos || []).includes('Desayuno') ? 'X' : ''}</td>
                                      )}
                                      {almuerzoAllSame ? (
                                        isFirstInGroup && (
                                          <td style={tdStyle} rowSpan={rowCount}>{Aday}</td>
                                        )
                                      ) : (
                                        <td style={tdStyle}>{(t.logistics?.viaticos || []).includes('Almuerzo') ? 'X' : ''}</td>
                                      )}
                                      {cenaAllSame ? (
                                        isFirstInGroup && (
                                          <td style={tdStyle} rowSpan={rowCount}>{Cday}</td>
                                        )
                                      ) : (
                                        <td style={tdStyle}>{(t.logistics?.viaticos || []).includes('Cena') ? 'X' : ''}</td>
                                      )}
                                      {hospedajeAllSame ? (
                                        isFirstInGroup && (
                                          <td style={tdStyle} rowSpan={rowCount}>{Hday}</td>
                                        )
                                      ) : (
                                        <td style={tdStyle}>{(t.logistics?.viaticos || []).includes('Hospedaje') ? 'X' : ''}</td>
                                      )}

                                      {codigoPPAllSame ? (
                                        isFirstInGroup && (
                                          <td style={tdStyle} rowSpan={rowCount}>{isNoLugarHTML ? '' : codigoPPDay}</td>
                                        )
                                      ) : (
                                        <td style={tdStyle}>{isNoLugarHTML ? '' : (t.logistics?.codigoPP || 'PPI-17-E18')}</td>
                                      )}
                                    </tr>
                                  );
                                });
                              });
                            })()
                        )}
                    </tbody>
                </table>
                <div style={{marginTop:'8px', fontSize:'10px', color:colors.textMuted}}>
                    <strong>Notas:</strong><br/>
                    1. Léase: * Desayuno, ** Almuerzo, *** Cena, **** Hospedaje
                </div>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',marginTop:'8px'}}>
              <button onClick={() => exportReport('scheduled')} style={{display:'flex',alignItems:'center',gap:'8px',backgroundColor:colors.bgTertiary,color:colors.accent,padding:'6px 12px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'11px'}}>
                <FileSpreadsheet size={14}/> Exportar a Excel (XLSX)
              </button>
            </div>
           </div>

           <div style={{backgroundColor:colors.bgPrimary,padding:'16px',borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'20px'}}>
            <h4 style={{color:colors.warning,fontWeight:'bold',textTransform:'uppercase',fontSize:'11px',marginBottom:'12px'}}>C. Actividades Pendientes</h4>
            <div style={{width:'100%',overflowX:'auto', maxHeight: '200px', overflowY: 'auto'}}>
              <table style={{width:'100%',fontSize:'12px',borderCollapse:'collapse'}}>
                <thead><tr style={{backgroundColor:colors.bgSecondary,color:colors.textMuted}}>
                    <th style={{padding:'8px',textAlign:'center',width:'35px'}}>N°</th>
                    <th style={{padding:'8px',textAlign:'left'}}>Fecha Original</th>
                    <th style={{padding:'8px',textAlign:'left'}}>Actividad</th>
                    <th style={{padding:'8px',textAlign:'left'}}>Expediente/Caso</th>
                    <th style={{padding:'8px',textAlign:'center'}}>Rezago</th>
                    <th style={{padding:'8px',textAlign:'center'}}>Tiempo Invertido</th>
                    <th style={{padding:'8px',textAlign:'center'}}>Sesiones</th>
                </tr></thead>
                <tbody>
                  {reportData.pending.length === 0 ? (
                      <tr><td colSpan="7" style={{padding:'16px',textAlign:'center',color:colors.textMuted,fontStyle:'italic'}}>No hay actividades pendientes.</td></tr>
                  ) : (
                      reportData.pending.map((t, idx) => {
                          const dur = (t.sessions || []).reduce((a, s) => a + ((s.end ? new Date(s.end) : new Date()) - new Date(s.start)), 0);
                          const lagDays = Math.floor((new Date() - new Date(t.start)) / (1000 * 60 * 60 * 24));
                          const lagText = lagDays > 0 ? `${lagDays} días` : '0 días';
                          const desc = `${t.activityTypeName}${t.subtipo ? ' - ' + t.subtipo : ''}`;
                          const linkedCase = t.caseUid && cases ? cases.find(c => c.caseUid === t.caseUid) : null;
                          const linkedBatch = t.batchUid && batches ? batches.find(b => b.batchUid === t.batchUid) : null;
                          const expParts = [];
                          if (t.fieldData?.expediente) expParts.push(t.fieldData.expediente);
                          if (linkedCase?.title) expParts.push(linkedCase.title);
                          else if (t.caseExternalRefText) expParts.push(t.caseExternalRefText);
                          if (linkedBatch?.title) expParts.push('Lote: ' + linkedBatch.title);
                          if (t.fieldData?.informe) expParts.push('Inf: ' + t.fieldData.informe);
                          const expedienteCaso = expParts.join(' | ');

                          return (
                            <tr key={t.id} style={{borderBottom:`1px solid ${colors.border}`}}>
                                <td style={{padding:'8px', textAlign:'center'}}>{idx + 1}</td>
                                <td style={{padding:'8px'}}>{new Date(t.start).toLocaleDateString()}</td>
                                <td style={{padding:'8px'}}>{desc}</td>
                                <td style={{padding:'8px'}}>{expedienteCaso}</td>
                                <td style={{padding:'8px', textAlign:'center', color: lagDays > 7 ? colors.danger : colors.textSecondary}}>{lagText}</td>
                                <td style={{padding:'8px', textAlign:'center'}}>{formatDuration(dur)}</td>
                                <td style={{padding:'8px', textAlign:'center'}}>{t.sessions ? t.sessions.length : 0}</td>
                            </tr>
                          );
                      })
                  )}
                </tbody>
              </table>
            </div>
            <div style={{display:'flex',justifyContent:'flex-end',gap:'8px',marginTop:'8px'}}>
              <button onClick={() => exportReport('pending')} style={{display:'flex',alignItems:'center',gap:'8px',backgroundColor:colors.bgTertiary,color:colors.accent,padding:'6px 12px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'11px'}}>
                <FileSpreadsheet size={14}/> Exportar a Excel (XLSX)
              </button>
            </div>
           </div>
        </div>
      )}
      
      {activeTab === 'financial' && (
          <div>
              <div style={{backgroundColor:colors.bgPrimary,padding:'16px',borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'20px'}}>
                  <h4 style={{color:colors.accent,fontWeight:'bold',textTransform:'uppercase',fontSize:'11px',marginBottom:'12px'}}>Acumulado por Código PP (Liquidado)</h4>
                  <table style={{width:'100%',fontSize:'12px',borderCollapse:'collapse'}}>
                      <thead><tr style={{backgroundColor:colors.bgSecondary,color:colors.textMuted}}><th style={{padding:'8px',textAlign:'left'}}>Código PP</th><th style={{padding:'8px',textAlign:'right'}}>Monto Liquidado</th></tr></thead>
                      <tbody>
                          {Object.entries(ppStats).map(([pp, amount]) => (
                              <tr key={pp} style={{borderBottom:`1px solid ${colors.border}`}}>
                                  <td style={{padding:'8px', fontWeight:'bold', color:colors.textPrimary}}>{pp}</td>
                                  <td style={{padding:'8px', textAlign:'right', color:colors.success}}>{formatMoney(amount)}</td>
                              </tr>
                          ))}
                          <tr style={{borderTop:`2px solid ${colors.border}`}}>
                              <td style={{padding:'8px', fontWeight:'bold', color:colors.textPrimary}}>TOTAL</td>
                              <td style={{padding:'8px', textAlign:'right', color:colors.success, fontWeight:'bold'}}>{formatMoney(Object.values(ppStats).reduce((a, b) => a + b, 0))}</td>
                          </tr>
                      </tbody>
                  </table>
                  <div style={{display:'flex',justifyContent:'flex-end', marginTop:'10px'}}><button onClick={() => exportReport('pp_accumulated')} style={{display:'flex',alignItems:'center',gap:'8px',backgroundColor:colors.bgTertiary,color:colors.accent,padding:'6px 12px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'11px'}}><FileSpreadsheet size={14}/> Exportar Acumulado XLSX</button></div>
              </div>
              
              <div style={{backgroundColor:colors.bgPrimary,padding:'16px',borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'20px', maxHeight:'400px', overflowY:'auto'}}>
                  <h4 style={{color:colors.accent,fontWeight:'bold',textTransform:'uppercase',fontSize:'11px',marginBottom:'12px'}}>Detalle Mensual de Viáticos</h4>
                  <table style={{width:'100%',fontSize:'11px',borderCollapse:'collapse'}}>
                      <thead><tr style={{backgroundColor:colors.bgSecondary,color:colors.textMuted}}>
                          <th style={{padding:'8px',textAlign:'left'}}>Mes</th>
                          <th style={{padding:'8px',textAlign:'left'}}>PP</th>
                          <th style={{padding:'8px',textAlign:'right'}}>Programado</th>
                          <th style={{padding:'8px',textAlign:'right'}}>Ejecutado</th>
                          <th style={{padding:'8px',textAlign:'left'}}>Detalle</th>
                      </tr></thead>
                      <tbody>
                          {monthlyDetails.map((item, idx) => (
                              <tr key={idx} style={{borderBottom:`1px solid ${colors.border}`}}>
                                  <td style={{padding:'6px'}}>{item.month}</td>
                                  <td style={{padding:'6px', color:colors.accent}}>{item.pp}</td>
                                  <td style={{padding:'6px', textAlign:'right'}}>{formatMoney(item.planned)}</td>
                                  <td style={{padding:'6px', textAlign:'right', color:item.executed > 0 ? colors.success : colors.textMuted}}>{formatMoney(item.executed)}</td>
                                  <td style={{padding:'6px', color:colors.textSecondary}}>{item.desc}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  <div style={{display:'flex',justifyContent:'flex-end', marginTop:'10px'}}><button onClick={() => exportReport('monthly_detailed')} style={{display:'flex',alignItems:'center',gap:'8px',backgroundColor:colors.bgTertiary,color:colors.accent,padding:'6px 12px',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'11px'}}><FileSpreadsheet size={14}/> Exportar Detalle Mensual XLSX</button></div>
              </div>
          </div>
      )}

      {activeTab === 'telework' && (
        <div style={{padding:'20px'}}>
           {/* Telework report UI ... */}
           <div style={{textAlign:'center',padding:'20px 0'}}>
            <Database size={48} style={{color:colors.accent,marginBottom:'8px'}}/>
            <h3 style={{color:colors.accent,marginBottom:'4px'}}>Control de Teletrabajo</h3>
            <p style={{color:colors.textMuted,fontSize:'12px'}}>Generar reporte de actividades laboradas en modalidad de teletrabajo.</p>
          </div>
          <div style={{display:'flex',gap:'12px',marginBottom:'12px'}}>
            <div style={{flex:1}}><label style={{fontSize:'11px',color:colors.textMuted}}>Desde</label><input type="date" style={inputStyle} value={teleworkStart} onChange={e => setTeleworkStart(e.target.value)} /></div>
            <div style={{flex:1}}><label style={{fontSize:'11px',color:colors.textMuted}}>Hasta</label><input type="date" style={inputStyle} value={teleworkEnd} onChange={e => setTeleworkEnd(e.target.value)} /></div>
          </div>
          <div style={{backgroundColor:colors.bgPrimary,padding:'16px',borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'20px'}}>
             <h4 style={{color:colors.accent,fontWeight:'bold',textTransform:'uppercase',fontSize:'11px',marginBottom:'12px'}}>Actividades de Teletrabajo ({teleworkReportData.length})</h4>
             <div style={{overflowX:'auto', maxHeight: '300px', overflowY: 'auto'}}>
                <table style={{width:'100%',fontSize:'12px',borderCollapse:'collapse'}}>
                    <thead>
                        <tr style={{backgroundColor:colors.bgSecondary,color:colors.textMuted, position: 'sticky', top: 0}}>
                            <th style={{padding:'8px',textAlign:'left',borderBottom:`1px solid ${colors.border}`, width: '15%'}}>Fecha</th>
                            <th style={{padding:'8px',textAlign:'left',borderBottom:`1px solid ${colors.border}`, width: '50%'}}>Actividad</th>
                            <th style={{padding:'8px',textAlign:'left',borderBottom:`1px solid ${colors.border}`, width: '10%'}}>Código</th>
                            <th style={{padding:'8px',textAlign:'left',borderBottom:`1px solid ${colors.border}`, width: '15%'}}>Estado</th>
                            <th style={{padding:'8px',textAlign:'left',borderBottom:`1px solid ${colors.border}`, width: '10%'}}>Tiempo</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teleworkReportData.length === 0 ? (
                             <tr><td colSpan="5" style={{padding:'16px',textAlign:'center',color:colors.textMuted,fontStyle:'italic'}}>No hay actividades registradas.</td></tr>
                        ) : (
                            teleworkReportData.map((t, index) => {
                                const durationMs = (t.sessions || []).reduce((acc, s) => acc + ((s.end ? new Date(s.end) : new Date()) - new Date(s.start)), 0);
                                return (
                                <tr key={index} style={{borderBottom:`1px solid ${colors.border}`}}>
                                    <td style={{padding:'8px',color:colors.textPrimary}}>{new Date(t.start).toLocaleDateString('es-CR')}</td>
                                    <td style={{padding:'8px',color:colors.textSecondary}}>{t.activityTypeName}{t.subtipo && ` - ${t.subtipo}`}</td>
                                    <td style={{padding:'8px',color:colors.accent}}>{t.logistics?.codigoPP}</td>
                                    <td style={{padding:'8px',color:t.status === 'completed' ? colors.success : colors.warning, fontWeight:'bold'}}>{t.status === 'completed' ? 'Finalizado' : 'Sin finalizar'}</td>
                                    <td style={{padding:'8px',color:colors.textSecondary}}>{formatDuration(durationMs)}</td>
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
             </div>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end'}}>
             <button onClick={() => exportReport('telework')} style={{backgroundColor:colors.success,color:colors.bgPrimary,padding:'10px 20px',borderRadius:'8px',fontWeight:'bold',border:'none',cursor:'pointer', display:'flex', alignItems:'center', gap:'8px'}}>
                <FileSpreadsheet size={16}/> Descargar Reporte XLSX
             </button>
          </div>
        </div>
      )}

      {activeTab === 'total' && (
        <div style={{textAlign:'center',padding:'20px'}}>
           <Database size={48} style={{color:colors.accent,marginBottom:'16px'}}/>
           <h3 style={{color:colors.accent,marginBottom:'8px'}}>Respaldo y Migración</h3>
           <p style={{color:colors.textMuted,marginBottom:'20px'}}>
             Exporta toda tu base de datos para guardar una copia de seguridad o importar una copia previamente guardada.
           </p>
           <div style={{display:'flex',justifyContent:'center',gap:'16px',flexWrap:'wrap'}}>
              <button
                onClick={onExportBackup}
                style={{backgroundColor:colors.success,color:colors.bgPrimary,padding:'10px 20px',borderRadius:'8px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',fontWeight:'bold'}}
              >
                <Download size={18}/> Exportar respaldo (JSON)
              </button>
              <div>
                <input type="file" accept=".json" ref={jsonFileInputRef} style={{display:'none'}} onChange={onImportBackupJSON}/>
                <button
                  onClick={() => jsonFileInputRef.current.click()}
                  style={{backgroundColor:colors.bgTertiary,color:colors.accent,padding:'10px 20px',borderRadius:'8px',border:`1px solid ${colors.border}`,cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',fontWeight:'bold'}}
                >
                  <Upload size={18}/> Importar respaldo (JSON)
                </button>
              </div>
           </div>

           {/* Respaldo CSV legado */}
           <div style={{marginTop:'16px',display:'flex',justifyContent:'center',gap:'16px',flexWrap:'wrap'}}>
              <button onClick={() => exportToCSV('total')} style={{backgroundColor:colors.bgTertiary,color:colors.textSecondary,padding:'8px 16px',borderRadius:'8px',fontWeight:'bold',border:`1px solid ${colors.border}`,cursor:'pointer', display:'flex', alignItems:'center', gap:'8px',fontSize:'12px'}}>
                  <Download size={14}/> Exportar CSV (legado)
              </button>
              <div>
                  <input type="file" accept=".csv" ref={fileInputRef} style={{display:'none'}} onChange={handleFileImport}/>
                  <button onClick={() => fileInputRef.current.click()} style={{backgroundColor:colors.bgTertiary,color:colors.textSecondary,padding:'8px 16px',borderRadius:'8px',fontWeight:'bold',border:`1px solid ${colors.border}`,cursor:'pointer', display:'flex', alignItems:'center', gap:'8px',fontSize:'12px'}}>
                      <Upload size={14}/> Importar CSV (legado)
                  </button>
              </div>
           </div>

           <p style={{marginTop:'16px',fontSize:'12px',color:colors.textMuted}}>
             También se realizan respaldos automáticos diarios en Firebase Storage.
           </p>

           {/* Firebase Storage Backups */}
           <div style={{marginTop:'20px',paddingTop:'20px',borderTop:`1px solid ${colors.border}`}}>
             <Save size={36} style={{color:colors.accent,marginBottom:'12px'}}/>
             <h3 style={{color:colors.accent,marginBottom:'8px'}}>Respaldos en Firebase Storage</h3>
             <p style={{color:colors.textMuted,marginBottom:'16px',fontSize:'13px'}}>Se guardan automáticamente cada 24 horas. También puede forzar uno manualmente.</p>
             <div style={{display:'flex',justifyContent:'center',gap:'12px',flexWrap:'wrap',marginBottom:'16px'}}>
               <button
                 onClick={async () => { await onUploadBackupToStorage(); alert('Respaldo subido a Firebase Storage'); }}
                 style={{backgroundColor:colors.accent,color:colors.bgPrimary,padding:'10px 20px',borderRadius:'8px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',fontWeight:'bold'}}
               >
                 <Upload size={18}/> Subir respaldo ahora
               </button>
               <button
                 onClick={async () => { setLoadingBackups(true); const list = await onListStorageBackups(); setStorageBackups(list); setLoadingBackups(false); }}
                 style={{backgroundColor:colors.bgTertiary,color:colors.accent,padding:'10px 20px',borderRadius:'8px',border:`1px solid ${colors.border}`,cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',fontWeight:'bold'}}
               >
                 <Database size={18}/> {loadingBackups ? 'Cargando...' : 'Ver respaldos guardados'}
               </button>
             </div>
             {storageBackups.length > 0 && (
               <div style={{backgroundColor:colors.bgPrimary,padding:'16px',borderRadius:'8px',border:`1px solid ${colors.border}`,textAlign:'left',maxHeight:'200px',overflowY:'auto'}}>
                 <h4 style={{color:colors.accent,fontSize:'12px',marginBottom:'8px',textTransform:'uppercase'}}>Respaldos disponibles ({storageBackups.length})</h4>
                 {storageBackups.map((name, idx) => (
                   <div key={idx} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'6px 8px',borderBottom:`1px solid ${colors.border}`,fontSize:'12px'}}>
                     <span style={{color:colors.textPrimary}}>{name}</span>
                     <button
                       onClick={() => { if(confirm('¿Restaurar este respaldo? Los datos actuales se sobrescribirán.')) onRestoreFromStorage(name); }}
                       style={{backgroundColor:colors.warning+'22',color:colors.warning,padding:'4px 10px',borderRadius:'4px',border:'none',cursor:'pointer',fontSize:'11px',fontWeight:'bold'}}
                     >
                       Restaurar
                     </button>
                   </div>
                 ))}
               </div>
             )}
           </div>

          <div style={{marginTop:'30px',paddingTop:'20px',borderTop:`1px solid ${colors.border}`}}>
            <ExternalLink size={36} style={{color:colors.accent,marginBottom:'12px'}}/>
            <h3 style={{color:colors.accent,marginBottom:'8px'}}>Visor Compartible (Solo Lectura)</h3>
            <p style={{color:colors.textMuted,marginBottom:'16px',fontSize:'13px'}}>Genera un archivo HTML liviano con toda su programación que puede compartir con jefatura, RRHH y superiores. Permite ver el calendario, buscar por expediente/informe, y consultar los cuadros de reportes. No permite modificar ni eliminar nada.</p>
            <button onClick={generateReadOnlyViewer} style={{backgroundColor:colors.accent,color:colors.bgPrimary,padding:'12px 24px',borderRadius:'8px',fontWeight:'bold',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'8px',margin:'0 auto'}}>
              <ExternalLink size={18}/> Generar Visor Compartible (HTML)
            </button>
            <p style={{marginTop:'10px',fontSize:'11px',color:colors.textMuted}}>El archivo generado se puede abrir en cualquier navegador (PC o móvil) sin necesidad de internet.</p>
          </div>
        </div>
      )}
    </Modal>
  );
};

const SideBanner = ({ selectedDate, markers, colors }) => {
  const dateStr = toISODateString(selectedDate);
  const relevantMarker = markers.find(m => m.date === dateStr && (m.type === 'holiday' || m.type === 'efemeride' || m.type === 'astro' || m.type === 'astro_event' || m.type === 'moon'));
  if (!relevantMarker) return (<div style={{marginTop:'16px',padding:'16px',backgroundColor:colors.bgPrimary,borderRadius:'8px',border:`1px solid ${colors.border}`,textAlign:'center'}}><Leaf style={{color:colors.textMuted,marginBottom:'8px'}} size={24}/><p style={{fontSize:'12px',color:colors.textMuted}}>Sin conmemoraciones hoy.</p></div>);
  
  const bgColor = relevantMarker.type === 'holiday' ? 'rgba(214, 158, 46, 0.15)' : 
                (relevantMarker.type === 'astro' || relevantMarker.type === 'astro_event') ? 'rgba(79, 209, 197, 0.15)' : 
                'rgba(72, 187, 120, 0.15)';
  const iconColor = relevantMarker.type === 'holiday' ? colors.gold : 
                  (relevantMarker.type === 'astro' || relevantMarker.type === 'astro_event') ? colors.accent : 
                  colors.success;
  
  const renderIcon = () => {
    if (relevantMarker.type === 'holiday') return <Flag size={40} style={{color:iconColor,opacity:0.8}}/>;
    if (relevantMarker.type === 'astro') return <Sun size={40} style={{color:iconColor,opacity:0.8}}/>;
    if (relevantMarker.type === 'astro_event') return <Star size={40} style={{color:iconColor,opacity:0.8}}/>;
    if (relevantMarker.type === 'moon') return <span style={{fontSize:'48px'}}>{relevantMarker.icon || '🌕'}</span>;
    return <Leaf size={40} style={{color:iconColor,opacity:0.8}}/>;
  };
  
  const getTypeLabel = () => {
    if (relevantMarker.type === 'holiday') return 'Feriado';
    if (relevantMarker.type === 'astro') return 'Astronomía';
    if (relevantMarker.type === 'astro_event') return 'Evento';
    if (relevantMarker.type === 'moon') return 'Fase Lunar';
    return 'Efeméride';
  };

  return (
    <div style={{marginTop:'16px',borderRadius:'8px',overflow:'hidden',border:`1px solid ${colors.border}`,backgroundColor:colors.bgSecondary}}>
       <div style={{height:'80px',backgroundColor:bgColor,display:'flex',alignItems:'center',justifyContent:'center'}}>{renderIcon()}</div>
       <div style={{padding:'16px'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
            <span style={{fontSize:'10px',fontWeight:'bold',textTransform:'uppercase',padding:'2px 8px',borderRadius:'4px',backgroundColor:bgColor,color:iconColor}}>{getTypeLabel()}</span>
            <span style={{fontSize:'11px',color:colors.textMuted,fontFamily:'monospace'}}>{relevantMarker.date}</span>
          </div>
          <h3 style={{fontSize:'16px',fontWeight:'bold',color:colors.accent,marginBottom:'8px'}}>{relevantMarker.name}</h3>
          {relevantMarker.time && <div style={{fontSize:'13px',fontFamily:'monospace',color:colors.textSecondary,marginBottom:'8px'}}>Hora: {relevantMarker.time}</div>}
          <p style={{fontSize:'13px',color:colors.textSecondary,lineHeight:'1.5'}}>{relevantMarker.description || ''}</p>
          {relevantMarker.legalNorm && <div style={{fontSize:'11px',color:colors.textMuted,borderTop:`1px solid ${colors.border}`,paddingTop:'8px',marginTop:'8px'}}><strong>Norma:</strong> {relevantMarker.legalNorm}</div>}
       </div>
    </div>
  );
};


const TaskFormModal = (props) => {
  if (!props.isOpen) return null;
  return <TaskFormModalContent {...props} />;
};

// --- GESTIÓN DE ACTIVIDADES CÍCLICAS ---
const RecurringActivitiesModal = ({ isOpen, onClose, tasks, onDeleteTask, colors, activityTypes }) => {
  const [confirmDeleteSeries, setConfirmDeleteSeries] = useState(null);
  const [confirmDeleteFuture, setConfirmDeleteFuture] = useState(false);

  if (!isOpen) return null;

  // Group tasks by seriesId to find recurring series
  const seriesMap = {};
  tasks.forEach(t => {
    if (t.seriesId) {
      if (!seriesMap[t.seriesId]) seriesMap[t.seriesId] = [];
      seriesMap[t.seriesId].push(t);
    } else if (t.repeat && t.repeat.type !== 'none') {
      const sid = t.id;
      if (!seriesMap[sid]) seriesMap[sid] = [];
      seriesMap[sid].push(t);
    }
  });

  // Only show series with more than 1 task (actual recurring)
  const recurringSeries = Object.entries(seriesMap)
    .filter(([, arr]) => arr.length > 1)
    .map(([seriesId, arr]) => {
      arr.sort((a, b) => new Date(a.start) - new Date(b.start));
      const first = arr[0];
      const typeInfo = activityTypes.find(at => at.id === parseInt(first.typeId));
      return {
        seriesId,
        name: first.activityTypeName + (first.subtipo ? ' - ' + first.subtipo : ''),
        color: typeInfo?.color || '#888',
        count: arr.length,
        firstDate: first.start,
        lastDate: arr[arr.length - 1].start,
        tasks: arr
      };
    })
    .sort((a, b) => new Date(a.firstDate) - new Date(b.firstDate));

  // Tasks from May 2026 onwards
  const may2026 = new Date(2026, 4, 1); // May is month index 4
  const futureTasks = tasks.filter(t => new Date(t.start) >= may2026 && t.status !== 'completed');

  const handleDeleteSeries = (seriesId, seriesTasks) => {
    seriesTasks.forEach(t => onDeleteTask(t.id));
    setConfirmDeleteSeries(null);
  };

  const handleDeleteFutureTasks = () => {
    futureTasks.forEach(t => onDeleteTask(t.id));
    setConfirmDeleteFuture(false);
  };

  const fmtDate = (d) => {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth()+1}/${String(dt.getFullYear()).slice(-2)}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setConfirmDeleteSeries(null); setConfirmDeleteFuture(false); }} title="Actividades Cíclicas" size="lg" colors={colors}>
      <div style={{color:colors.textSecondary}}>
        {/* Bulk delete May 2026+ */}
        <div style={{padding:'12px', backgroundColor:colors.bgTertiary, borderRadius:'8px', marginBottom:'16px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div>
            <div style={{fontSize:'13px', fontWeight:'bold', color:colors.textPrimary}}>Actividades desde mayo 2026</div>
            <div style={{fontSize:'11px', color:colors.textMuted}}>{futureTasks.length} actividades pendientes encontradas</div>
          </div>
          {!confirmDeleteFuture ? (
            <button
              onClick={() => setConfirmDeleteFuture(true)}
              disabled={futureTasks.length === 0}
              style={{padding:'6px 12px', backgroundColor:futureTasks.length > 0 ? colors.danger : colors.bgSecondary, color:futureTasks.length > 0 ? 'white' : colors.textMuted, border:'none', borderRadius:'6px', cursor:futureTasks.length > 0 ? 'pointer' : 'default', fontSize:'11px', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px'}}
            >
              <Trash2 size={12}/> Eliminar todas
            </button>
          ) : (
            <div style={{display:'flex', gap:'4px'}}>
              <button onClick={handleDeleteFutureTasks} style={{padding:'6px 12px', backgroundColor:colors.danger, color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'11px', fontWeight:'bold'}}>Confirmar</button>
              <button onClick={() => setConfirmDeleteFuture(false)} style={{padding:'6px 12px', backgroundColor:colors.bgSecondary, color:colors.textMuted, border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'11px'}}>Cancelar</button>
            </div>
          )}
        </div>

        {/* Recurring series list */}
        {recurringSeries.length === 0 ? (
          <div style={{textAlign:'center', padding:'30px 20px'}}>
            <Repeat size={40} style={{color:colors.textMuted, marginBottom:'12px', opacity:0.4}}/>
            <p style={{fontSize:'14px', color:colors.textMuted}}>No hay actividades cíclicas</p>
          </div>
        ) : (
          <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
            <div style={{fontSize:'11px', color:colors.textMuted, fontWeight:'bold', textTransform:'uppercase', marginBottom:'4px'}}>Series recurrentes ({recurringSeries.length})</div>
            {recurringSeries.map(s => (
              <div key={s.seriesId} style={{padding:'10px 12px', backgroundColor:colors.bgPrimary, borderRadius:'8px', border:`1px solid ${colors.border}`, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div style={{flex:1}}>
                  <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                    <div style={{width:'10px', height:'10px', borderRadius:'50%', backgroundColor:s.color}}></div>
                    <span style={{fontSize:'13px', fontWeight:'600', color:colors.textPrimary}}>{s.name}</span>
                    <span style={{fontSize:'10px', padding:'2px 6px', backgroundColor:colors.bgTertiary, borderRadius:'10px', color:colors.textMuted}}>{s.count} tareas</span>
                  </div>
                  <div style={{fontSize:'11px', color:colors.textMuted}}>
                    {fmtDate(s.firstDate)} — {fmtDate(s.lastDate)}
                  </div>
                </div>
                {confirmDeleteSeries === s.seriesId ? (
                  <div style={{display:'flex', gap:'4px'}}>
                    <button onClick={() => handleDeleteSeries(s.seriesId, s.tasks)} style={{padding:'4px 10px', backgroundColor:colors.danger, color:'white', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'11px', fontWeight:'bold'}}>Confirmar</button>
                    <button onClick={() => setConfirmDeleteSeries(null)} style={{padding:'4px 10px', backgroundColor:colors.bgTertiary, color:colors.textMuted, border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'11px'}}>Cancelar</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteSeries(s.seriesId)} style={{padding:'4px 10px', backgroundColor:`${colors.danger}22`, color:colors.danger, border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'11px', display:'flex', alignItems:'center', gap:'4px'}}>
                    <Trash2 size={12}/> Eliminar serie
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

// --- PAPELERA DE ACTIVIDADES ---
const TrashModal = ({ isOpen, onClose, trashTasks, onRestore, onPermanentDelete, onEmptyTrash, colors, activityTypes }) => {
  const [selectedTrashItem, setSelectedTrashItem] = useState(null);
  
  if (!isOpen) return null;
  
  const getDaysRemaining = (deletedAt) => {
    if (!deletedAt) return 30;
    const deleted = new Date(deletedAt);
    const now = new Date();
    const diffMs = 30 * 24 * 60 * 60 * 1000 - (now - deleted);
    return Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  };

  const formatDeletedDate = (deletedAt) => {
    if (!deletedAt) return 'Desconocido';
    return new Date(deletedAt).toLocaleString('es-CR', { 
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { onClose(); setSelectedTrashItem(null); }} title={`🗑️ Papelera (${trashTasks.length})`} size="lg" colors={colors}>
      <div style={{color:colors.textSecondary}}>
        {trashTasks.length === 0 ? (
          <div style={{textAlign:'center', padding:'40px 20px'}}>
            <Trash2 size={48} style={{color:colors.textMuted, marginBottom:'16px', opacity:0.4}}/>
            <p style={{fontSize:'16px', color:colors.textMuted, marginBottom:'8px'}}>La papelera está vacía</p>
            <p style={{fontSize:'12px', color:colors.textMuted, opacity:0.7}}>Las actividades eliminadas aparecerán aquí durante 30 días.</p>
          </div>
        ) : (
          <>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', padding:'10px', backgroundColor:colors.bgTertiary, borderRadius:'8px'}}>
              <div style={{fontSize:'12px', color:colors.textMuted}}>
                <AlertTriangle size={14} style={{verticalAlign:'middle', marginRight:'6px', color:colors.warning}}/>
                Las actividades se eliminan permanentemente tras <strong style={{color:colors.warning}}>30 días</strong> en papelera.
              </div>
              <button 
                onClick={() => { if(confirm('¿Vaciar toda la papelera? Esta acción es irreversible.')) onEmptyTrash(); }}
                style={{padding:'6px 12px', backgroundColor:colors.danger, color:'white', border:'none', borderRadius:'6px', cursor:'pointer', fontSize:'11px', fontWeight:'bold', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:'4px'}}
              >
                <Trash2 size={12}/> Vaciar Papelera
              </button>
            </div>

            <div style={{display:'flex', gap:'16px', maxHeight:'60vh'}}>
              {/* Lista de actividades eliminadas */}
              <div style={{flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'6px'}}>
                {trashTasks
                  .sort((a, b) => new Date(b.deletedAt || 0) - new Date(a.deletedAt || 0))
                  .map(item => {
                    const ti = activityTypes.find(at => at.id === item.typeId);
                    const daysLeft = getDaysRemaining(item.deletedAt);
                    const isSelected = selectedTrashItem?.id === item.id;
                    return (
                      <div 
                        key={item.id}
                        onClick={() => setSelectedTrashItem(item)}
                        style={{
                          padding:'10px 12px', borderRadius:'8px', cursor:'pointer',
                          backgroundColor: isSelected ? `${colors.accent}15` : colors.bgPrimary,
                          border: `1px solid ${isSelected ? colors.accent : colors.border}`,
                          transition:'all 0.15s ease'
                        }}
                      >
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'4px'}}>
                          <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                            <div style={{width:'10px', height:'10px', borderRadius:'50%', backgroundColor:ti?.color || '#666', flexShrink:0}}></div>
                            <span style={{fontWeight:'bold', fontSize:'13px', color:colors.textPrimary}}>
                              {ti?.name || item.activityTypeName || 'Actividad'}
                            </span>
                          </div>
                          <span style={{fontSize:'10px', color:daysLeft <= 7 ? colors.danger : colors.textMuted, fontWeight:daysLeft <= 7 ? 'bold' : 'normal', whiteSpace:'nowrap'}}>
                            {daysLeft}d restantes
                          </span>
                        </div>
                        {item.subtipo && <div style={{fontSize:'11px', color:colors.textSecondary, marginLeft:'18px'}}>{item.subtipo}</div>}
                        <div style={{fontSize:'10px', color:colors.textMuted, marginTop:'4px', marginLeft:'18px'}}>
                          Eliminado: {formatDeletedDate(item.deletedAt)}
                        </div>
                        {item.fieldData?.expediente && <div style={{fontSize:'10px', color:colors.textMuted, marginLeft:'18px'}}>Exp: {item.fieldData.expediente}</div>}
                      </div>
                    );
                  })}
              </div>

              {/* Panel de detalle del ítem seleccionado */}
              <div style={{flex:1, borderLeft:`1px solid ${colors.border}`, paddingLeft:'16px'}}>
                {selectedTrashItem ? (() => {
                  const ti = activityTypes.find(at => at.id === selectedTrashItem.typeId);
                  const daysLeft = getDaysRemaining(selectedTrashItem.deletedAt);
                  return (
                    <div>
                      <div style={{padding:'10px', borderRadius:'8px', marginBottom:'16px', color:'white', backgroundColor:ti?.color || '#333'}}>
                        <strong>{ti?.name || selectedTrashItem.activityTypeName || 'Actividad'}</strong>
                        {selectedTrashItem.subtipo && `: ${selectedTrashItem.subtipo}`}
                      </div>
                      
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'16px', fontSize:'12px'}}>
                        <div>
                          <div style={{fontSize:'10px', color:colors.textMuted, fontWeight:'bold', textTransform:'uppercase', marginBottom:'2px'}}>Inicio</div>
                          <div>{new Date(selectedTrashItem.start).toLocaleString('es-CR', {dateStyle:'medium', timeStyle:'short'})}</div>
                        </div>
                        <div>
                          <div style={{fontSize:'10px', color:colors.textMuted, fontWeight:'bold', textTransform:'uppercase', marginBottom:'2px'}}>Fin</div>
                          <div>{new Date(selectedTrashItem.end).toLocaleString('es-CR', {dateStyle:'medium', timeStyle:'short'})}</div>
                        </div>
                        <div>
                          <div style={{fontSize:'10px', color:colors.textMuted, fontWeight:'bold', textTransform:'uppercase', marginBottom:'2px'}}>Estado</div>
                          <div>{selectedTrashItem.status === 'completed' ? '✅ Completada' : selectedTrashItem.status === 'in_progress' ? '▶️ En curso' : selectedTrashItem.status === 'paused' ? '⏸️ Pausada' : '🕐 Pendiente'}</div>
                        </div>
                        <div>
                          <div style={{fontSize:'10px', color:colors.textMuted, fontWeight:'bold', textTransform:'uppercase', marginBottom:'2px'}}>Sesiones</div>
                          <div>{selectedTrashItem.sessions?.length || 0}</div>
                        </div>
                      </div>
                      
                      {selectedTrashItem.fieldData?.expediente && (
                        <div style={{marginBottom:'8px', fontSize:'12px'}}>
                          <span style={{fontWeight:'bold', color:colors.textMuted}}>Expediente:</span> {selectedTrashItem.fieldData.expediente}
                        </div>
                      )}
                      {selectedTrashItem.fieldData?.informe && (
                        <div style={{marginBottom:'8px', fontSize:'12px'}}>
                          <span style={{fontWeight:'bold', color:colors.textMuted}}>Informe:</span> {selectedTrashItem.fieldData.informe}
                        </div>
                      )}
                      {selectedTrashItem.observations && (
                        <div style={{marginBottom:'12px', fontSize:'12px'}}>
                          <span style={{fontWeight:'bold', color:colors.textMuted}}>Observaciones:</span> {selectedTrashItem.observations}
                        </div>
                      )}
                      {selectedTrashItem.logistics?.codigoPP && (
                        <div style={{marginBottom:'12px', fontSize:'12px'}}>
                          <span style={{fontWeight:'bold', color:colors.textMuted}}>Código PP:</span> {selectedTrashItem.logistics.codigoPP}
                        </div>
                      )}
                      
                      <div style={{padding:'10px', backgroundColor:`${colors.warning}15`, borderRadius:'8px', marginBottom:'16px', fontSize:'11px', color:colors.warning}}>
                        <Clock size={12} style={{verticalAlign:'middle', marginRight:'4px'}}/>
                        Eliminado: {formatDeletedDate(selectedTrashItem.deletedAt)} — Se eliminará permanentemente en <strong>{daysLeft} días</strong>.
                      </div>
                      
                      <div style={{display:'flex', flexDirection:'column', gap:'8px'}}>
                        <button 
                          onClick={() => { onRestore(selectedTrashItem.id); setSelectedTrashItem(null); }}
                          style={{width:'100%', padding:'10px', borderRadius:'6px', fontWeight:'bold', backgroundColor:colors.success, color:colors.bgPrimary, border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px'}}
                        >
                          <ArrowRightCircle size={16}/> Restaurar Actividad
                        </button>
                        <button 
                          onClick={() => setSelectedTrashItem(null)}
                          style={{width:'100%', padding:'10px', borderRadius:'6px', fontWeight:'bold', backgroundColor:colors.bgTertiary, color:colors.textMuted, border:`1px solid ${colors.border}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px'}}
                        >
                          <X size={16}/> Cerrar Detalle
                        </button>
                        <button 
                          onClick={() => { if(confirm('¿Eliminar permanentemente? Esta acción NO se puede deshacer.')) { onPermanentDelete(selectedTrashItem.id); setSelectedTrashItem(null); } }}
                          style={{width:'100%', padding:'10px', borderRadius:'6px', fontWeight:'bold', backgroundColor:'transparent', color:colors.danger, border:`1px solid ${colors.danger}`, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', fontSize:'13px'}}
                        >
                          <Trash2 size={16}/> Eliminar Permanentemente
                        </button>
                      </div>
                    </div>
                  );
                })() : (
                  <div style={{display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', minHeight:'200px', color:colors.textMuted}}>
                    <FileText size={32} style={{opacity:0.3, marginBottom:'12px'}}/>
                    <p style={{fontSize:'13px'}}>Seleccione una actividad para ver sus detalles</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

const App = () => {
  const [tasks, setTasks] = useState([]);
  const [trashTasks, setTrashTasks] = useState([]);
  const [isTrashModalOpen, setIsTrashModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [cases, setCases] = useState([]);
  const [caseLinks, setCaseLinks] = useState([]);
  const [isCasesModalOpen, setIsCasesModalOpen] = useState(false);
  const [batches, setBatches] = useState([]);
  const [isBatchesModalOpen, setIsBatchesModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
  const [markers] = useState([...PAYMENTS_2026, ...HOLIDAYS_CR_2026, ...EFEMERIDES_2026, ...MOON_PHASES_2026]);
  const [user, setUser] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dayOverrides, setDayOverrides] = useState({}); 
  const [resumeTaskId, setResumeTaskId] = useState(null);

  // --- ESTADO DE SINCRONIZACIÓN ---
  const [syncStatus, setSyncStatus] = useState('idle'); // 'idle', 'saving', 'saved', 'error'
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncTimerRef = useRef(null);

  // --- TRACKING POR TAREA (estilo WhatsApp) ---
  // taskSyncMap: {taskId: {status: 'synced'|'saving'|'error', at: Date}}
  const [taskSyncMap, setTaskSyncMap] = useState({});
  const [lastBackupAt, setLastBackupAt] = useState(() => {
    try { const s = localStorage.getItem('calendario_lastBackupAt'); return s ? new Date(s) : null; }
    catch(e) { return null; }
  });

  // --- PROTECCIÓN DE SESIÓN: Auto-backup local y detección de cambio de UID ---
  const [localBackupAvailable, setLocalBackupAvailable] = useState(false);
  const [localBackupInfo, setLocalBackupInfo] = useState(null); // {taskCount, exportedAt, previousUid}
  const [sessionRestored, setSessionRestored] = useState(false);

  // --- NUEVOS ESTADOS DE CONFIGURACIÓN ---
  const [activityTypes, setActivityTypes] = useState(DEFAULT_ACTIVITY_TYPES);
  const [ppCodes, setPpCodes] = useState(DEFAULT_PP_CODES); // Use the new default array with descriptions
  const [viaticumRates, setViaticumRates] = useState(DEFAULT_VIATICUM_RATES);
  const [monthlyBudgets, setMonthlyBudgets] = useState({});
  const [isBudgetLocked, setIsBudgetLocked] = useState(true);
  const [lodgingRates, setLodgingRates] = useState(DEFAULT_LODGING_RATES);
  const [isViaticosLocked, setIsViaticosLocked] = useState(true);
  const [isTypesLocked, setIsTypesLocked] = useState(true);
  const [isPPLocked, setIsPPLocked] = useState(true); // New state for PP lock
  
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  // ---------------------------------------

  const calculateDefaultModality = (dateStr) => {
      if (!dateStr) return 'none';
      const [y, m, d] = dateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      const dow = dateObj.getDay();
      const isHoliday = HOLIDAYS_CR_2026.some(h => h.date === dateStr);
      if (dow === 0 || dow === 6 || isHoliday) return 'none'; 
      if ([1, 4, 5].includes(dow)) return 'telework'; 
      return 'presencial';
  };
  const getDayModality = (dateStr) => dayOverrides[dateStr] || calculateDefaultModality(dateStr);

  // --- FUNCIONES DE TRACKING DE SINCRONIZACIÓN ---
  const formatTimeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 5) return 'ahora';
    if (seconds < 60) return `hace ${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `hace ${hours}h`;
    return date.toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const markSaving = () => {
    setSyncStatus('saving');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
  };
  const markSaved = () => {
    setSyncStatus('saved');
    setLastSyncTime(new Date());
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setSyncStatus('idle'), 8000);
  };
  const markSyncError = () => {
    setSyncStatus('error');
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => setSyncStatus('idle'), 15000);
  };

  // Helper to get budget data for a specific task's month
  const getBudgetStatus = (task) => {
       if(!task) return null;
       const d = new Date(task.start);
       const monthIndex = d.getMonth();
       const limit = monthlyBudgets[monthIndex] !== undefined ? monthlyBudgets[monthIndex] : DEFAULT_MONTHLY_BUDGET;
       
       // Calculate total spent for this month (excluding current task being edited if needed, but here we just sum all)
       let spent = 0;
       tasks.forEach(t => {
           if(new Date(t.start).getMonth() === monthIndex) {
               spent += calculateTaskCost(t, viaticumRates);
           }
       });
       
       return { limit, spent, monthIndex };
  };

  useEffect(() => {
    const firebaseConfig = {
      apiKey: "AIzaSyADhSpkSwZGGIjFi6U2swx0WJNq0AD7AVk",
      authDomain: "calendariosinacv1.firebaseapp.com",
      projectId: "calendariosinacv1",
      storageBucket: "calendariosinacv1.firebasestorage.app",
      messagingSenderId: "900985221783",
      appId: "1:900985221783:web:d5b6407eb23abf9190efd2",
      measurementId: "G-KZY96XP7C7"
    };
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    const auth = getAuth(app);
    try {
      initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentSingleTabManager({}) }) });
    } catch (e) { /* Firestore already initialized */ }
    signInAnonymously(auth).catch(console.error);
    const unsubscribeAuth = onAuthStateChanged(auth, setUser);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribeAuth();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const db = getFirestore();

    const tasksQuery = query(collection(db, 'users', user.uid, 'tasks'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      const loadedTasks = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      setTasks(loadedTasks);
      // Marcar todas las tareas recibidas de Firebase como sincronizadas
      const now = new Date();
      setTaskSyncMap(prev => {
        const next = { ...prev };
        loadedTasks.forEach(t => {
          // Solo actualizar si no está en estado 'saving' (para no pisar el indicador de guardado activo)
          if (!next[t.id] || next[t.id].status !== 'saving') {
            next[t.id] = { status: 'synced', at: now };
          }
        });
        return next;
      });
    });

    // --- CASOS / EXPEDIENTES: Listener ---
    // Deep sanitizer: convert ALL Firestore Timestamps to ISO strings recursively
    const sanitizeFirestore = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      if (typeof obj.toDate === 'function') return obj.toDate().toISOString();
      if (Array.isArray(obj)) return obj.map(sanitizeFirestore);
      const out = {};
      for (const k of Object.keys(obj)) out[k] = sanitizeFirestore(obj[k]);
      return out;
    };
    const casesQuery = query(collection(db, 'users', user.uid, 'cases'));
    const unsubscribeCases = onSnapshot(casesQuery, (snapshot) => {
      setCases(snapshot.docs.map(d => ({ ...sanitizeFirestore(d.data()), id: d.id })));
    });

    // --- CASE LINKS (relaciones entre casos): Listener ---
    const caseLinksQuery = query(collection(db, 'users', user.uid, 'case_links'));
    const unsubscribeCaseLinks = onSnapshot(caseLinksQuery, (snapshot) => {
      setCaseLinks(snapshot.docs.map(d => ({ ...sanitizeFirestore(d.data()), id: d.id })));
    });

    // --- BATCHES (lotes): Listener ---
    const batchesQuery = query(collection(db, 'users', user.uid, 'batches'));
    const unsubscribeBatches = onSnapshot(batchesQuery, (snapshot) => {
      setBatches(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    });

    // --- DOCUMENTOS: Listener ---
    const docsQuery = query(collection(db, 'users', user.uid, 'documents'));
    const unsubscribeDocuments = onSnapshot(docsQuery, (snapshot) => {
      setDocuments(snapshot.docs.map(d => {
        const data = d.data();
        return sanitizeFirestore({ ...data, id: d.id });
      }));
    });

    // --- PAPELERA: Listener de tareas eliminadas ---
    const trashQuery = query(collection(db, 'users', user.uid, 'trash'));
    const unsubscribeTrash = onSnapshot(trashQuery, (snapshot) => { 
      const trashItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      // Auto-limpiar tareas con más de 30 días en papelera
      const now = Date.now();
      const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
      trashItems.forEach(item => {
        if (item.deletedAt && (now - new Date(item.deletedAt).getTime()) > THIRTY_DAYS) {
          deleteDoc(doc(db, 'users', user.uid, 'trash', item.id)).catch(console.error);
        }
      });
      setTrashTasks(trashItems.filter(item => !item.deletedAt || (now - new Date(item.deletedAt).getTime()) <= THIRTY_DAYS));
    });

    const settingsRef = doc(db, 'users', user.uid, 'data', 'calendar_settings');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setDayOverrides(data.overrides || {});
            setResumeTaskId(data.resumeTaskId || null);
            if(data.activityTypes) {
                // Merge: conservar tipos guardados + agregar nuevos defaults que no existan
                // Strip 'expediente' from fields (now handled by Caso/Expediente section)
                const saved = data.activityTypes.map(t => t.fields ? { ...t, fields: t.fields.filter(f => f !== 'expediente') } : t);
                const savedIds = new Set(saved.map(t => t.id));
                const missingDefaults = DEFAULT_ACTIVITY_TYPES.filter(dt => !savedIds.has(dt.id));
                setActivityTypes([...saved, ...missingDefaults]);
            }
            if(data.ppCodes) {
                // Backward compatibility check: ensure codes are objects
                const loadedCodes = data.ppCodes.map(c => typeof c === 'string' ? { code: c, description: '' } : c);
                setPpCodes(loadedCodes);
            }
            if(data.viaticumRates) setViaticumRates(data.viaticumRates);
            if(data.monthlyBudgets) setMonthlyBudgets(data.monthlyBudgets);
            if(data.isBudgetLocked !== undefined) setIsBudgetLocked(data.isBudgetLocked);
            if(data.lodgingRates) setLodgingRates(data.lodgingRates);
            if(data.isViaticosLocked !== undefined) setIsViaticosLocked(data.isViaticosLocked);
            if(data.isTypesLocked !== undefined) setIsTypesLocked(data.isTypesLocked);
            if(data.isPPLocked !== undefined) setIsPPLocked(data.isPPLocked); // Load lock state
        }
    });

    return () => {
      unsubscribeTasks();
      unsubscribeCases();
      unsubscribeCaseLinks();
      unsubscribeBatches();
      unsubscribeDocuments();
      unsubscribeTrash();
      unsubscribeSettings();
    };
  }, [user]);

  // --- PROTECCIÓN DE SESIÓN: Auto-backup local y detección de cambio de UID ---
  useEffect(() => {
    if (!user) return;
    // Guardar UID actual y detectar si cambió
    try {
      const previousUid = localStorage.getItem('calendario_session_uid');
      if (previousUid && previousUid !== user.uid) {
        // UID cambió - verificar si hay backup local del UID anterior
        const backupRaw = localStorage.getItem('calendario_local_backup');
        if (backupRaw) {
          const backup = JSON.parse(backupRaw);
          if (backup.tasks && backup.tasks.length > 0) {
            setLocalBackupAvailable(true);
            setLocalBackupInfo({
              taskCount: backup.tasks.length,
              exportedAt: backup.exportedAt,
              previousUid: previousUid
            });
          }
        }
      }
      localStorage.setItem('calendario_session_uid', user.uid);
    } catch(e) { console.warn('Session protection: localStorage error', e); }
  }, [user]);

  // Auto-guardar backup local cada vez que cambian las tareas (protección contra pérdida de sesión)
  useEffect(() => {
    if (!user || tasks.length === 0 || sessionRestored) return;
    try {
      const backupData = {
        tasks: tasks,
        trash: trashTasks,
        settings: { activityTypes, ppCodes, viaticumRates, monthlyBudgets, lodgingRates, dayOverrides, isBudgetLocked, isViaticosLocked, isTypesLocked, isPPLocked },
        exportedAt: new Date().toISOString(),
        uid: user.uid
      };
      localStorage.setItem('calendario_local_backup', JSON.stringify(backupData));
    } catch(e) { console.warn('Auto-backup local: error', e); }
  }, [tasks, trashTasks, user]);

  // Detectar sesión vacía: si tenemos 0 tareas pero hay backup local (incluso del mismo UID tras borrado accidental)
  useEffect(() => {
    if (!user || tasks.length > 0 || sessionRestored) return;
    // Esperar un momento para que Firestore cargue
    const timer = setTimeout(() => {
      try {
        const backupRaw = localStorage.getItem('calendario_local_backup');
        if (backupRaw) {
          const backup = JSON.parse(backupRaw);
          if (backup.tasks && backup.tasks.length > 0) {
            setLocalBackupAvailable(true);
            setLocalBackupInfo({
              taskCount: backup.tasks.length,
              exportedAt: backup.exportedAt,
              previousUid: backup.uid || 'desconocido'
            });
          }
        }
      } catch(e) {}
    }, 5000); // Esperar 5s para confirmar que Firestore realmente no tiene datos
    return () => clearTimeout(timer);
  }, [user, tasks.length, sessionRestored]);

  // Función para restaurar desde backup local
  const restoreFromLocalBackup = () => {
    try {
      const backupRaw = localStorage.getItem('calendario_local_backup');
      if (!backupRaw) { alert('No se encontró respaldo local.'); return; }
      const data = JSON.parse(backupRaw);
      if (data.tasks && Array.isArray(data.tasks)) {
        data.tasks.forEach(task => saveTaskToDB(task));
      }
      if (data.trash && Array.isArray(data.trash)) {
        data.trash.forEach(item => {
          const { id, ...rest } = item;
          const db = getFirestore();
          setDoc(doc(db, 'users', user.uid, 'trash', id), rest);
        });
      }
      if (data.settings) {
        if (data.settings.activityTypes) setActivityTypes(data.settings.activityTypes.map(t => t.fields ? { ...t, fields: t.fields.filter(f => f !== 'expediente') } : t));
        if (data.settings.ppCodes) setPpCodes(data.settings.ppCodes);
        if (data.settings.viaticumRates) setViaticumRates(data.settings.viaticumRates);
        if (data.settings.monthlyBudgets) setMonthlyBudgets(data.settings.monthlyBudgets);
        if (data.settings.lodgingRates) setLodgingRates(data.settings.lodgingRates);
        if (data.settings.dayOverrides) setDayOverrides(data.settings.dayOverrides);
        if (data.settings.isBudgetLocked !== undefined) setIsBudgetLocked(data.settings.isBudgetLocked);
        if (data.settings.isViaticosLocked !== undefined) setIsViaticosLocked(data.settings.isViaticosLocked);
        if (data.settings.isTypesLocked !== undefined) setIsTypesLocked(data.settings.isTypesLocked);
        if (data.settings.isPPLocked !== undefined) setIsPPLocked(data.settings.isPPLocked);
        saveSettingsToDB(data.settings);
      }
      setSessionRestored(true);
      setLocalBackupAvailable(false);
      alert(`Restauradas ${data.tasks?.length || 0} actividades desde el respaldo local.`);
    } catch (error) {
      alert('Error al restaurar: ' + error.message);
    }
  };

  const dismissLocalBackup = () => {
    setLocalBackupAvailable(false);
    setLocalBackupInfo(null);
  };

  // Guardar Configs cuando cambian
  useEffect(() => {
      if(!user) return;
      markSaving();
      const db = getFirestore();
      const settingsRef = doc(db, 'users', user.uid, 'data', 'calendar_settings');
      setDoc(settingsRef, { activityTypes, ppCodes, viaticumRates, monthlyBudgets, isBudgetLocked, lodgingRates, isViaticosLocked, isTypesLocked, isPPLocked }, { merge: true })
        .then(() => markSaved()).catch(() => markSyncError());
  }, [activityTypes, ppCodes, viaticumRates, monthlyBudgets, isBudgetLocked, lodgingRates, isViaticosLocked, isTypesLocked, isPPLocked, user]);

  const saveTaskToDB = async (taskData) => {
      if (!user) return;
      markSaving();
      const db = getFirestore();
      const taskId = taskData.id || uuid();

      // Marcar tarea como "guardando"
      setTaskSyncMap(prev => ({ ...prev, [taskId]: { status: 'saving', at: prev[taskId]?.at || null } }));

      const { id, ...data } = taskData;
      if (data.start instanceof Date) data.start = data.start.toISOString();
      if (data.end instanceof Date) data.end = data.end.toISOString();

      // Campos opcionales para futuro módulo de casos/expedientes.
      // Se inyectan con defaults solo si no existen, para no alterar
      // datos de tareas que ya los tengan seteados.
      if (data.workstream === undefined) data.workstream = 'non_case';
      if (data.caseUid === undefined) data.caseUid = null;
      if (data.stepType === undefined) data.stepType = null;
      if (data.batchUid === undefined) data.batchUid = null;
      if (data.caseExternalRefText === undefined) data.caseExternalRefText = null;

      try {
          if (id && tasks.find(t => t.id === id)) { await updateDoc(doc(db, 'users', user.uid, 'tasks', id), data); }
          else { await setDoc(doc(db, 'users', user.uid, 'tasks', taskId), data); }
          // Marcar tarea como sincronizada
          setTaskSyncMap(prev => ({ ...prev, [taskId]: { status: 'synced', at: new Date() } }));
          markSaved();
      } catch (e) {
          console.error("Error saving task", e);
          setTaskSyncMap(prev => ({ ...prev, [taskId]: { status: 'error', at: prev[taskId]?.at || null } }));
          markSyncError();
      }
  };

  // Forzar re-sincronización de una tarea específica
  const forceSyncTask = (taskId) => {
      const task = tasks.find(t => t.id === taskId);
      if (task) saveTaskToDB(task);
  };

  const deleteTaskFromDB = async (id) => {
      if (!user) return;
      markSaving();
      const db = getFirestore();
      try { await deleteDoc(doc(db, 'users', user.uid, 'tasks', id)); markSaved(); }
      catch(e) { console.error("Error deleting task", e); markSyncError(); }
  };

  // --- PAPELERA: Funciones CRUD ---
  const moveTaskToTrash = async (taskId) => {
      if (!user) return;
      markSaving();
      const db = getFirestore();

      const taskToTrash = tasks.find(t => t.id === taskId);
      if (!taskToTrash) return;
      const { id, ...taskData } = taskToTrash;
      try {
        await setDoc(doc(db, 'users', user.uid, 'trash', id), {
          ...taskData, originalId: id, deletedAt: new Date().toISOString()
        });
        await deleteDoc(doc(db, 'users', user.uid, 'tasks', id));
        markSaved();
      } catch(e) { console.error("Error moving to trash", e); markSyncError(); }
  };

  const restoreTaskFromTrash = async (trashItemId) => {
      if (!user) return;
      const db = getFirestore();

      const trashItem = trashTasks.find(t => t.id === trashItemId);
      if (!trashItem) return;
      const { deletedAt, originalId, id, ...taskData } = trashItem;
      const restoredId = originalId || id;
      // Restaurar a tareas activas
      await setDoc(doc(db, 'users', user.uid, 'tasks', restoredId), taskData);
      // Eliminar de papelera
      await deleteDoc(doc(db, 'users', user.uid, 'trash', trashItemId));
  };

  const permanentDeleteFromTrash = async (trashItemId) => {
      if (!user) return;
      const db = getFirestore();

      await deleteDoc(doc(db, 'users', user.uid, 'trash', trashItemId));
  };

  const emptyTrash = async () => {
      if (!user) return;
      const db = getFirestore();

      const batch = writeBatch(db);
      trashTasks.forEach(item => {
        batch.delete(doc(db, 'users', user.uid, 'trash', item.id));
      });
      await batch.commit();
  };
  
  // --- CASOS / EXPEDIENTES: CRUD ---
  const saveCaseToDB = async (caseData) => {
    if (!user) return;
    markSaving();
    const db = getFirestore();
    const caseUid = caseData.caseUid;
    const { id, ...data } = caseData;
    try {
      await setDoc(doc(db, 'users', user.uid, 'cases', caseUid), data, { merge: true });
      markSaved();
    } catch (e) {
      console.error("Error saving case", e);
      markSyncError();
    }
  };

  const deleteCaseFromDB = async (caseUid) => {
    if (!user) return;
    markSaving();
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'cases', caseUid));
      markSaved();
    } catch (e) {
      console.error("Error deleting case", e);
      markSyncError();
    }
  };

  // --- CASE LINKS (relaciones entre casos): CRUD ---
  const saveCaseLinkToDB = async (linkData) => {
    if (!user) return;
    markSaving();
    const db = getFirestore();
    const linkUid = linkData.linkUid;
    const { id, ...data } = linkData;
    try {
      await setDoc(doc(db, 'users', user.uid, 'case_links', linkUid), data, { merge: true });
      markSaved();
    } catch (e) {
      console.error("Error saving case link", e);
      markSyncError();
    }
  };

  const deleteCaseLinkFromDB = async (linkUid) => {
    if (!user) return;
    markSaving();
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'case_links', linkUid));
      markSaved();
    } catch (e) {
      console.error("Error deleting case link", e);
      markSyncError();
    }
  };

  // --- BATCHES (lotes): CRUD ---
  const saveBatchToDB = async (batchData) => {
    if (!user) return;
    markSaving();
    const db = getFirestore();
    const batchUid = batchData.batchUid;
    const { id, ...data } = batchData;
    try {
      await setDoc(doc(db, 'users', user.uid, 'batches', batchUid), data, { merge: true });
      markSaved();
    } catch (e) {
      console.error("Error saving batch", e);
      markSyncError();
    }
  };

  const deleteBatchFromDB = async (batchUid) => {
    if (!user) return;
    markSaving();
    const db = getFirestore();
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'batches', batchUid));
      markSaved();
    } catch (e) {
      console.error("Error deleting batch", e);
      markSyncError();
    }
  };

  // --- DOCUMENTOS: CRUD ---
  const uploadDocumentToDB = async (docType, periodStart, periodEnd, file) => {
    if (!user) throw new Error('No user');
    markSaving();
    const docUid = Date.now().toString(36) + Math.random().toString(36).substr(2);
    const storagePath = `users/${user.uid}/documents/${docUid}_${file.name}`;
    const storage = getStorage();
    const storageRef = ref(storage, storagePath);
    try {
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      const metadata = { docUid, docType, periodStart, periodEnd, fileName: file.name, storagePath, downloadURL, uploadedAt: new Date().toISOString(), fileSize: file.size };
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.uid, 'documents', docUid), metadata);
      markSaved();
      return metadata;
    } catch (e) {
      console.error('Error uploading document:', e);
      markSyncError();
      throw e;
    }
  };

  const deleteDocumentFromDB = async (docData) => {
    if (!user) return;
    markSaving();
    try {
      const storage = getStorage();
      const storageRef = ref(storage, docData.storagePath);
      await deleteObject(storageRef).catch(err => console.warn('Storage delete error (may already be gone):', err));
      const db = getFirestore();
      await deleteDoc(doc(db, 'users', user.uid, 'documents', docData.docUid));
      markSaved();
    } catch (e) {
      console.error('Error deleting document:', e);
      markSyncError();
      throw e;
    }
  };

  const replaceDocumentInDB = async (docData, newFile) => {
    if (!user) throw new Error('No user');
    markSaving();
    try {
      const storage = getStorage();
      const oldRef = ref(storage, docData.storagePath);
      await deleteObject(oldRef).catch(err => console.warn('Old file delete error:', err));
      const newStoragePath = `users/${user.uid}/documents/${docData.docUid}_${newFile.name}`;
      const newRef = ref(storage, newStoragePath);
      await uploadBytes(newRef, newFile);
      const downloadURL = await getDownloadURL(newRef);
      const db = getFirestore();
      await setDoc(doc(db, 'users', user.uid, 'documents', docData.docUid), {
        ...docData, fileName: newFile.name, storagePath: newStoragePath, downloadURL, fileSize: newFile.size, uploadedAt: new Date().toISOString()
      });
      markSaved();
    } catch (e) {
      console.error('Error replacing document:', e);
      markSyncError();
      throw e;
    }
  };

  // Feriados como array plano de strings YYYY-MM-DD (para el motor de plazos)
  const holidayDates = useMemo(() => HOLIDAYS_CR_2026.map(h => h.date), []);

  const batchUpdateTasks = async (oldTypeId, newTypeId) => {
     if(!user) return;
     const db = getFirestore();

     const batch = writeBatch(db);
     const toUpdate = tasks.filter(t => t.typeId === oldTypeId);
     toUpdate.forEach(t => {
         const ref = doc(db, 'users', user.uid, 'tasks', t.id);
         batch.update(ref, { typeId: newTypeId });
     });
     await batch.commit();
  };

  const saveSettingsToDB = async (updates) => {
      if (!user) return;
      markSaving();
      const db = getFirestore();
      const settingsRef = doc(db, 'users', user.uid, 'data', 'calendar_settings');
      try { await setDoc(settingsRef, updates, { merge: true }); markSaved(); }
      catch(e) { console.error("Error saving settings", e); markSyncError(); }
  };

  // --- RESPALDO A FIREBASE STORAGE ---
  // Firebase Storage no permite CORS desde GitHub Pages, así que detectamos el origen
  const isGitHubPages = window.location.hostname.endsWith('.github.io');

  const uploadBackupToStorage = async () => {
      if (!user) return;
      if (isGitHubPages) {
        console.log('Respaldo a Storage omitido (GitHub Pages). Los datos están sincronizados en Firestore.');
        return;
      }
      const backupData = {
        tasks: tasks,
        trash: trashTasks,
        settings: {
          activityTypes, ppCodes, viaticumRates, monthlyBudgets,
          lodgingRates, dayOverrides, isBudgetLocked, isViaticosLocked,
          isTypesLocked, isPPLocked
        },
        exportedAt: new Date().toISOString()
      };
      const jsonString = JSON.stringify(backupData, null, 2);
      const fileName = `backup_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
      const storage = getStorage();
      const storageRef = ref(storage, `users/${user.uid}/${fileName}`);
      try {
        await uploadString(storageRef, jsonString);
        // Registrar timestamp del respaldo para doble check
        const backupTime = new Date();
        setLastBackupAt(backupTime);
        try { localStorage.setItem('calendario_lastBackupAt', backupTime.toISOString()); } catch(e) {}
        console.log('Respaldo automatico subido a Firebase Storage');
        // Mantener solo los ultimos 10 respaldos
        const listRef = ref(storage, `users/${user.uid}/`);
        const res = await listAll(listRef);
        const items = res.items.sort((a, b) => a.name.localeCompare(b.name));
        const maxBackups = 10;
        if (items.length > maxBackups) {
          const toDelete = items.slice(0, items.length - maxBackups);
          toDelete.forEach(item => deleteObject(item).catch(console.error));
        }
      } catch (error) {
        // CORS errors are expected on GitHub Pages - Firebase Storage needs CORS config
        if (error?.code === 'storage/unauthorized' || error?.message?.includes('CORS') || error?.message?.includes('Failed to fetch')) {
          console.warn('Respaldo a Storage omitido (CORS/permisos). Esto es normal en GitHub Pages. Los datos siguen sincronizados en Firestore.');
        } else {
          console.error('Error al subir respaldo a Storage:', error);
        }
      }
  };

  // Respaldo automatico cada 24 horas
  useEffect(() => {
      if (!user || tasks.length === 0) return;
      // Respaldo inmediato al iniciar sesion (con un delay para que se carguen datos)
      const initialTimeout = setTimeout(() => { uploadBackupToStorage(); }, 10000);
      // Programar respaldo cada 24 horas
      const interval = setInterval(uploadBackupToStorage, 24 * 60 * 60 * 1000);
      return () => { clearTimeout(initialTimeout); clearInterval(interval); };
  }, [user, tasks.length > 0]);

  // --- EXPORTAR RESPALDO COMPLETO (JSON) ---
  const exportBackup = () => {
      const backupData = {
        tasks: tasks,
        trash: trashTasks,
        settings: {
          activityTypes, ppCodes, viaticumRates, monthlyBudgets,
          lodgingRates, dayOverrides, isBudgetLocked, isViaticosLocked,
          isTypesLocked, isPPLocked
        },
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      // Registrar timestamp del respaldo para doble check
      const backupTime = new Date();
      setLastBackupAt(backupTime);
      try { localStorage.setItem('calendario_lastBackupAt', backupTime.toISOString()); } catch(e) {}
  };

  // --- IMPORTAR RESPALDO (JSON) ---
  const importBackup = (event) => {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          // Restaurar tareas
          if (data.tasks && Array.isArray(data.tasks)) {
            data.tasks.forEach(task => saveTaskToDB(task));
          }
          // Restaurar papelera
          if (data.trash && Array.isArray(data.trash)) {
            data.trash.forEach(item => {
              const { id, ...rest } = item;
              const db = getFirestore();
              setDoc(doc(db, 'users', user.uid, 'trash', id), rest);
            });
          }
          // Restaurar configuracion
          if (data.settings) {
            if (data.settings.activityTypes) setActivityTypes(data.settings.activityTypes.map(t => t.fields ? { ...t, fields: t.fields.filter(f => f !== 'expediente') } : t));
            if (data.settings.ppCodes) setPpCodes(data.settings.ppCodes);
            if (data.settings.viaticumRates) setViaticumRates(data.settings.viaticumRates);
            if (data.settings.monthlyBudgets) setMonthlyBudgets(data.settings.monthlyBudgets);
            if (data.settings.lodgingRates) setLodgingRates(data.settings.lodgingRates);
            if (data.settings.dayOverrides) setDayOverrides(data.settings.dayOverrides);
            if (data.settings.isBudgetLocked !== undefined) setIsBudgetLocked(data.settings.isBudgetLocked);
            if (data.settings.isViaticosLocked !== undefined) setIsViaticosLocked(data.settings.isViaticosLocked);
            if (data.settings.isTypesLocked !== undefined) setIsTypesLocked(data.settings.isTypesLocked);
            if (data.settings.isPPLocked !== undefined) setIsPPLocked(data.settings.isPPLocked);
            saveSettingsToDB(data.settings);
          }
          alert('Respaldo restaurado correctamente');
        } catch (error) {
          alert('Error al leer el archivo de respaldo: ' + error.message);
        }
      };
      reader.readAsText(file);
  };

  // --- RESTAURAR DESDE FIREBASE STORAGE ---
  const listStorageBackups = async () => {
      if (!user) return [];
      if (isGitHubPages) { alert('Los respaldos de Storage no están disponibles desde GitHub Pages. Use la exportación JSON local.'); return []; }
      const storage = getStorage();
      const listRef = ref(storage, `users/${user.uid}/`);
      try {
        const res = await listAll(listRef);
        return res.items.map(item => item.name).sort().reverse();
      } catch (error) {
        console.error('Error al listar respaldos:', error);
        return [];
      }
  };

  const restoreFromStorageBackup = async (fileName) => {
      if (!user) return;
      if (isGitHubPages) { alert('Restauración desde Storage no disponible en GitHub Pages.'); return; }
      const storage = getStorage();
      const fileRef = ref(storage, `users/${user.uid}/${fileName}`);
      try {
        const url = await getDownloadURL(fileRef);
        const response = await fetch(url);
        const data = await response.json();
        if (data.tasks && Array.isArray(data.tasks)) {
          data.tasks.forEach(task => saveTaskToDB(task));
        }
        if (data.trash && Array.isArray(data.trash)) {
          data.trash.forEach(item => {
            const { id, ...rest } = item;
            const db = getFirestore();
            setDoc(doc(db, 'users', user.uid, 'trash', id), rest);
          });
        }
        if (data.settings) {
          if (data.settings.activityTypes) setActivityTypes(data.settings.activityTypes.map(t => t.fields ? { ...t, fields: t.fields.filter(f => f !== 'expediente') } : t));
          if (data.settings.ppCodes) setPpCodes(data.settings.ppCodes);
          if (data.settings.viaticumRates) setViaticumRates(data.settings.viaticumRates);
          if (data.settings.monthlyBudgets) setMonthlyBudgets(data.settings.monthlyBudgets);
          if (data.settings.lodgingRates) setLodgingRates(data.settings.lodgingRates);
          if (data.settings.dayOverrides) setDayOverrides(data.settings.dayOverrides);
          if (data.settings.isBudgetLocked !== undefined) setIsBudgetLocked(data.settings.isBudgetLocked);
          if (data.settings.isViaticosLocked !== undefined) setIsViaticosLocked(data.settings.isViaticosLocked);
          if (data.settings.isTypesLocked !== undefined) setIsTypesLocked(data.settings.isTypesLocked);
          if (data.settings.isPPLocked !== undefined) setIsPPLocked(data.settings.isPPLocked);
          saveSettingsToDB(data.settings);
        }
        alert('Respaldo restaurado desde Storage');
      } catch (error) {
        alert('Error al restaurar: ' + error.message);
      }
  };

  const saveDayOverrideToDB = (dateStr, modality) => {
      const newOverrides = { ...dayOverrides };
      if (modality === 'default') delete newOverrides[dateStr];
      else newOverrides[dateStr] = modality;
      saveSettingsToDB({ overrides: newOverrides });
  };

  const handleImportBackup = (importedTasks) => { importedTasks.forEach(task => saveTaskToDB(task)); };

  // --- HELPER FOR ACTIVE TASK DURATION ---
  const getSeriesDuration = (taskId, seriesId, now) => {
      if (!seriesId && !taskId) return 0;
      const linkedTasks = tasks.filter(t => (t.seriesId === seriesId) || (t.id === taskId));
      return linkedTasks.reduce((total, t) => {
          if (!t.sessions) return total;
          return total + t.sessions.reduce((acc, s) => {
              const start = new Date(s.start);
              const end = s.end ? new Date(s.end) : now; 
              return acc + (end - start);
          }, 0);
      }, 0);
  };
  
  const getSeriesSessionCount = (taskId, seriesId) => {
      const linkedTasks = tasks.filter(t => (t.seriesId === seriesId) || (t.id === taskId));
      return linkedTasks.reduce((count, t) => count + (t.sessions?.length || 0), 0);
  };
  
  const getCurrentSessionDuration = (task, now) => {
      if (!task || !task.sessions || task.status !== 'in_progress') return 0;
      const lastSession = task.sessions[task.sessions.length - 1];
      if (!lastSession || lastSession.end) return 0; 
      return now - new Date(lastSession.start);
  };

  // --- ESTADO DEL TEMA ---
  const [isDarkMode, setIsDarkMode] = useState(true);
  const colors = isDarkMode ? DARK_THEME : LIGHT_THEME;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [scheduleAlert, setScheduleAlert] = useState(null);
  const alertedTasks = useRef(new Set());
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [pausedByNewTask, setPausedByNewTask] = useState(null); 
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState(''); 
  const [filterEndDate, setFilterEndDate] = useState('');
  const [isModalityModalOpen, setIsModalityModalOpen] = useState(false);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showWeekends, setShowWeekends] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReportsModalOpen, setIsReportsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 1000); return () => clearInterval(timer); }, []);
  useEffect(() => { const handleResize = () => setWindowWidth(window.innerWidth); window.addEventListener('resize', handleResize); return () => window.removeEventListener('resize', handleResize); }, []);

  // === AUTO-PAUSA A LAS 16:00 ===
  const autoPausedToday = useRef(false);
  useEffect(() => {
    const now = currentTime;
    const h = now.getHours();
    const m = now.getMinutes();
    // Reset flag at midnight (new day)
    if (h === 0 && m === 0) autoPausedToday.current = false;
    // At 16:00 (or shortly after), pause any in_progress task
    if (h >= 16 && !autoPausedToday.current) {
      const active = tasks.find(t => t.status === 'in_progress');
      if (active) {
        const pauseTime = new Date(now);
        pauseTime.setHours(16, 0, 0, 0);
        // Use the exact 16:00 timestamp if we're within 2 minutes of 16:00, otherwise use now
        const endTimestamp = (h === 16 && m < 2) ? pauseTime.toISOString() : now.toISOString();
        const sessions = [...(active.sessions || [])];
        if (sessions.length > 0 && !sessions[sessions.length - 1].end) {
          sessions[sessions.length - 1].end = endTimestamp;
        }
        saveTaskToDB({ ...active, status: 'paused', sessions });
        autoPausedToday.current = true;
      } else {
        // No active task at 16:00, mark as handled so we don't keep checking
        autoPausedToday.current = true;
      }
    }
  }, [currentTime, tasks]);
  
  useEffect(() => {
    const now = new Date();
    const pending = tasks.find(t => {
      if (t.status !== 'pending' || alertedTasks.current.has(t.id)) return false;
      const start = new Date(t.start);
      return Math.abs(now - start) < 60000;
    });
    if (pending) { alertedTasks.current.add(pending.id); setScheduleAlert(pending); }
  }, [currentTime, tasks]);

  useEffect(() => {
    if (!searchQuery && filterType === 'all' && !filterStartDate && !filterEndDate) { setSearchResults(null); return; }
    const lowerQuery = searchQuery.toLowerCase();
    const results = tasks.filter(t => {
      if (filterType !== 'all' && t.typeId !== parseInt(filterType)) return false;
      const taskDate = new Date(t.start);
      if (filterStartDate) { const start = new Date(filterStartDate); start.setHours(0,0,0,0); if (taskDate < start) return false; }
      if (filterEndDate) { const end = new Date(filterEndDate); end.setHours(23,59,59,999); if (taskDate > end) return false; }
      if (searchQuery) {
          const ti = activityTypes.find(at => at.id === t.typeId);
          const textMatch = ((t.fieldData?.expediente?.toLowerCase().includes(lowerQuery)) || (t.observations?.toLowerCase().includes(lowerQuery)) || (t.subtipo?.toLowerCase().includes(lowerQuery)) || (ti?.name?.toLowerCase().includes(lowerQuery)));
          if (!textMatch) return false;
      }
      return true;
    });
    setSearchResults(results.sort((a,b) => new Date(a.start) - new Date(b.start)));
  }, [tasks, searchQuery, filterType, filterStartDate, filterEndDate, activityTypes]);

  const toggleDayTag = (date) => { setSelectedDay(date); setIsModalityModalOpen(true); };

  const visibleDays = useMemo(() => {
    const days = [];
    let start = new Date(currentDate); start.setDate(1);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
    start.setDate(diff);
    for(let i=0; i<42; i++) { days.push(new Date(start)); start.setDate(start.getDate()+1); }
    return showWeekends ? days : days.filter(d => d.getDay() !== 0 && d.getDay() !== 6);
  }, [currentDate, showWeekends]);

  const handleDuplicateTask = (originalTask, specificStart, specificEnd) => {
      let nextStart, nextEnd;
      const seriesId = originalTask.seriesId || originalTask.id;
      if (!originalTask.seriesId) saveTaskToDB({ ...originalTask, seriesId });
      if (specificStart && specificEnd) { nextStart = specificStart; nextEnd = specificEnd; } 
      else { const nextDay = new Date(originalTask.start); nextDay.setDate(nextDay.getDate() + 1); nextStart = nextDay; nextEnd = new Date(new Date(originalTask.end).getTime() + (nextDay - new Date(originalTask.start))); }
      const newTask = { ...originalTask, id: uuid(), status: 'pending', start: nextStart.toISOString(), end: nextEnd.toISOString(), sessions: [], rescheduleCount: 0, seriesId: seriesId };
      saveTaskToDB(newTask); setIsTaskModalOpen(false); setEditingTask(null);
  };

  const handleSaveTask = (taskData) => {
    let finalTask = { ...taskData };
    if (!finalTask.id) finalTask.id = uuid();
    if (!finalTask.seriesId) finalTask.seriesId = finalTask.id;
    const allTasks = (finalTask.repeat?.type !== 'none' && !taskData.id) ? generateRepetitions(finalTask, new Date(currentDate.getFullYear(), 11, 31)) : [finalTask];
    if (finalTask.status === 'completed' && finalTask.seriesId) {
        const seriesTasks = tasks.filter(t => t.seriesId === finalTask.seriesId && t.id !== finalTask.id && t.status !== 'completed');
        if (seriesTasks.length > 0) {
            const now = new Date();
            seriesTasks.forEach(st => {
              const updatedTask = { ...st, status: 'completed' };
              // Si está en curso, cerrar la sesión activa
              if (st.status === 'in_progress') {
                const sessions = [...(st.sessions || [])];
                if (sessions.length > 0 && !sessions[sessions.length - 1].end) {
                  sessions[sessions.length - 1].end = now.toISOString();
                }
                updatedTask.sessions = sessions;
              }
              saveTaskToDB(updatedTask);
            });
        }
    }
    if(tasks.some(t => t.id === finalTask.id)) {
        const oldTask = tasks.find(t => t.id === finalTask.id);
        let rescheduleCount = oldTask?.rescheduleCount || 0;
        if (oldTask && (new Date(oldTask.start).getTime() !== new Date(finalTask.start).getTime())) rescheduleCount++;
        if (finalTask.status === 'in_progress' && oldTask?.status !== 'in_progress') {
             const now = new Date(); const active = tasks.find(t => t.status === 'in_progress' && t.id !== finalTask.id);
             if (active) { const sessions = [...(active.sessions || [])]; if (sessions.length > 0 && !sessions[sessions.length-1].end) sessions[sessions.length-1].end = now.toISOString(); saveTaskToDB({ ...active, status: 'paused', sessions }); saveSettingsToDB({ resumeTaskId: active.id }); }
            finalTask.sessions = [...(finalTask.sessions || []), {start: now.toISOString(), end: null}];
        }
        if (finalTask.status === 'paused' && oldTask?.status === 'in_progress') { const now = new Date(); const sessions = [...(finalTask.sessions || [])]; if (sessions.length > 0 && !sessions[sessions.length-1].end) sessions[sessions.length-1].end = now.toISOString(); finalTask.sessions = sessions; }
        if (finalTask.status === 'completed' && oldTask?.status === 'in_progress') { const now = new Date(); const sessions = [...(finalTask.sessions || [])]; if (sessions.length > 0 && !sessions[sessions.length-1].end) sessions[sessions.length-1].end = now.toISOString(); finalTask.sessions = sessions; }
        saveTaskToDB({ ...finalTask, rescheduleCount });
        if (finalTask.status === 'completed' && resumeTaskId) { setPausedByNewTask(resumeTaskId); setTimeout(() => setShowResumePrompt(true), 500); }
    } else { allTasks.forEach(t => saveTaskToDB({ ...t, id: t.id || uuid(), status: t.status || 'pending', rescheduleCount: 0, seriesId: t.seriesId || t.id })); }
    setIsTaskModalOpen(false); setEditingTask(null);
  };

  const handleDeleteTask = (id) => { if(confirm("¿Mover a la papelera?")) moveTaskToTrash(id); setIsTaskModalOpen(false); };
  const handleDrop = (taskId, newDay) => { const task = tasks.find(t => t.id === taskId); if (!task) return; const oldStart = new Date(task.start); const duration = new Date(task.end) - oldStart; const newStart = new Date(newDay); newStart.setHours(oldStart.getHours(), oldStart.getMinutes()); saveTaskToDB({ ...task, start: newStart.toISOString(), end: new Date(newStart.getTime() + duration).toISOString() }); };
  
  const handleScheduleAction = (action) => {
    if (!scheduleAlert) return;
    if (action === 'start') {
       const now = new Date(); const active = tasks.find(t => t.status === 'in_progress');
       if (active) { const sessions = [...(active.sessions || [])]; if (sessions.length > 0 && !sessions[sessions.length-1].end) sessions[sessions.length-1].end = now.toISOString(); saveTaskToDB({ ...active, status: 'paused', sessions }); saveSettingsToDB({ resumeTaskId: active.id }); }
       const targetTask = tasks.find(t => t.id === scheduleAlert.id); if (targetTask) saveTaskToDB({ ...targetTask, status: 'in_progress', sessions: [...(targetTask.sessions||[]), {start: now.toISOString(), end: null}] });
    } else if (action === 'pause') { const targetTask = tasks.find(t => t.id === scheduleAlert.id); if (targetTask) saveTaskToDB({ ...targetTask, status: 'paused' }); }
    setScheduleAlert(null);
  };

  const handleResumePrompt = (resume) => {
    if (resume && pausedByNewTask) { const now = new Date(); const oldTask = tasks.find(t => t.id === pausedByNewTask); if (oldTask) saveTaskToDB({ ...oldTask, status: 'in_progress', sessions: [...(oldTask.sessions||[]), {start: now.toISOString(), end: null}] }); }
    setPausedByNewTask(null); saveSettingsToDB({ resumeTaskId: null }); setShowResumePrompt(false);
  };

  const isSelectedToday = toISODateString(selectedDay) === toISODateString(new Date()); 
  const getExitCountdown = () => { const target = new Date(); target.setHours(16, 0, 0, 0); const diff = target - currentTime; if (diff <= 0) return "Salida cumplida"; return `Faltan ${Math.floor(diff / 3600000)}h ${Math.floor((diff % 3600000) / 60000)}m`; };

  const filteredTasks = tasks.filter(t => { if (filterType !== 'all' && t.typeId !== parseInt(filterType)) return false; return true; });
  const tasksForDay = filteredTasks.filter(t => toISODateString(new Date(t.start)) === toISODateString(selectedDay)).sort((a,b) => new Date(a.start) - new Date(b.start));
  const activeTask = tasks.find(t => t.status === 'in_progress');
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'in_progress' && (new Date(t.end) < new Date() || t.status === 'paused')).sort((a,b) => new Date(a.end) - new Date(b.end));
  const weekRange = getWeekRange(selectedDay);
  const finishedThisWeek = tasks.filter(t => t.status === 'completed' && new Date(t.end) >= weekRange.start && new Date(t.end) <= weekRange.end).sort((a, b) => new Date(a.start) - new Date(b.start));

  // --- CÁLCULO DE FRECUENCIA DE USO (para ordenar tipos y subtipos) ---
  const typeFrequency = useMemo(() => {
    const freq = {};
    tasks.forEach(t => { freq[t.typeId] = (freq[t.typeId] || 0) + 1; });
    return freq;
  }, [tasks]);

  const subtypeFrequency = useMemo(() => {
    const freq = {};
    tasks.forEach(t => {
      if (t.subtipo) {
        const key = `${t.typeId}::${t.subtipo}`;
        freq[key] = (freq[key] || 0) + 1;
      }
    });
    return freq;
  }, [tasks]);

  const getSortedActivityTypes = useMemo(() => {
    return [...activityTypes].sort((a, b) => (typeFrequency[b.id] || 0) - (typeFrequency[a.id] || 0));
  }, [activityTypes, typeFrequency]);

  const getSortedSubtypes = (typeId, subtypes) => {
    if (!subtypes || subtypes.length === 0) return [];
    return [...subtypes].sort((a, b) => {
      const freqA = subtypeFrequency[`${typeId}::${a}`] || 0;
      const freqB = subtypeFrequency[`${typeId}::${b}`] || 0;
      return freqB - freqA;
    });
  };

  const inputStyle = {
    paddingLeft:'26px',paddingRight:'24px',paddingTop:'6px',paddingBottom:'6px',
    borderRadius:'8px',fontSize:'12px',backgroundColor:colors.bgPrimary,
    border:`1px solid ${colors.border}`,color:colors.textPrimary,
    width:'140px', minWidth: '100px'
  };
  
  // Budget Calculation Helper for Main View
  const getMonthBudgetState = (monthIndex) => {
      const limit = monthlyBudgets[monthIndex] !== undefined ? monthlyBudgets[monthIndex] : DEFAULT_MONTHLY_BUDGET;
      let spent = 0;
      tasks.forEach(t => {
          if(new Date(t.start).getMonth() === monthIndex) {
              spent += calculateTaskCost(t, viaticumRates);
          }
      });
      return { isOver: spent > limit, remaining: limit - spent };
  };

  // Detectar si es mobile (reactivo al redimensionar)
  const isMobile = windowWidth <= 768;

  return (
    <div style={{display:'flex',height:'100vh',flexDirection:'column',backgroundColor:colors.bgPrimary,color:colors.textSecondary,fontFamily:'system-ui, sans-serif',overflow:'hidden', transition: 'background-color 0.3s ease'}}>
      <header className="header-responsive" style={{flexShrink:0,zIndex:50,backgroundColor:colors.bgSecondary,borderBottom:`1px solid ${colors.border}`,padding:'8px 12px',display:'flex',alignItems:'center',justifyContent:'space-between',gap:'8px',overflowX: 'auto'}}>
         <div style={{display:'flex',alignItems:'center',gap:'8px', flexShrink: 0}}>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} style={{padding:'8px',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted,borderRadius:'6px', flexShrink: 0}}><Menu size={20}/></button>
            <div className="hide-on-mobile" style={{paddingLeft:'8px',borderLeft:`2px solid ${colors.border}`, flexShrink: 0}}>
               <div style={{display:'flex',alignItems:'center',gap:'8px',color:colors.textMuted,fontSize:'9px',fontWeight:'bold',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'1px', whiteSpace: 'nowrap'}}>
                  <svg viewBox="0 0 500 300" style={{width:'50px', height:'30px', borderRadius:'2px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'}} preserveAspectRatio="none"><rect width="500" height="300" fill="#002b7f"/><rect y="50" width="500" height="200" fill="#ffffff"/><rect y="100" width="500" height="100" fill="#ce1126"/></svg>
                  <div style={{display: 'flex', flexDirection: 'column'}}><div style={{color:colors.textMuted, fontSize:'9px', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'2px', lineHeight: '1.1'}}>Calendario SINAC <span style={{fontSize:'8px',opacity:0.5,letterSpacing:'0.5px',fontWeight:'normal'}}>v{APP_VERSION}</span></div><h2 style={{fontWeight:'bold', color:colors.accent, fontSize:'14px', margin:0, whiteSpace: 'nowrap', lineHeight: '1.2'}}>Ing. Pablo César Sánchez Núñez</h2></div>
               </div>
            </div>
         </div>

         <div style={{display:'flex',alignItems:'center',gap:'2px', flexShrink: 0, position: isMobile ? 'static' : 'absolute', left: isMobile ? undefined : '50%', transform: isMobile ? 'none' : 'translateX(-50%)'}}>
            <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()); }} style={{padding:'6px',backgroundColor:colors.bgTertiary,border:`1px solid ${colors.border}`,borderRadius:'6px',cursor:'pointer',color:colors.success}} title="Hoy"><Calendar size={14}/></button>
            <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth()-1); setCurrentDate(d); }} style={{padding:'6px',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted,borderRadius:'50%'}}><ChevronLeft size={20}/></button>
            <h1 style={{fontSize: isMobile ? '13px' : '14px',fontWeight:'bold',color:colors.accent,minWidth: isMobile ? '90px' : '110px',textAlign:'center',textTransform:'capitalize',margin:0, whiteSpace: 'nowrap'}}>{currentDate.toLocaleString('es-ES', { month: 'long' })} {currentDate.getFullYear()}</h1>
            <button onClick={() => { const d = new Date(currentDate); d.setMonth(d.getMonth()+1); setCurrentDate(d); }} style={{padding:'6px',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted,borderRadius:'50%'}}><ChevronRight size={20}/></button>
         </div>

         <div style={{display:'flex',alignItems:'center',gap:'6px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end'}}>
            {isOffline ? <WifiOff size={16} color={colors.danger} title="Sin conexión (Modo Offline)" /> : <Wifi size={16} color={colors.success} title="Conectado y Sincronizado" />}
            <div className="hide-on-mobile" style={{position:'relative'}}>
              <Search size={14} style={{position:'absolute',left:'8px',top:'50%',transform:'translateY(-50%)',color:colors.textMuted}}/>
              <input type="text" placeholder="Buscar..." style={inputStyle} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{position:'absolute',right:'6px',top:'50%',transform:'translateY(-50%)',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted}}><X size={12}/></button>}
            </div>

            <button onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)} style={{padding:'6px',borderRadius:'6px',cursor:'pointer',border:'none',backgroundColor:(isFilterPanelOpen || filterType !== 'all' || filterStartDate || filterEndDate) ? colors.success : colors.bgTertiary,color:(isFilterPanelOpen || filterType !== 'all' || filterStartDate || filterEndDate) ? colors.bgPrimary : colors.textMuted}} title="Filtros"><Filter size={16}/></button>
            {isFilterPanelOpen && ( /* ... existing filter panel ... */ null )}

            {/* SETTINGS BUTTON */}
            <button onClick={() => setIsConfigModalOpen(true)} style={{padding:'6px',borderRadius:'6px',cursor:'pointer',border:'none',backgroundColor:colors.bgTertiary,color:colors.textMuted}} title="Configuración"><Settings size={16}/></button>

            {/* RECURRING ACTIVITIES BUTTON */}
            <button className="hide-on-mobile" onClick={() => setIsRecurringModalOpen(true)} style={{padding:'6px',borderRadius:'6px',cursor:'pointer',border:'none',backgroundColor:colors.bgTertiary,color:colors.textMuted}} title="Actividades Cíclicas"><Repeat size={16}/></button>

            {/* TRASH BUTTON */}
            <button className="hide-on-mobile" onClick={() => setIsTrashModalOpen(true)} style={{padding:'6px',borderRadius:'6px',cursor:'pointer',border:'none',backgroundColor:trashTasks.length > 0 ? `${colors.warning}22` : colors.bgTertiary,color:trashTasks.length > 0 ? colors.warning : colors.textMuted, position:'relative'}} title="Papelera">
              <Trash2 size={16}/>
              {trashTasks.length > 0 && (
                <span style={{position:'absolute',top:'-4px',right:'-4px',backgroundColor:colors.warning,color:colors.bgPrimary,fontSize:'9px',fontWeight:'bold',borderRadius:'50%',minWidth:'16px',height:'16px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 3px'}}>{trashTasks.length}</span>
              )}
            </button>

            <button className="hide-on-mobile" onClick={() => setShowWeekends(!showWeekends)} style={{padding:'6px',borderRadius:'6px',cursor:'pointer',border:`1px solid ${showWeekends?colors.success:colors.border}`,backgroundColor:colors.bgTertiary,color:showWeekends?colors.success:colors.textMuted}} title="Fines de Semana"><EyeOff size={16}/></button>
            <button onClick={() => setIsCasesModalOpen(true)} style={{padding:'6px',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.accent,borderRadius:'6px',position:'relative'}} title="Casos / Expedientes"><Briefcase size={18}/>{cases.length > 0 && <span style={{position:'absolute',top:'-2px',right:'-4px',backgroundColor:colors.accent,color:colors.bgPrimary,fontSize:'8px',fontWeight:'bold',borderRadius:'50%',minWidth:'14px',height:'14px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 2px'}}>{cases.length}</span>}</button>
            <button onClick={() => setIsBatchesModalOpen(true)} style={{padding:'6px',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted,borderRadius:'6px',position:'relative'}} title="Lotes">{<Layers size={18}/>}{batches.length > 0 && <span style={{position:'absolute',top:'-2px',right:'-4px',backgroundColor:colors.textMuted,color:colors.bgPrimary,fontSize:'8px',fontWeight:'bold',borderRadius:'50%',minWidth:'14px',height:'14px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 2px'}}>{batches.length}</span>}</button>
            <button onClick={() => setIsDocumentsModalOpen(true)} style={{padding:'6px',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted,borderRadius:'6px',position:'relative'}} title="Documentos"><Upload size={18}/>{documents.length > 0 && <span style={{position:'absolute',top:'-2px',right:'-4px',backgroundColor:colors.accent,color:colors.bgPrimary,fontSize:'8px',fontWeight:'bold',borderRadius:'50%',minWidth:'14px',height:'14px',display:'flex',alignItems:'center',justifyContent:'center',padding:'0 2px'}}>{documents.length}</span>}</button>
            <button onClick={() => setIsReportsModalOpen(true)} style={{padding:'6px',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted,borderRadius:'6px'}} title="Reportes"><FileText size={18}/></button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} style={{padding:'6px',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted,borderRadius:'6px'}} title={isDarkMode ? "Modo Claro" : "Modo Oscuro"}>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={() => { setSelectedDay(new Date()); setEditingTask(null); setIsTaskModalOpen(true); }} style={{padding:'8px 14px',backgroundColor:colors.success,color:colors.bgPrimary,borderRadius:'6px',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px',fontWeight:'bold',fontSize:'13px', whiteSpace: 'nowrap'}}><Plus size={16}/>{isMobile ? '' : ' Nueva'}</button>
         </div>
      </header>

      <div style={{display:'flex',flex:1,overflow:'hidden',position:'relative'}}>
         {isSidebarOpen && (
         <>
         {/* Overlay backdrop en mobile */}
         {isMobile && <div onClick={() => setIsSidebarOpen(false)} style={{position:'fixed',inset:0,backgroundColor:'rgba(0,0,0,0.5)',zIndex:54}}/>}
         <aside className={isMobile ? 'mobile-sidebar-overlay' : ''} style={{width: isMobile ? '100%' : '300px',flexShrink:0,backgroundColor:colors.bgSecondary,borderRight: isMobile ? 'none' : `1px solid ${colors.border}`,display:'flex',flexDirection:'column',height:'100%',overflowY:'auto', ...(isMobile ? {position:'fixed',inset:0,zIndex:55} : {})}}>
            {/* Botón cerrar sidebar en mobile */}
            {isMobile && (
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 16px',borderBottom:`1px solid ${colors.border}`,backgroundColor:colors.bgPrimary}}>
                <h3 style={{margin:0,fontSize:'16px',fontWeight:'bold',color:colors.accent}}>Panel Lateral</h3>
                <button onClick={() => setIsSidebarOpen(false)} style={{padding:'8px',borderRadius:'50%',backgroundColor:'transparent',border:'none',cursor:'pointer',color:colors.textMuted}}><X size={22}/></button>
              </div>
            )}
            <div style={{flex:1,padding:'16px',overflowY:'auto'}}>
               {/* ========== FECHA SELECCIONADA ========== */}
               <div style={{marginBottom:'20px'}}>
                  <h3 style={{fontWeight:'bold',textTransform:'uppercase',letterSpacing:'1px',display:'flex',alignItems:'center',gap:'8px',fontSize:isSelectedToday?'24px':'18px',color:isSelectedToday?colors.accent:colors.textSecondary,margin:0}}>
                     {isSelectedToday && <Clock size={24}/>}
                     {selectedDay.toLocaleDateString('es-CR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h3>
                  {isSelectedToday && (
                     <div style={{marginTop:'8px',paddingLeft:'8px',borderLeft:`3px solid ${colors.accent}`}}>
                        <div style={{fontSize:'28px',fontFamily:'monospace',color:colors.success,fontWeight:'bold'}}>{currentTime.toLocaleTimeString()}</div>
                        <div style={{fontSize:'12px',color:colors.textSecondary,marginTop:'4px',display:'flex',alignItems:'center',gap:'4px'}}><LogOut size={12}/> {getExitCountdown()}</div>
                     </div>
                  )}
               </div>
               
               {/* ========== SESIÓN DE USUARIO ========== */}
               {user && (
                 <div style={{padding:'10px',backgroundColor:colors.bgPrimary,borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'16px', fontSize:'11px', color:colors.textMuted}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}><div style={{width:'8px',height:'8px',borderRadius:'50%',backgroundColor:colors.success}}></div> <span style={{fontWeight:'600'}}>Sesión Activa</span></div>
                    <div style={{marginTop:'4px', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',fontSize:'10px'}}>ID: {user.uid}</div>
                 </div>
               )}

               {/* ========== ESTADO DE GUARDADO FIREBASE ========== */}
               <div style={{padding:'10px',backgroundColor:colors.bgPrimary,borderRadius:'8px',border:`1px solid ${colors.border}`,marginBottom:'16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'10px',padding:'6px 8px',borderRadius:'6px',
                    backgroundColor: syncStatus === 'saving' ? 'rgba(237,137,54,0.1)' : syncStatus === 'error' ? 'rgba(245,101,101,0.1)' : syncStatus === 'saved' ? 'rgba(72,187,120,0.1)' : 'transparent'}}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <Database size={18} color={syncStatus === 'saving' ? colors.warning : syncStatus === 'error' ? colors.danger : syncStatus === 'saved' ? colors.success : colors.textMuted} />
                      {syncStatus === 'saving' && <div style={{position:'absolute',top:'-2px',right:'-2px',width:'8px',height:'8px',borderRadius:'50%',backgroundColor:colors.warning,animation:'pulseDot 1s infinite'}}></div>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'12px',fontWeight:'600',color: syncStatus === 'saving' ? colors.warning : syncStatus === 'error' ? colors.danger : syncStatus === 'saved' ? colors.success : colors.textSecondary}}>
                        {syncStatus === 'saving' ? 'Guardando en Firebase...' : syncStatus === 'error' ? 'Error al guardar' : syncStatus === 'saved' ? 'Guardado en Firebase' : 'Firebase sincronizado'}
                      </div>
                      {lastSyncTime && <div style={{fontSize:'10px',color:colors.textMuted,marginTop:'2px',fontFamily:'monospace'}}>{formatTimeAgo(lastSyncTime)}</div>}
                    </div>
                    <div style={{flexShrink:0}}>
                      {syncStatus === 'saving' && <RefreshCw size={14} color={colors.warning} style={{animation:'spin 1s linear infinite'}}/>}
                      {syncStatus === 'saved' && <CheckCircle size={14} color={colors.success}/>}
                      {syncStatus === 'error' && <AlertCircle size={14} color={colors.danger}/>}
                      {syncStatus === 'idle' && <CheckCircle size={14} color={colors.textMuted}/>}
                    </div>
                  </div>
                  {/* Leyenda de checks por tarea */}
                  <div style={{marginTop:'8px',padding:'8px 10px',backgroundColor:colors.bgTertiary,borderRadius:'6px',fontSize:'11px',color:colors.textSecondary,lineHeight:'1.8'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}><CheckCircle size={13} color={colors.success} strokeWidth={2.5}/> Sincronizado en Firebase</div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px'}}><CheckCheck size={13} color="#60A5FA" strokeWidth={2.5}/> Sincronizado + Respaldado</div>
                    <div style={{display:'flex',alignItems:'center',gap:'6px',marginTop:'4px',opacity:0.8}}><RefreshCw size={11} color={colors.textMuted}/><span style={{fontSize:'10px'}}>Clic en el icono = forzar sync</span></div>
                  </div>
               </div>

               {/* ========== BANNER DE DÍA DE PAGO ========== */}
               {(() => {
                 const paymentMarker = markers.find(m => m.date === toISODateString(selectedDay) && m.type === 'payment');
                 if (!paymentMarker) return null;
                 return (
                   <div style={{backgroundColor:'rgba(214, 158, 46, 0.15)',border:'1px solid rgba(214, 158, 46, 0.3)',borderRadius:'8px',padding:'12px',display:'flex',alignItems:'center',gap:'12px',marginBottom:'16px'}}>
                     <div style={{backgroundColor:'rgba(214, 158, 46, 0.2)',padding:'8px',borderRadius:'50%',color:colors.gold,width:'40px',height:'40px',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'bold',fontSize:'20px'}}>₡</div>
                     <div>
                       <h4 style={{fontWeight:'bold',color:colors.gold,fontSize:'11px',textTransform:'uppercase',margin:0}}>¡Día de Pago!</h4>
                       <p style={{fontSize:'14px',color:colors.textSecondary,margin:0}}>{paymentMarker.name}</p>
                     </div>
                   </div>
                 );
               })()}

               {/* ========== ALERTA DE RESTAURACIÓN DE SESIÓN ========== */}
               {localBackupAvailable && localBackupInfo && (
                 <div style={{marginBottom:'16px',padding:'16px',backgroundColor:'rgba(96,165,250,0.1)',borderRadius:'10px',border:'2px solid rgba(96,165,250,0.4)'}}>
                   <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                     <AlertTriangle size={20} color="#60A5FA"/>
                     <span style={{fontSize:'13px',fontWeight:'bold',color:'#60A5FA',textTransform:'uppercase'}}>Sesión diferente detectada</span>
                   </div>
                   <p style={{fontSize:'12px',color:colors.textSecondary,margin:'0 0 6px 0',lineHeight:'1.5'}}>
                     Se encontró un respaldo local con <strong>{localBackupInfo.taskCount} actividades</strong> de una sesión anterior.
                   </p>
                   <p style={{fontSize:'11px',color:colors.textMuted,margin:'0 0 12px 0'}}>
                     Esto ocurre cuando el navegador pierde la sesión anónima de Firebase.
                   </p>
                   <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
                     <button onClick={restoreFromLocalBackup} style={{padding:'8px 16px',backgroundColor:'#60A5FA',color:colors.bgPrimary,fontWeight:'bold',borderRadius:'6px',border:'none',cursor:'pointer',fontSize:'12px',display:'flex',alignItems:'center',gap:'6px'}}>
                       <RefreshCw size={14}/> Restaurar actividades
                     </button>
                     <button onClick={dismissLocalBackup} style={{padding:'8px 16px',backgroundColor:'transparent',color:colors.textMuted,borderRadius:'6px',border:`1px solid ${colors.border}`,cursor:'pointer',fontSize:'12px'}}>
                       Ignorar
                     </button>
                   </div>
                 </div>
               )}

               {/* ========== ACTIVIDAD EN CURSO ========== */}
               <div style={{marginBottom:'20px'}}>
                  {activeTask ? (
                    <>
                      <h4 style={{fontSize:'11px',fontWeight:'bold',color:colors.success,textTransform:'uppercase',marginBottom:'8px',display:'flex',alignItems:'center',gap:'8px',paddingBottom:'4px',borderBottom:`1px solid ${colors.success}`}}><PlayCircle size={14}/> Actividad en curso</h4>
                      <div style={{backgroundColor:colors.bgPrimary,border:`1px solid ${colors.accent}`,borderRadius:'10px',padding:'14px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                          <span style={{fontSize:'11px',fontWeight:'bold',backgroundColor:colors.success,color:colors.bgPrimary,padding:'3px 10px',borderRadius:'10px',textTransform:'uppercase',display:'flex',alignItems:'center',gap:'4px'}}><PlayCircle size={12}/> En Curso</span>
                          <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                            <SyncIndicator taskId={activeTask.id} taskSyncMap={taskSyncMap} lastBackupAt={lastBackupAt} onForceSync={forceSyncTask} colors={colors} size={12}/>
                            <span style={{fontSize:'12px',fontFamily:'monospace',color:colors.accent,fontWeight:'600'}}>{new Date(activeTask.start).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                          </div>
                        </div>
                        <div style={{fontWeight:'bold',color:colors.textPrimary,fontSize:'15px',marginTop:'4px'}}>{activeTask.subtipo || activityTypes.find(at=>at.id===activeTask.typeId)?.name || 'Actividad'}</div>
                        <div style={{marginTop:'12px',display:'flex',flexDirection:'column',gap:'6px',fontSize:'12px',color:colors.textMuted}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}} title="Tiempo Sesión Actual">
                            <span>Sesion Actual:</span>
                            <span style={{color:colors.success,fontWeight:'bold',fontSize:'13px'}}>{formatDuration(getCurrentSessionDuration(activeTask, currentTime))}</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}} title="Tiempo Acumulado Total">
                            <span>Total Acumulado:</span>
                            <span style={{color:colors.accent,fontWeight:'bold',fontSize:'13px'}}>{formatDuration(getSeriesDuration(activeTask.id, activeTask.seriesId, currentTime))}</span>
                          </div>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}} title="Total Sesiones">
                            <span>Sesiones:</span>
                            <span style={{fontWeight:'600'}}>{getSeriesSessionCount(activeTask.id, activeTask.seriesId)}</span>
                          </div>
                        </div>
                        <button onClick={()=>{setEditingTask(activeTask);setIsTaskModalOpen(true);}} style={{marginTop:'10px',width:'100%',fontSize:'13px',padding:'8px',borderRadius:'6px',backgroundColor:colors.bgTertiary,color:colors.textSecondary,border:`1px solid ${colors.border}`,cursor:'pointer',fontWeight:'600',minHeight:'36px'}}>Gestionar</button>
                      </div>
                    </>
                  ) : (
                    <div style={{padding:'16px',backgroundColor:'rgba(237,137,54,0.1)',borderRadius:'10px',border:`2px solid ${colors.warning}`,textAlign:'center'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',marginBottom:'10px'}}>
                        <AlertTriangle size={22} color={colors.warning}/>
                        <span style={{fontSize:'14px',fontWeight:'bold',color:colors.warning,textTransform:'uppercase'}}>Sin actividad en curso</span>
                      </div>
                      <p style={{fontSize:'13px',color:colors.textSecondary,margin:'0 0 8px 0',lineHeight:'1.5'}}>No estás registrando tiempo en ninguna actividad.</p>
                      <p style={{fontSize:'12px',color:colors.textMuted,margin:0,lineHeight:'1.4'}}>Inicia una actividad desde la agenda o el calendario.</p>
                    </div>
                  )}
               </div>

               {/* ========== AGENDA DEL DÍA ========== */}
               <div style={{marginBottom:'20px',backgroundColor:'rgba(79,209,197,0.08)',borderRadius:'10px',padding:'12px',border:`2px solid ${colors.accent}`}}>
                  <h4 style={{fontSize:'12px',fontWeight:'bold',color:colors.accent,textTransform:'uppercase',marginBottom:'10px',display:'flex',alignItems:'center',gap:'8px',paddingBottom:'6px',borderBottom:`2px solid ${colors.accent}`}}><Calendar size={16}/> 📅 Agenda del Día</h4>
                  {tasksForDay.length === 0 ? (
                    <p style={{fontSize:'12px',color:colors.textMuted,fontStyle:'italic',textAlign:'center',padding:'8px 0'}}>Nada programado para hoy.</p>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'10px'}}>
                      {tasksForDay.map(task => {
                        const typeInfo = activityTypes.find(at=>at.id===task.typeId);
                        const taskColor = typeInfo?.color || colors.accent;
                        return (
                          <div key={task.id} onClick={()=>{setEditingTask(task);setIsTaskModalOpen(true);}} style={{padding:'12px 14px',borderRadius:'10px',border:`1px solid ${colors.border}`,cursor:'pointer',backgroundColor:colors.bgSecondary,opacity:task.status==='completed'?0.6:1,borderLeft:`4px solid ${taskColor}`,transition:'transform 0.15s ease, box-shadow 0.15s ease',boxShadow:'0 2px 4px rgba(0,0,0,0.2)',minHeight:'52px'}}>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                              <span style={{fontWeight:'bold',fontSize:'14px',color:task.status==='completed'?colors.textMuted:colors.textPrimary,textDecoration:task.status==='completed'?'line-through':'none'}}>{task.subtipo||typeInfo?.name||'Actividad'}</span>
                              <div style={{display:'flex',alignItems:'center',gap:'6px'}}>
                                {task.status==='in_progress' && <span style={{fontSize:'10px',fontWeight:'bold',backgroundColor:colors.success,color:colors.bgPrimary,padding:'3px 8px',borderRadius:'8px'}}>EN CURSO</span>}
                                {task.status==='paused' && <span style={{fontSize:'10px',fontWeight:'bold',backgroundColor:colors.warning,color:colors.bgPrimary,padding:'3px 8px',borderRadius:'8px'}}>PAUSA</span>}
                                {task.status==='completed' && <CheckCircle size={18} color={colors.success}/>}
                                <SyncIndicator taskId={task.id} taskSyncMap={taskSyncMap} lastBackupAt={lastBackupAt} onForceSync={forceSyncTask} colors={colors} size={12}/>
                              </div>
                            </div>
                            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'8px'}}>
                              <span style={{fontSize:'12px',color:colors.textMuted,display:'flex',alignItems:'center',gap:'4px'}}><Clock size={13}/> {new Date(task.start).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
                              <span style={{fontSize:'11px',color:taskColor,fontWeight:'600'}}>{typeInfo?.name}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
               </div>

               {/* ========== ATENCIÓN REQUERIDA ========== */}
               <div style={{marginBottom:'20px'}}>
                  <h3 style={{fontSize:'11px',fontWeight:'bold',color:colors.warning,textTransform:'uppercase',marginBottom:'8px',display:'flex',alignItems:'center',gap:'8px',paddingBottom:'4px',borderBottom:`1px solid ${colors.border}`}}><AlertTriangle size={14}/> Atención Requerida</h3>
                  {pendingTasks.length === 0 ? (
                    <p style={{fontSize:'12px',color:colors.textMuted,fontStyle:'italic'}}>Todo al día.</p>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                      {pendingTasks.slice(0,5).map(task => (
                        <div key={task.id} onClick={()=>{setEditingTask(task);setIsTaskModalOpen(true);}} style={{padding:'10px 12px',backgroundColor:colors.bgPrimary,borderRadius:'6px',borderLeft:`3px solid ${colors.warning}`,fontSize:'12px',color:colors.textSecondary,cursor:'pointer',minHeight:'44px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'4px'}}>
                            <span style={{fontWeight:'600',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,minWidth:0,fontSize:'13px'}}>{task.subtipo||activityTypes.find(at=>at.id===task.typeId)?.name||'Actividad'}</span>
                            <div style={{display:'flex',alignItems:'center',gap:'6px',flexShrink:0}}>
                              {task.status==='paused' && <span style={{backgroundColor:'rgba(237,137,54,0.2)',color:colors.warning,padding:'2px 8px',borderRadius:'6px',fontSize:'10px',fontWeight:'600'}}>PAUSA</span>}
                              <SyncIndicator taskId={task.id} taskSyncMap={taskSyncMap} lastBackupAt={lastBackupAt} onForceSync={forceSyncTask} colors={colors} size={10}/>
                            </div>
                          </div>
                          <div style={{color:colors.textMuted,fontSize:'11px'}}>Vencimiento: {new Date(task.end).toLocaleDateString()}</div>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               {/* ========== LOGRADO ESTA SEMANA ========== */}
               <div style={{marginBottom:'20px'}}>
                  <h3 style={{fontSize:'11px',fontWeight:'bold',color:colors.success,textTransform:'uppercase',marginBottom:'8px',display:'flex',alignItems:'center',gap:'8px',paddingBottom:'4px',borderBottom:`1px solid ${colors.border}`}}><CheckCircle size={14}/> Logrado esta Semana</h3>
                  {finishedThisWeek.length === 0 ? (
                    <p style={{fontSize:'12px',color:colors.textMuted,fontStyle:'italic'}}>Sin finalizadas aún.</p>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
                      {finishedThisWeek.map(task => (
                        <div key={task.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',fontSize:'12px',color:colors.textMuted,padding:'4px 0',borderBottom:`1px solid ${colors.bgPrimary}`}}>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',width:'70%'}}>{task.subtipo||activityTypes.find(at=>at.id===task.typeId)?.name||'Actividad'}</span>
                          <span style={{color:colors.success}}>{new Date(task.end).toLocaleDateString(undefined,{weekday:'short'})}</span>
                        </div>
                      ))}
                    </div>
                  )}
               </div>

               {/* ========== CONMEMORACIONES ========== */}
               <h3 style={{fontSize:'11px',fontWeight:'bold',color:colors.success,textTransform:'uppercase',marginTop:'16px',marginBottom:'12px',display:'flex',alignItems:'center',gap:'8px',paddingTop:'16px',borderTop:`1px solid ${colors.border}`}}><Flag size={14}/> Conmemoraciones</h3>
               <SideBanner selectedDate={selectedDay} markers={markers} colors={colors} />
            </div>
         </aside>
         </>
         )}

         <main style={{flex:1,display:'flex',flexDirection:'column',height:'100%',overflow:'hidden',backgroundColor:colors.bgPrimary}}>
            <div style={{flex:1,overflowY:'auto',padding:'16px'}}>
               {/* ... existing main calendar ... */}
               <div className="calendar-grid-responsive" style={{display:'grid',gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : `repeat(${showWeekends ? 7 : 5}, 1fr)`,gap:'1px',backgroundColor:colors.border,border:`1px solid ${colors.border}`,borderRadius:'8px',overflow:'hidden'}}>
                    {!isMobile && ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', ...(showWeekends ? ['Sáb', 'Dom'] : [])].map(d => (
                       <div key={d} style={{backgroundColor:colors.bgSecondary,padding:'10px',textAlign:'center',fontSize:'13px',fontWeight:'bold',color:colors.textMuted,borderBottom:`1px solid ${colors.border}`}}>{d}</div>
                    ))}
                    {visibleDays.map(day => (
                       <CalendarCell
                         key={day.toISOString()} day={day} tasks={filteredTasks} currentDate={currentDate}
                         dayTag={getDayModality(toISODateString(day))} markers={markers}
                         onToggleTag={() => toggleDayTag(day)}
                         onSelectDay={() => setSelectedDay(day)}
                         onAddTask={() => { setSelectedDay(day); setEditingTask(null); setIsTaskModalOpen(true); }}
                         onEditTask={(t) => { setEditingTask(t); setIsTaskModalOpen(true); }}
                         isSelected={toISODateString(day) === toISODateString(selectedDay)}
                         onDrop={handleDrop}
                         colors={colors}
                         activityTypes={activityTypes}
                         isMonthOverBudget={getMonthBudgetState(day.getMonth()).isOver}
                         viaticumRates={viaticumRates}
                         taskSyncMap={taskSyncMap}
                         lastBackupAt={lastBackupAt}
                         onForceSync={forceSyncTask}
                         isMobile={isMobile}
                         cases={cases}
                       />
                    ))}
                 </div>
            </div>
         </main>
      </div>

      <TaskFormModal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} task={editingTask} day={selectedDay} onSave={handleSaveTask} onDelete={handleDeleteTask} onDuplicate={handleDuplicateTask} tasks={tasks} colors={colors} activityTypes={activityTypes} ppCodes={ppCodes} viaticumRates={viaticumRates} currentMonthBudget={getBudgetStatus(editingTask || { start: selectedDay })} lodgingRates={lodgingRates} sortedActivityTypes={getSortedActivityTypes} getSortedSubtypes={getSortedSubtypes} taskSyncMap={taskSyncMap} lastBackupAt={lastBackupAt} onForceSync={forceSyncTask} cases={cases} batches={batches} />
      <ReportsModal isOpen={isReportsModalOpen} onClose={() => setIsReportsModalOpen(false)} tasks={tasks} markers={markers} dayOverrides={dayOverrides} colors={colors} onImportBackup={handleImportBackup} activityTypes={activityTypes} viaticumRates={viaticumRates} trashTasks={trashTasks} onExportBackup={exportBackup} onImportBackupJSON={importBackup} onUploadBackupToStorage={uploadBackupToStorage} onListStorageBackups={listStorageBackups} onRestoreFromStorage={restoreFromStorageBackup} cases={cases} batches={batches}/>
      <CasesModal isOpen={isCasesModalOpen} onClose={() => setIsCasesModalOpen(false)} cases={cases} onSaveCase={saveCaseToDB} onDeleteCase={deleteCaseFromDB} caseLinks={caseLinks} onSaveCaseLink={saveCaseLinkToDB} onDeleteCaseLink={deleteCaseLinkFromDB} colors={colors} holidays={holidayDates} tasks={tasks} Modal={Modal} onSaveTask={saveTaskToDB} />
      <BatchesModal isOpen={isBatchesModalOpen} onClose={() => setIsBatchesModalOpen(false)} batches={batches} cases={cases} tasks={tasks} onSaveBatch={saveBatchToDB} onDeleteBatch={deleteBatchFromDB} colors={colors} Modal={Modal} />
      <DocumentsModal isOpen={isDocumentsModalOpen} onClose={() => setIsDocumentsModalOpen(false)} documents={documents} onUpload={uploadDocumentToDB} onDelete={deleteDocumentFromDB} onReplace={replaceDocumentInDB} colors={colors} isOffline={isOffline} />
      <ConfigModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} colors={colors} activityTypes={activityTypes} setActivityTypes={setActivityTypes} ppCodes={ppCodes} setPpCodes={setPpCodes} viaticumRates={viaticumRates} setViaticumRates={setViaticumRates} tasks={tasks} onUpdateTasks={batchUpdateTasks} monthlyBudgets={monthlyBudgets} setMonthlyBudgets={setMonthlyBudgets} isBudgetLocked={isBudgetLocked} setIsBudgetLocked={setIsBudgetLocked} lodgingRates={lodgingRates} setLodgingRates={setLodgingRates} isViaticosLocked={isViaticosLocked} setIsViaticosLocked={setIsViaticosLocked} isTypesLocked={isTypesLocked} setIsTypesLocked={setIsTypesLocked} isPPLocked={isPPLocked} setIsPPLocked={setIsPPLocked} />
      <ScheduleAlert task={scheduleAlert} onAction={handleScheduleAction} onClose={() => setScheduleAlert(null)} colors={colors} activityTypes={activityTypes}/>
      <DayModalityModal isOpen={isModalityModalOpen} onClose={() => setIsModalityModalOpen(false)} selectedDay={selectedDay} currentModality={getDayModality(toISODateString(selectedDay))} onSave={(mod) => saveDayOverrideToDB(toISODateString(selectedDay), mod)} colors={colors}/>
      <RecurringActivitiesModal isOpen={isRecurringModalOpen} onClose={() => setIsRecurringModalOpen(false)} tasks={tasks} onDeleteTask={moveTaskToTrash} colors={colors} activityTypes={activityTypes}/>
      <TrashModal isOpen={isTrashModalOpen} onClose={() => setIsTrashModalOpen(false)} trashTasks={trashTasks} onRestore={restoreTaskFromTrash} onPermanentDelete={permanentDeleteFromTrash} onEmptyTrash={emptyTrash} colors={colors} activityTypes={activityTypes}/>
      
      {showResumePrompt && pausedByNewTask && ( /* ... existing resume prompt ... */ null )}
    </div>
  );
}

export default App;

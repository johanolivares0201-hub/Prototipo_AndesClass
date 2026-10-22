import type { Evidence } from '../types';
const definitions: [
    string,
    string,
    boolean
][] = [
    ['Inventario y mapa de datos', 'Todos los activos tienen nombre, categoría, finalidades, base, almacenamiento, titulares y proveedor identificados cuando procede.', true],
    ['Roles y contratos', 'Cada proveedor asociado tiene contrato de encargo registrado; no quedan proveedores referenciados sin registrar.', true],
    ['Garantías de transferencia', 'Las transferencias no generan hallazgos de mecanismo y los proveedores declaran una garantía.', true],
    ['Transparencia y consentimiento', 'No hay hallazgos de consentimiento, finalidad ni base jurídica en los activos registrados.', true],
    ['Evaluación de impacto y riesgos', 'Evaluación documentada de riesgos e impacto, medidas y aprobación de un responsable.', false],
    ['Seguridad técnica', 'Cifrado registrado para todos los activos; las medidas declaradas cuentan con evidencia técnica revisada.', true],
    ['Entornos de prueba sin datos reales', 'Se acredita uso de datos sintéticos o anonimizados y controles del entorno de pruebas.', false],
    ['Gestión del incidente', 'Contención completa, alcance y riesgo documentados, notificaciones resueltas y cierre con causa y acciones correctivas.', true],
    ['Derechos y gobernanza', 'Procedimiento de derechos, responsables y trazabilidad documentados.', false],
    ['Retención y supresión', 'Plazos de conservación, supresión y verificación de copias documentados.', false],
];
export function createEvidenceSeed(): Evidence[] { return definitions.map(([title, acceptanceCriterion, automatic], index) => ({ id: `evidence-${index + 1}`, title, acceptanceCriterion, automatic, status: 'pendiente', confirmed: false, responsible: '', date: '', note: '' })); }

import {
  inspectionApi,
  recordApi,
  RECORD_TYPE,
  type InspectionRecord,
} from './api';
import type { DefectRecord, ProcessQualityRecord } from '@/utils/analysisUtils';

export { RECORD_TYPE };

type FrontendDefect = {
  id?: string;
  location: string;
  defectName: string;
  defectCode?: string;
  category: string;
  quantity: number;
  scoreCategory?: string;
};

function countGrade(list: FrontendDefect[] | undefined, grade: string): number {
  if (!list) return 0;
  return list.filter((d) => d.category === grade).reduce((sum, d) => sum + (d.quantity || 1), 0);
}

function toDetails(list: FrontendDefect[] | undefined, module: string) {
  if (!list) return [];
  return list.map((d) => ({
    module,
    bodyPart: d.location,
    code: d.defectCode || '',
    name: d.defectName,
    grade: d.category,
    count: d.quantity || 1,
  }));
}

function fromDetails(record: InspectionRecord, module: string): DefectRecord[] {
  return (record.defectDetails || [])
    .filter((d) => d.module === module)
    .map((d) => ({
      location: d.bodyPart,
      defectName: d.name,
      category: d.grade,
      quantity: d.count || 1,
      scoreCategory: undefined,
    }));
}

export function buildInspectionSubmit(input: {
  date: string;
  shiftLabel: string;
  shiftNumber: string;
  machine: string;
  productionPoint: string;
  brand: string;
  sampleTime?: string;
  sampleTicketNo?: string;
  uploader: string;
  boxDefects?: FrontendDefect[];
  cartonDefects?: FrontendDefect[];
  packDefects?: FrontendDefect[];
  cigaretteDefects?: FrontendDefect[];
}) {
  return {
    date: input.date,
    shift: input.shiftLabel,
    machineId: input.machine,
    team: input.shiftNumber,
    partnerSite: input.productionPoint,
    brand: input.brand,
    sampleTime: input.sampleTime || '',
    sampleTicketNo: input.sampleTicketNo || '',
    uploader: input.uploader,
    cigaretteA: countGrade(input.cigaretteDefects, 'A'),
    cigaretteB: countGrade(input.cigaretteDefects, 'B'),
    cigaretteC: countGrade(input.cigaretteDefects, 'C'),
    cigaretteD: countGrade(input.cigaretteDefects, 'D'),
    boxSmallA: countGrade(input.packDefects, 'A'),
    boxSmallB: countGrade(input.packDefects, 'B'),
    boxSmallC: countGrade(input.packDefects, 'C'),
    boxSmallD: countGrade(input.packDefects, 'D'),
    cartonA: countGrade(input.cartonDefects, 'A'),
    cartonB: countGrade(input.cartonDefects, 'B'),
    cartonC: countGrade(input.cartonDefects, 'C'),
    cartonD: countGrade(input.cartonDefects, 'D'),
    caseAa: countGrade(input.boxDefects, 'A'),
    caseAb: countGrade(input.boxDefects, 'B'),
    caseAc: countGrade(input.boxDefects, 'C'),
    caseAd: countGrade(input.boxDefects, 'D'),
    defectDetails: [
      ...toDetails(input.boxDefects, 'case'),
      ...toDetails(input.cartonDefects, 'carton'),
      ...toDetails(input.packDefects, 'boxSmall'),
      ...toDetails(input.cigaretteDefects, 'cigarette'),
    ],
  };
}

export function inspectionToProcessRecord(record: InspectionRecord): ProcessQualityRecord {
  return {
    id: String(record.id),
    inspectionDate: record.date,
    productionPoint: record.partnerSite || '',
    brand: record.brand || '',
    machine: record.machineId,
    shiftGroup: record.shift,
    shift: record.team,
    inspector: record.uploader,
    batchNumber: record.sampleTicketNo || '',
    boxDefects: fromDetails(record, 'case'),
    cartonDefects: fromDetails(record, 'carton'),
    packDefects: fromDetails(record, 'boxSmall'),
    cigaretteDefects: fromDetails(record, 'cigarette'),
    createdAt: record.createdAt || record.uploadTime || '',
  };
}

export async function fetchProcessQualityRecords(): Promise<ProcessQualityRecord[]> {
  const rows = await inspectionApi.list();
  return rows.map(inspectionToProcessRecord);
}

export async function listTypedRecords<T extends { id?: string | number }>(type: string): Promise<T[]> {
  const rows = await recordApi.list(type);
  return rows.map((row) => {
    const payload = (row.payload || {}) as T;
    return { ...payload, id: String(row.id) };
  });
}

export async function createTypedRecord(type: string, payload: Record<string, unknown>, uploader?: string) {
  const { id: _omit, ...rest } = payload;
  return recordApi.create(type, rest, uploader);
}

export async function updateTypedRecord(id: string | number, payload: Record<string, unknown>) {
  const { id: _omit, ...rest } = payload;
  return recordApi.update(Number(id), rest);
}

export async function deleteTypedRecord(id: string | number) {
  return recordApi.delete(Number(id));
}

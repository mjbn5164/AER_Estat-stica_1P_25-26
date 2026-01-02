
export interface StudentData {
  numero: number;
  aluno: string;
  portugues: number;
  ingles: number;
  matematica: number;
  psicologia: number;
  quimica: number;
  educacaoFisica: number;
  emrc: number;
}

export interface SheetInfo {
  name: string;
  id: string;
}

export type SubjectKey = 'portugues' | 'ingles' | 'matematica' | 'psicologia' | 'quimica' | 'educacaoFisica' | 'emrc';

export interface GradeDistribution {
  range: string;
  count: number;
  chartValue: number;
  color: string;
}

export interface SubjectStats {
  subject: string;
  key: SubjectKey;
  avg: number;
  stdDev: number;
  max: number;
  min: number;
  count: number;
  countBelowTen: number;
  percentageBelowTen: number;
  distribution: GradeDistribution[];
  allGrades: number[];
}

export const SUBJECT_LABELS: Record<SubjectKey, string> = {
  portugues: 'Português',
  ingles: 'Inglês',
  matematica: 'Matemática',
  psicologia: 'Psicologia',
  quimica: 'Química',
  educacaoFisica: 'Educação Física',
  emrc: 'EMRC'
};

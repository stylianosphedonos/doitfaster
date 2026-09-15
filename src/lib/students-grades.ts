export interface GradeScore {
  earned: number;
  max: number;
  raw: string;
}

export interface StudentRow {
  id: string;
  name: string;
  grades: string[];
}

export interface GradeAverage {
  earned: number;
  max: number;
  percent: number | null;
  outOf20: number | null;
  display: string;
}

const GRADE_PATTERN = /(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/g;

export function parseGrade(raw: string): GradeScore | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const earned = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(earned) || !Number.isFinite(max) || max <= 0) {
    return null;
  }

  return { earned, max, raw: `${earned}/${max}` };
}

export function calculateAverage(grades: string[]): GradeAverage {
  let earned = 0;
  let max = 0;
  let count = 0;

  for (const grade of grades) {
    const parsed = parseGrade(grade);
    if (!parsed) continue;
    earned += parsed.earned;
    max += parsed.max;
    count += 1;
  }

  if (count === 0 || max <= 0) {
    return { earned: 0, max: 0, percent: null, outOf20: null, display: "—" };
  }

  const percent = (earned / max) * 100;
  const outOf20 = (earned / max) * 20;
  return {
    earned,
    max,
    percent,
    outOf20,
    display: `${formatNumber(earned)}/${formatNumber(max)} (${formatPercent(percent)}% · ${formatOutOf20(outOf20)}/20)`,
  };
}

export function formatPercent(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function formatOutOf20(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value);
}

export function createStudentId(): string {
  return `student-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createEmptyStudent(gradeCount = 1): StudentRow {
  return {
    id: createStudentId(),
    name: "",
    grades: Array.from({ length: Math.max(gradeCount, 1) }, () => ""),
  };
}

/** Parse a text/CSV upload: name first, then grades like 10/10, 20/20 on the same line. */
export function parseStudentsUpload(text: string): StudentRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const students: StudentRow[] = [];

  for (const line of lines) {
    const grades: string[] = [];
    let nameEnd = line.length;

    GRADE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = GRADE_PATTERN.exec(line)) !== null) {
      if (grades.length === 0) {
        nameEnd = match.index;
      }
      grades.push(`${match[1]}/${match[2]}`);
    }

    const name = line
      .slice(0, nameEnd)
      .replace(/[\s,;|\t]+$/g, "")
      .trim();

    if (!name && grades.length === 0) continue;

    students.push({
      id: createStudentId(),
      name,
      grades: grades.length > 0 ? grades : [""],
    });
  }

  return normalizeGradeColumns(students);
}

export function normalizeGradeColumns(students: StudentRow[]): StudentRow[] {
  const maxGrades = Math.max(1, ...students.map((s) => s.grades.length));
  return students.map((student) => ({
    ...student,
    grades: Array.from({ length: maxGrades }, (_, i) => student.grades[i] ?? ""),
  }));
}

export function padStudentsToGradeCount(
  students: StudentRow[],
  gradeCount: number
): StudentRow[] {
  const count = Math.max(1, gradeCount);
  return students.map((student) => ({
    ...student,
    grades: Array.from({ length: count }, (_, i) => student.grades[i] ?? ""),
  }));
}

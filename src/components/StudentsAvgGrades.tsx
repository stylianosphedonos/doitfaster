"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { downloadStudentsGradesExcel } from "@/lib/students-grades-excel";
import { translateForm } from "@/lib/i18n";
import {
  calculateAverage,
  createEmptyStudent,
  padStudentsToGradeCount,
  parseGrade,
  parseStudentsUpload,
  type StudentRow,
} from "@/lib/students-grades";
import type { FormComponent } from "@/lib/types";

interface StudentsAvgGradesProps {
  form: FormComponent;
}

export function StudentsAvgGrades({ form: rawForm }: StudentsAvgGradesProps) {
  const { locale, t } = useLocale();
  const form = useMemo(() => translateForm(rawForm, locale), [rawForm, locale]);
  const strings = t.templates.studentsAvgGrades;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [students, setStudents] = useState<StudentRow[]>(() => [
    createEmptyStudent(3),
  ]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const gradeCount = useMemo(
    () => Math.max(1, ...students.map((s) => s.grades.length)),
    [students]
  );

  function setStudentsSafe(next: StudentRow[]) {
    setStudents(padStudentsToGradeCount(next, Math.max(1, ...next.map((s) => s.grades.length))));
  }

  function handleNew() {
    setError("");
    setInfo("");
    setStudents([createEmptyStudent(3)]);
  }

  function handleAddStudent() {
    setStudents((current) => [...current, createEmptyStudent(gradeCount)]);
  }

  function handleAddGradeColumn() {
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        grades: [...student.grades, ""],
      }))
    );
  }

  function handleRemoveGradeColumn(index: number) {
    if (gradeCount <= 1) return;
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        grades: student.grades.filter((_, i) => i !== index),
      }))
    );
  }

  function updateStudent(id: string, updates: Partial<StudentRow>) {
    setStudents((current) =>
      current.map((student) =>
        student.id === id ? { ...student, ...updates } : student
      )
    );
  }

  function updateGrade(id: string, index: number, value: string) {
    setStudents((current) =>
      current.map((student) => {
        if (student.id !== id) return student;
        const grades = [...student.grades];
        grades[index] = value;
        return { ...student, grades };
      })
    );
  }

  function removeStudent(id: string) {
    setStudents((current) => {
      const next = current.filter((student) => student.id !== id);
      return next.length > 0 ? next : [createEmptyStudent(gradeCount)];
    });
  }

  async function handleUpload(file: File | null) {
    if (!file) return;
    setError("");
    setInfo("");

    try {
      const text = await file.text();
      const parsed = parseStudentsUpload(text);
      if (parsed.length === 0) {
        setError(strings.uploadEmpty);
        return;
      }
      setStudentsSafe(parsed);
      setInfo(strings.uploadSuccess.replace("{count}", String(parsed.length)));
    } catch {
      setError(strings.uploadFailed);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleExport() {
    const exportable = students.filter(
      (student) =>
        student.name.trim() ||
        student.grades.some((grade) => parseGrade(grade) !== null)
    );

    if (exportable.length === 0) {
      setError(strings.exportEmpty);
      return;
    }

    setError("");
    downloadStudentsGradesExcel(exportable, "students-avg-grades.xls");
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white text-black text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{form.icon}</span>
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">
                {form.title}
              </h1>
              {form.description && (
                <p className="mt-1 text-sm text-zinc-500">{form.description}</p>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-zinc-500 max-w-2xl">
            {strings.hint}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleNew}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {strings.newList}
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {strings.upload}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.csv,.tsv,text/plain,text/csv"
            className="hidden"
            onChange={(e) => handleUpload(e.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            onClick={handleExport}
            className="px-3 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            {strings.exportExcel}
          </button>
        </div>
      </div>

      {(error || info) && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || info}
        </div>
      )}

      <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="text-left font-medium text-zinc-600 px-4 py-3 whitespace-nowrap">
                  {strings.name}
                </th>
                {Array.from({ length: gradeCount }, (_, index) => (
                  <th
                    key={index}
                    className="text-left font-medium text-zinc-600 px-4 py-3 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <span>
                        {strings.grade} {index + 1}
                      </span>
                      {gradeCount > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveGradeColumn(index)}
                          className="text-xs text-zinc-400 hover:text-red-500"
                          aria-label={strings.removeGrade}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="text-left font-medium text-zinc-600 px-4 py-3 whitespace-nowrap">
                  {strings.average}
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {students.map((student) => {
                const average = calculateAverage(student.grades);
                return (
                  <tr
                    key={student.id}
                    className="border-b border-zinc-100 last:border-b-0"
                  >
                    <td className="px-4 py-3 min-w-[180px]">
                      <input
                        type="text"
                        value={student.name}
                        onChange={(e) =>
                          updateStudent(student.id, { name: e.target.value })
                        }
                        placeholder={strings.namePlaceholder}
                        className={inputClass}
                      />
                    </td>
                    {Array.from({ length: gradeCount }, (_, index) => {
                      const value = student.grades[index] ?? "";
                      const invalid = value.trim() !== "" && !parseGrade(value);
                      return (
                        <td key={index} className="px-4 py-3 min-w-[120px]">
                          <input
                            type="text"
                            value={value}
                            onChange={(e) =>
                              updateGrade(student.id, index, e.target.value)
                            }
                            placeholder={strings.gradePlaceholder}
                            className={`${inputClass} ${
                              invalid
                                ? "border-red-300 focus:border-red-400 focus:ring-red-200"
                                : ""
                            }`}
                          />
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-zinc-800">
                      {average.display}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => removeStudent(student.id)}
                        className="text-zinc-300 hover:text-red-500 transition-colors"
                        aria-label={strings.removeStudent}
                      >
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2 px-4 py-4 border-t border-zinc-100 bg-zinc-50/60">
          <button
            type="button"
            onClick={handleAddStudent}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {strings.addStudent}
          </button>
          <button
            type="button"
            onClick={handleAddGradeColumn}
            className="px-3 py-2 rounded-lg border border-zinc-200 bg-white text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            {strings.addGrade}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-500">
        <p className="font-medium text-zinc-700 mb-1">{strings.exampleTitle}</p>
        <pre className="whitespace-pre-wrap font-mono text-xs text-zinc-600">
          {strings.exampleBody}
        </pre>
      </div>
    </div>
  );
}

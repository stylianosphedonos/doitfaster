import {
  calculateAverage,
  formatPercent,
  parseGrade,
  type StudentRow,
} from "./students-grades";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function cell(value: string, type: "String" | "Number" = "String"): string {
  return `<Cell><Data ss:Type="${type}">${escapeXml(value)}</Data></Cell>`;
}

export function buildStudentsGradesExcelXml(students: StudentRow[]): string {
  const gradeCount = Math.max(1, ...students.map((s) => s.grades.length));

  const headerCells = [
    cell("Name"),
    ...Array.from({ length: gradeCount }, (_, i) => cell(`Grade ${i + 1}`)),
    cell("Total"),
    cell("Average %"),
  ].join("");

  const rowsXml = students
    .map((student) => {
      const average = calculateAverage(student.grades);
      const gradeCells = Array.from({ length: gradeCount }, (_, i) => {
        const raw = student.grades[i] ?? "";
        const parsed = parseGrade(raw);
        return cell(parsed?.raw ?? raw);
      }).join("");

      return `<Row>${[
        cell(student.name),
        gradeCells,
        cell(
          average.percent === null
            ? ""
            : `${average.earned}/${average.max}`
        ),
        average.percent === null
          ? cell("")
          : cell(formatPercent(average.percent), "Number"),
      ].join("")}</Row>`;
    })
    .join("");

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Students AVG Grades">
  <Table>
   <Row>${headerCells}</Row>
   ${rowsXml}
  </Table>
 </Worksheet>
</Workbook>`;
}

export function downloadStudentsGradesExcel(
  students: StudentRow[],
  filename = "students-avg-grades.xls"
): void {
  const xml = buildStudentsGradesExcelXml(students);
  const blob = new Blob([xml], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

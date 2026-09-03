"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { PageHeader, Card, Button, Badge, KPICard, DataTable } from "@kannan19302/ui";
import { BookOpen, Award, Save, Users } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

export default function GradeBookPage() {
  const client = useApiClient();
  const [courses, setCourses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [grades, setGrades] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const [cRes, sRes] = await Promise.all([
          client.get<any[]>("/ext/education/deep/courses"),
          client.get<any[]>("/ext/education/deep/students"),
        ]);
        const cList = Array.isArray(cRes) ? cRes : [];
        const sList = Array.isArray(sRes) ? sRes : [];
        setCourses(cList);
        setStudents(sList);
        if (cList.length > 0 && cList[0]?.id) {
          setSelectedCourse(cList[0].id);
        }
      } catch {
        setCourses([]);
        setStudents([]);
      }
    }
    loadData();
  }, [client]);

  const assessments = ["Quiz 1", "Midterm", "Quiz 2", "Assignment", "Final"];

  const getGrade = (studentId: string, assessment: string): number => {
    return grades[studentId]?.[assessment] ?? 0;
  };

  const setGradeValue = (
    studentId: string,
    assessment: string,
    value: number,
  ) => {
    setGrades((prev: any) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {}), [assessment]: value },
    }));
  };

  const getAverage = (studentId: string): number => {
    const vals = assessments
      .map((a: any) => getGrade(studentId, a))
      .filter((v: any) => v > 0);
    return vals.length > 0
      ? Math.round(vals.reduce((a: any, b: any) => a + b, 0) / vals.length)
      : 0;
  };

  const getLetterGrade = (avg: number): string => {
    if (avg >= 90) return "A";
    if (avg >= 80) return "B";
    if (avg >= 70) return "C";
    if (avg >= 60) return "D";
    return avg > 0 ? "F" : "—";
  };

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Grade Book"
        description="Spreadsheet-style grade entry per course and student"
        actions={
          <Button variant="primary">
            <Save size={14} className="mr-2" /> Save Grades
          </Button>
        }
      />
      <div className="ui-grid-auto-sm">
        <KPICard
          title="Students"
          value={students.length}
          icon={<Users size={18} />}
          color="var(--color-primary)"
        />
        <KPICard
          title="Assessments"
          value={assessments.length}
          icon={<BookOpen size={18} />}
          color="var(--color-info)"
        />
        <KPICard
          title="Class Average"
          value={`${students.length > 0 ? Math.round(students.map((s: any) => getAverage(s.id)).reduce((a: any, b: any) => a + b, 0) / students.length) : 0}%`}
          icon={<Award size={18} />}
          color="var(--color-success)"
        />
      </div>

      <Card>
        <div className={styles.s1}>
          {courses.length === 0 ? (
            <p className="ui-text-muted">No courses registered.</p>
          ) : (
            courses.map((c: any) => (
              <button
                key={c.id}
                onClick={() => setSelectedCourse(c.id)}
                style={{
                  borderColor:
                    selectedCourse === c.id
                      ? "var(--color-primary)"
                      : "var(--color-border)",
                  background:
                    selectedCourse === c.id
                      ? "var(--color-primary-light)"
                      : "var(--color-bg)",
                  color:
                    selectedCourse === c.id
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                }}
                className={styles.s2}
              >
                {c.code || c.name}
              </button>
            ))
          )}
        </div>
      </Card>

      <Card>
        <div className={styles.s3}>
          {(() => {
            const columns = [
              {
                key: "student",
                header: "Student",
                render: (student: any) => (
                  <>
                    <div className="font-medium">{student.name}</div>
                    <div className="ui-text-xs-tertiary">{student.roll || student.enrollmentNumber}</div>
                  </>
                ),
              },
              ...assessments.map((a: any) => ({
                key: a,
                header: a,
                render: (student: any) => (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={getGrade(student.id, a) || ""}
                    onChange={(e: any) =>
                      setGradeValue(student.id, a, Number(e.target.value))
                    }
                    className={styles.s4}
                  />
                ),
              })),
              {
                key: "average",
                header: "Average",
                render: (student: any) => {
                  const avg = getAverage(student.id);
                  return (
                    <span className="font-semibold">{avg > 0 ? `${avg}%` : "—"}</span>
                  );
                },
              },
              {
                key: "grade",
                header: "Grade",
                render: (student: any) => {
                  const letter = getLetterGrade(getAverage(student.id));
                  return (
                    <Badge
                      variant={
                        letter === "A"
                          ? "success"
                          : letter === "B"
                            ? "info"
                            : letter === "C"
                              ? "warning"
                              : letter === "D" || letter === "F"
                                ? "danger"
                                : "default"
                      }
                    >
                      {letter}
                    </Badge>
                  );
                },
              },
            ];
            return (
              <DataTable
                columns={columns}
                data={students}
                rowKey={(student: any) => student.id}
              />
            );
          })()}
        </div>
      </Card>
    </div>
  );
}

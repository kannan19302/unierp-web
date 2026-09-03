"use client";
import styles from "./page.module.css";
import React, { useState, useEffect } from "react";
import { PageHeader, Card, Button, Badge, KPICard, DashboardChart } from "@kannan19302/ui";
import { ClipboardCheck, Users, Calendar, CheckCircle, X } from "lucide-react";
import { useApiClient } from "@kannan19302/framework";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export default function AttendancePage() {
  const client = useApiClient();
  const [students, setStudents] = useState<any[]>([]);

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0] || "",
  );
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function loadData() {
      try {
        const sRes = await client.get<any[]>("/ext/education/deep/students");
        const sList = Array.isArray(sRes) ? sRes : [];
        setStudents(sList);
        setAttendance(Object.fromEntries(sList.map((s: any) => [s.id, true])));
      } catch {
        setStudents([]);
      }
    }
    loadData();
  }, [client]);

  const presentCount = Object.values(attendance).filter(Boolean).length;
  const absentCount = Math.max(0, students.length - presentCount);
  const attendanceRate = students.length > 0
    ? Math.round((presentCount / students.length) * 100)
    : 0;

  const weeklyData = WEEKDAYS.map((day: any) => ({
    name: day,
    present: presentCount,
    absent: absentCount,
  }));

  return (
    <div className="ui-stack-6">
      <PageHeader
        title="Attendance"
        description="Daily attendance marking and reports"
        actions={<Button variant="primary">Save Attendance</Button>}
      />

      <div className="ui-grid-auto-sm">
        <KPICard
          title="Present Today"
          value={presentCount}
          icon={<CheckCircle size={18} />}
          color="var(--color-success)"
        />
        <KPICard
          title="Absent Today"
          value={absentCount}
          icon={<X size={18} />}
          color="var(--color-danger)"
        />
        <KPICard
          title="Attendance Rate"
          value={`${attendanceRate}%`}
          icon={<ClipboardCheck size={18} />}
          color="var(--color-primary)"
        />
        <KPICard
          title="Total Students"
          value={students.length}
          icon={<Users size={18} />}
          color="var(--color-info)"
        />
      </div>

      <Card>
        <div className={styles.s1}>
          <Calendar size={18} className="ui-text-tertiary" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e: any) => setSelectedDate(e.target.value)}
            className={styles.s2}
          />
          <span className="ui-text-sm-muted">
            {new Date(selectedDate || "").toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="ui-heading-base mb-4">Mark Attendance</h3>
          <div className="ui-stack-2">
            {students.length === 0 ? (
              <p className="ui-text-muted">No students enrolled.</p>
            ) : (
              students.map((student: any) => (
                <div
                  key={student.id}
                  style={{
                    background: attendance[student.id]
                      ? "var(--color-success-light)"
                      : "var(--color-danger-light)",
                    border: `1px solid ${attendance[student.id] ? "var(--color-success)" : "var(--color-danger)"}`,
                  }}
                  className={styles.s3}
                >
                  <div className="ui-hstack-3">
                    <div className={styles.s4}>
                      {(student.name || "S")
                        .split(" ")
                        .map((n: any) => n[0])
                        .join("")}
                    </div>
                    <div>
                      <div className={styles.s5}>{student.name}</div>
                      <div className="ui-text-xs-tertiary">{student.roll || student.enrollmentNumber}</div>
                    </div>
                  </div>
                  <div className="ui-flex ui-gap-2">
                    <button
                      onClick={() =>
                        setAttendance((p: any) => ({ ...p, [student.id]: true }))
                      }
                      style={{
                        borderColor: attendance[student.id]
                          ? "var(--color-success)"
                          : "var(--color-border)",
                        background: attendance[student.id]
                          ? "var(--color-success)"
                          : "var(--color-bg)",
                        color: attendance[student.id]
                          ? "white"
                          : "var(--color-text)",
                      }}
                      className={styles.s6}
                    >
                      Present
                    </button>
                    <button
                      onClick={() =>
                        setAttendance((p: any) => ({ ...p, [student.id]: false }))
                      }
                      style={{
                        borderColor: !attendance[student.id]
                          ? "var(--color-danger)"
                          : "var(--color-border)",
                        background: !attendance[student.id]
                          ? "var(--color-danger)"
                          : "var(--color-bg)",
                        color: !attendance[student.id]
                          ? "white"
                          : "var(--color-text)",
                      }}
                      className={styles.s6}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      <DashboardChart
        title="Weekly Attendance"
        subtitle="Attendance pattern this week"
        data={weeklyData}
        config={{
          xAxisKey: "name",
          series: [
            { dataKey: "present", name: "Present", color: "var(--chart-2)" },
            { dataKey: "absent", name: "Absent", color: "var(--chart-4)" },
          ],
        }}
        defaultChartType="bar"
        allowedChartTypes={["bar", "area"]}
        height={260}
      />
    </div>
  );
}

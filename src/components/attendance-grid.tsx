"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { upsertRecord } from "@/lib/actions/attendance";
import { formatAttendanceValue, parseAttendanceInput } from "@/lib/attendance-parse";
import { ConfirmModal } from "@/components/confirm-modal";
import { db } from "@/lib/offline/db";
import { enqueueAction, pullAsistenciaData } from "@/lib/offline/sync-engine";
import { moduleColor } from "@/lib/module-colors";
import { SendRubroReportButton } from "@/components/send-rubro-report-button";
import type { AttendanceRecord, AttendanceSession, Student } from "@/lib/types";

type Pending = { sessionId: string; studentId: string; raw: string; lecciones: number };

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function monthKey(fecha: string) {
  return fecha.slice(0, 7); // "YYYY-MM"
}

function monthLabel(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${MESES[m - 1]} ${y}`;
}

function todayMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function AttendanceGrid({
  sectionId,
  students,
  sessions,
  records,
  asistenciaPct,
  advertenciaPct,
  limitePct,
}: {
  sectionId: string;
  students: Student[];
  sessions: AttendanceSession[];
  records: AttendanceRecord[];
  asistenciaPct: number;
  advertenciaPct?: number | null;
  limitePct?: number | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const r of records) map[`${r.session_id}:${r.student_id}`] = formatAttendanceValue(r);
    return map;
  });
  const lastConfirmed = useRef<Record<string, string>>(values);
  const [pending, setPending] = useState<Pending | null>(null);
  const [savedFlags, setSavedFlags] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (navigator.onLine) pullAsistenciaData(sectionId).catch(() => {});
  }, [sectionId]);

  const monthKeys = useMemo(() => {
    const set = new Set(sessions.map((s) => monthKey(s.fecha)));
    return [...set].sort();
  }, [sessions]);

  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const today = todayMonthKey();
    if (monthKeys.includes(today)) return today;
    return monthKeys[monthKeys.length - 1] ?? "all";
  });

  const visibleSessions =
    selectedMonth === "all" ? sessions : sessions.filter((s) => monthKey(s.fecha) === selectedMonth);

  function updateScrollButtons() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    updateScrollButtons();
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, visibleSessions.length]);

  function scrollByAmount(amount: number) {
    scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }

  const totalLecciones = sessions.reduce((sum, s) => sum + s.lecciones_impartidas, 0);

  function key(sessionId: string, studentId: string) {
    return `${sessionId}:${studentId}`;
  }

  function getValue(sessionId: string, studentId: string) {
    return values[key(sessionId, studentId)] ?? "";
  }

  function isSaved(sessionId: string, studentId: string) {
    return !!savedFlags[key(sessionId, studentId)];
  }

  function markSaved(k: string) {
    setSavedFlags((prev) => ({ ...prev, [k]: true }));
    setTimeout(() => {
      setSavedFlags((prev) => ({ ...prev, [k]: false }));
    }, 1500);
  }

  function handleChange(sessionId: string, studentId: string, raw: string) {
    setValues((prev) => ({ ...prev, [key(sessionId, studentId)]: raw }));
  }

  function commit(sessionId: string, studentId: string, raw: string) {
    const k = key(sessionId, studentId);
    lastConfirmed.current = { ...lastConfirmed.current, [k]: raw };
    startTransition(async () => {
      if (navigator.onLine) {
        try {
          await upsertRecord(sectionId, sessionId, studentId, raw);
          markSaved(k);
          return;
        } catch {
          // wifi intermitente: cae al camino offline igual
        }
      }
      const { ausencias, justificada, tardia } = parseAttendanceInput(raw);
      await db.attendanceRecords.put({
        session_id: sessionId,
        student_id: studentId,
        ausencias,
        justificada,
        tardia,
      });
      await enqueueAction(
        "asistencia.upsertRecord",
        [sectionId, sessionId, studentId, raw],
        sectionId,
      );
      markSaved(k);
    });
  }

  function applyToAll(sessionId: string, studentIds: string[], raw: string) {
    setValues((prev) => {
      const next = { ...prev };
      for (const studentId of studentIds) next[key(sessionId, studentId)] = raw;
      return next;
    });
    for (const studentId of studentIds) commit(sessionId, studentId, raw);
  }

  function handleBlur(sessionId: string, studentId: string, raw: string, lecciones: number) {
    const { ausencias } = parseAttendanceInput(raw);
    if (ausencias > lecciones) {
      setPending({ sessionId, studentId, raw, lecciones });
      return;
    }
    commit(sessionId, studentId, raw);
  }

  function confirmPending() {
    if (!pending) return;
    commit(pending.sessionId, pending.studentId, pending.raw);
    setPending(null);
  }

  function cancelPending() {
    if (!pending) return;
    const k = key(pending.sessionId, pending.studentId);
    setValues((prev) => ({ ...prev, [k]: lastConfirmed.current[k] ?? "" }));
    setPending(null);
  }

  if (sessions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-zinc-300 px-5 py-10 text-center text-sm text-zinc-400">
        Agrega al menos una fecha de clase para poder registrar asistencia.
      </p>
    );
  }

  const color = moduleColor("asistencia");

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500">
          Por defecto, todos los estudiantes están <strong>presentes</strong> — deja la casilla
          vacía. Solo escribe algo si el estudiante estuvo ausente: el número de lecciones
          ausentes (ej. <code>2</code>), agrega <code>j</code> si la ausencia está justificada
          (ej. <code>2j</code>, no resta), o <code>t</code> para marcar una tardía (ej.{" "}
          <code>1t</code>).
        </p>
        {monthKeys.length > 1 && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs font-medium text-zinc-600">Mostrar mes:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-xs"
            >
              {monthKeys.map((mk) => (
                <option key={mk} value={mk}>
                  {monthLabel(mk)}
                </option>
              ))}
              <option value="all">Todo el periodo ({sessions.length} fechas)</option>
            </select>
          </div>
        )}
      </div>

      {(canScrollLeft || canScrollRight) && (
        <div className="mb-1.5 flex items-center gap-2 text-xs text-zinc-500">
          <button
            type="button"
            onClick={() => scrollByAmount(-300)}
            disabled={!canScrollLeft}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            ◀ Anterior
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(300)}
            disabled={!canScrollRight}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-40"
          >
            Siguiente ▶
          </button>
          <span>Hay más fechas — desliza o usa estos botones para verlas todas.</span>
        </div>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className="overflow-x-auto rounded-lg border border-zinc-200 bg-white"
      >
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="sticky left-0 bg-zinc-50 px-4 py-2 text-left">Estudiante</th>
              {visibleSessions.map((s) => (
                <th key={s.id} className="px-2 py-2 text-center">
                  {s.fecha}
                  <div className="font-normal normal-case text-zinc-400">
                    {s.lecciones_impartidas} lecc.
                  </div>
                  {students.length > 0 && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() =>
                        applyToAll(
                          s.id,
                          students.map((st) => st.id),
                          getValue(s.id, students[0].id),
                        )
                      }
                      className="mt-0.5 block w-full text-[10px] font-normal normal-case text-zinc-400 hover:text-teal-700 hover:underline"
                    >
                      aplicar a todos
                    </button>
                  )}
                </th>
              ))}
              <th className="px-3 py-2 text-center">% Asistencia</th>
              <th className="px-3 py-2 text-center">% aporte</th>
              <th className="no-print px-3 py-2 text-center">Reporte</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {students.map((s) => {
              const ausenciasEfectivas = sessions.reduce((sum, session) => {
                const raw = getValue(session.id, s.id);
                const parsed = parseAttendanceInput(raw);
                return sum + (parsed.justificada ? 0 : parsed.ausencias);
              }, 0);
              const pct =
                totalLecciones > 0
                  ? Math.max(0, 1 - ausenciasEfectivas / totalLecciones)
                  : 1;
              const nota = pct * 100;
              const aporte = nota * asistenciaPct;
              const ausenciasPct = 100 - nota;
              const alertStatus: "rojo" | "amarillo" | "normal" =
                limitePct != null && ausenciasPct >= limitePct * 100
                  ? "rojo"
                  : advertenciaPct != null && ausenciasPct >= advertenciaPct * 100
                    ? "amarillo"
                    : "normal";
              const nameBg =
                alertStatus === "rojo"
                  ? "bg-red-50"
                  : alertStatus === "amarillo"
                    ? "bg-amber-50"
                    : "bg-white";
              const pctCellStyle =
                alertStatus === "rojo"
                  ? "bg-red-100 font-semibold text-red-700"
                  : alertStatus === "amarillo"
                    ? "bg-amber-100 font-semibold text-amber-700"
                    : "text-zinc-700";
              return (
                <tr key={s.id}>
                  <td
                    className={`sticky left-0 whitespace-nowrap px-4 py-1.5 font-medium text-zinc-900 ${nameBg}`}
                    title={
                      alertStatus === "rojo"
                        ? `Superó el límite de ausencias (${ausenciasPct.toFixed(1)}%)`
                        : alertStatus === "amarillo"
                          ? `Se acerca al límite de ausencias (${ausenciasPct.toFixed(1)}%)`
                          : undefined
                    }
                  >
                    {alertStatus !== "normal" && (
                      <span
                        aria-hidden
                        className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                          alertStatus === "rojo" ? "bg-red-500" : "bg-amber-400"
                        }`}
                      />
                    )}
                    {s.primer_apellido} {s.segundo_apellido} {s.nombre}
                  </td>
                  {visibleSessions.map((session) => {
                    const isSuspect =
                      pending?.sessionId === session.id && pending.studentId === s.id;
                    const justSaved = isSaved(session.id, s.id);
                    return (
                      <td key={session.id} className={`px-2 py-1.5 text-center ${color.cellBg}`}>
                        <input
                          type="text"
                          value={getValue(session.id, s.id)}
                          onChange={(e) => handleChange(session.id, s.id, e.target.value)}
                          onBlur={(e) =>
                            handleBlur(session.id, s.id, e.target.value, session.lecciones_impartidas)
                          }
                          disabled={isPending}
                          placeholder="✓"
                          title="Vacío = presente"
                          className={`w-14 rounded-md border px-2 py-1 text-center text-sm text-zinc-900 transition-colors ${
                            isSuspect
                              ? "border-amber-400 ring-1 ring-amber-300"
                              : justSaved
                                ? "border-emerald-400 ring-1 ring-emerald-200"
                                : "border-zinc-300"
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td className={`px-3 py-1.5 text-center ${pctCellStyle}`}>{nota.toFixed(1)}</td>
                  <td className="px-3 py-1.5 text-center text-zinc-700">{aporte.toFixed(1)}</td>
                  <td className="no-print px-3 py-1.5 text-center">
                    <SendRubroReportButton
                      sectionId={sectionId}
                      studentId={s.id}
                      modulo="asistencia"
                      hasEmail={!!s.contacto_correo}
                    />
                  </td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={visibleSessions.length + 4} className="px-4 py-6 text-center text-zinc-400">
                  No hay estudiantes activos en esta sección.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-xs text-zinc-400">
        % Asistencia y % aporte siempre se calculan con las {sessions.length} fecha
        {sessions.length === 1 ? "" : "s"} del periodo completo, aunque estés viendo un solo mes.
      </p>

      <ConfirmModal
        open={!!pending}
        title="Ausencias mayores a las lecciones del día"
        description={
          pending
            ? `Ese día se impartieron ${pending.lecciones} lección(es), pero registraste "${pending.raw}". ¿Confirmas que no fue un error de tipeo?`
            : ""
        }
        onConfirm={confirmPending}
        onCancel={cancelPending}
      />
    </div>
  );
}

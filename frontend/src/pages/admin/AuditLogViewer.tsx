import { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";

// ─── Types ──────────────────────────────────────────────────────────────────
export interface AuditLogEntry {
  id: string;
  action: string;
  actorId: string;
  ip: string;
  timestamp: string;
  hmacValid: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACTION_STYLES: Record<string, { bg: string; text: string; label?: string }> = {
  LOGIN_FAIL:    { bg: "bg-[#FCE4D6]", text: "text-[#C00000]" },
  LOGIN_SUCCESS: { bg: "bg-[#E2EFDA]", text: "text-[#375623]" },
  LOGIN_OK:      { bg: "bg-[#E2EFDA]", text: "text-[#375623]" },
  LOGOUT:        { bg: "bg-[#E2EFDA]", text: "text-[#375623]" },
  UPDATE_ROLE:   { bg: "bg-purple-100",  text: "text-purple-800" },
  ROLE_CHANGE:   { bg: "bg-purple-100",  text: "text-purple-800" },
  EXAM_SUBMIT:   { bg: "bg-blue-100",    text: "text-blue-800" },
  SUBMIT_EXAM:   { bg: "bg-blue-100",    text: "text-blue-800" },
  UPDATE_GRADE:  { bg: "bg-[#FFEAD7]",  text: "text-[#C55A11]" },
  GRADE_UPDATE:  { bg: "bg-[#FFEAD7]",  text: "text-[#C55A11]" },
  ANTICHEAT:     { bg: "bg-[#FCE4D6]",  text: "text-[#C00000]" },
  FILE_UPLOAD:   { bg: "bg-blue-100",    text: "text-blue-800" },
  COURSE_CREATE: { bg: "bg-indigo-100",  text: "text-indigo-800" },
  ENROLL_COURSE: { bg: "bg-indigo-100",  text: "text-indigo-800" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function ActionTag({ action }: { action: string }) {
  const style = ACTION_STYLES[action] ?? { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${style.bg} ${style.text}`}>
      {action}
    </span>
  );
}

function IntegrityBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-[#E2EFDA] text-[#375623]">
        🔒 HMAC Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold bg-[#FCE4D6] text-[#C00000]">
      ⚠ Tampered
    </span>
  );
}

// ─── Filters ─────────────────────────────────────────────────────────────────

const ALL_ACTIONS = ["ALL", ...Object.keys(ACTION_STYLES)];

// ─── Page Component ──────────────────────────────────────────────────────────

export default function AuditLogViewer() {
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await apiClient.get('/admin/audit-logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = logs.filter((log) => {
    const actionKey = log.action;
    const matchAction = filterAction === "ALL" || actionKey === filterAction;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      log.actorId.toLowerCase().includes(q) ||
      log.ip.includes(q) ||
      log.id.toLowerCase().includes(q);
    return matchAction && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 font-[Inter,sans-serif]">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1F3864]">Nhật ký Kiểm toán</h1>
        <p className="mt-1 text-sm text-[#595959]">
          Audit Log bất biến — mọi bản ghi được ký HMAC-SHA256 và không thể chỉnh sửa.
        </p>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <input
          type="text"
          placeholder="Tìm Actor ID, IP, Log ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1F3864] shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2E75B6] sm:w-72"
        />
        {/* Action Filter */}
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-[#1F3864] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2E75B6]"
        >
          {ALL_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a === "ALL" ? "Tất cả sự kiện" : a}
            </option>
          ))}
        </select>
      </div>

      {/* Table Card */}
      <div
        className="w-full overflow-hidden rounded-2xl bg-white shadow-sm"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            {/* Header */}
            <thead>
              <tr className="bg-[#F8F9FA]">
                {["Log ID", "Thời gian", "Actor ID", "Sự kiện", "IP Address", "Toàn vẹn"].map((h) => (
                  <th
                    key={h}
                    className="whitespace-nowrap px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-[#595959]"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-sm text-gray-400">
                    Không tìm thấy bản ghi nào.
                  </td>
                </tr>
              ) : (
                filtered.map((log) => (
                  <tr
                    key={log.id}
                    className="transition-colors hover:bg-[#F8F9FA]"
                  >
                    <td className="px-5 py-4 font-mono text-xs text-gray-500">
                      {log.id}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-[#1F3864]">
                      {log.timestamp}
                    </td>
                    <td className="px-5 py-4 font-medium text-[#1F3864]">
                      {log.actorId}
                    </td>
                    <td className="px-5 py-4">
                      <ActionTag action={log.action} />
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-[#595959]">
                      {log.ip}
                    </td>
                    <td className="px-5 py-4">
                      <IntegrityBadge verified={log.hmacVerified} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-400">
          Hiển thị {filtered.length} / {logs.length} bản ghi
        </div>
      </div>
    </div>
  );
}

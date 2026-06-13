import React, { useState } from 'react';

// --- Kiểu dữ liệu Submission ---
type GradingStatus = 'pending' | 'graded' | 'overdue';

type Submission = {
  id: string;
  studentName: string;
  studentId: string;          // UserID - từ JWT Claims phía server khi nộp bài
  assignmentName: string;
  courseCode: string;
  submittedAt: string;
  gradingStatus: GradingStatus;
  score?: number;             // null nếu chưa chấm
  /**
   * BR-16: MIME Validation - Server đã kiểm tra Magic Bytes của file thực tế,
   * không tin tưởng Content-Type header từ client.
   */
  mimeValidated: boolean;
  /**
   * BR-17: Anti-Malware Scan - File đã được quét qua ClamAV.
   * Status: 'clean' | 'infected' | 'pending_scan'
   */
  virusScanStatus: 'clean' | 'infected' | 'pending_scan';
  fileSize: string;
  isOverdue: boolean;
};

// --- Dữ liệu mô phỏng bài nộp ---
// Trong thực tế: GET /api/instructor/submissions?instructorId=<từ JWT Claims>
// UserID của instructor KHÔNG được lấy từ URL (chống IDOR - Section 2.2)
const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 'sub-001', studentName: 'Trần Minh Khoa', studentId: 'SV-00142',
    assignmentName: 'Phân tích mã độc WannaCry', courseCode: 'ATTT-401',
    submittedAt: '09/06/2026 14:23', gradingStatus: 'pending', score: undefined,
    mimeValidated: true, virusScanStatus: 'clean', fileSize: '2.4 MB', isOverdue: false,
  },
  {
    id: 'sub-002', studentName: 'Nguyễn Thị Lan', studentId: 'SV-00099',
    assignmentName: 'Triển khai RSA từ đầu', courseCode: 'MMA-302',
    submittedAt: '09/06/2026 11:05', gradingStatus: 'pending', score: undefined,
    mimeValidated: true, virusScanStatus: 'clean', fileSize: '1.1 MB', isOverdue: false,
  },
  {
    id: 'sub-003', studentName: 'Lê Thu Hà', studentId: 'SV-00088',
    assignmentName: 'Báo cáo lỗ hổng SQL Injection', courseCode: 'ATTT-401',
    submittedAt: '05/06/2026 09:40', gradingStatus: 'overdue', score: undefined,
    mimeValidated: true, virusScanStatus: 'clean', fileSize: '845 KB', isOverdue: true,
  },
  {
    id: 'sub-004', studentName: 'Phạm Quốc Bảo', studentId: 'SV-00205',
    assignmentName: 'Lab: Buffer Overflow Attack', courseCode: 'ATTT-401',
    submittedAt: '08/06/2026 23:59', gradingStatus: 'graded', score: 8.5,
    mimeValidated: true, virusScanStatus: 'clean', fileSize: '3.2 MB', isOverdue: false,
  },
  {
    id: 'sub-005', studentName: 'Hoàng Văn Đức', studentId: 'SV-00317',
    assignmentName: 'Triển khai AES-256 CBC Mode', courseCode: 'MMA-302',
    submittedAt: '07/06/2026 16:30', gradingStatus: 'pending', score: undefined,
    // BR-16 & BR-17: File này MIME hợp lệ nhưng scan đang xử lý
    mimeValidated: true, virusScanStatus: 'pending_scan', fileSize: '670 KB', isOverdue: false,
  },
  {
    id: 'sub-006', studentName: 'Vũ Thị Hương', studentId: 'SV-00271',
    assignmentName: 'Lab: Sniffing với Wireshark', courseCode: 'ATTT-401',
    submittedAt: '03/06/2026 10:15', gradingStatus: 'overdue', score: undefined,
    // BR-16 & BR-17: File bị phát hiện nhiễm virus -> ClamAV đã chặn
    mimeValidated: false, virusScanStatus: 'infected', fileSize: '5.8 MB', isOverdue: true,
  },
];

// --- Badge components ---
const GradingBadge: React.FC<{ status: GradingStatus; score?: number; isOverdue: boolean }> = ({
  status, score, isOverdue,
}) => {
  if (status === 'graded') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-full">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        {score}/10
      </span>
    );
  }
  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-500 text-xs font-semibold rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
        Quá hạn
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 text-xs font-semibold rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
      Chờ chấm
    </span>
  );
};

/**
 * BR-17: Virus Scan Badge
 * Hiển thị trạng thái quét virus từ ClamAV cho mỗi file nộp.
 * File bị nhiễm hoặc chưa quét xong sẽ hiển thị cảnh báo rõ ràng.
 */
const VirusScanBadge: React.FC<{ status: Submission['virusScanStatus'] }> = ({ status }) => {
  if (status === 'clean') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-medium rounded">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        Virus: Sạch
      </span>
    );
  }
  if (status === 'infected') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-200">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
        NHIỄM VIRUS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-medium rounded">
      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      Đang quét...
    </span>
  );
};

/**
 * BR-16: MIME Validation Badge
 * Server đã kiểm tra Magic Bytes thực tế của file, không dựa vào extension hay Content-Type.
 * Nếu MIME không hợp lệ, file bị từ chối và không được lưu vào Storage.
 */
const MimeBadge: React.FC<{ validated: boolean }> = ({ validated }) => {
  if (validated) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-500 text-[10px] font-medium rounded">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
        MIME OK
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-50 text-red-500 text-[10px] font-bold rounded border border-red-200">
      MIME Lỗi
    </span>
  );
};

// ============================================================
// ASSIGNMENT TABLE - Bảng bài nộp của sinh viên
// ============================================================
const AssignmentTable: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | GradingStatus>('all');

  // Lọc dữ liệu theo search và status
  const filtered = MOCK_SUBMISSIONS.filter((s) => {
    const matchSearch =
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.assignmentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.gradingStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const overdueCount = MOCK_SUBMISSIONS.filter((s) => s.isOverdue).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-slate-50">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Bài Tập Đã Nộp</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {MOCK_SUBMISSIONS.length} bài nộp
            {overdueCount > 0 && (
              <span className="ml-2 text-red-500 font-medium">· {overdueCount} quá hạn chấm</span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex gap-1 bg-slate-50 p-1 rounded-lg">
            {(['all', 'pending', 'graded', 'overdue'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilterStatus(f)}
                className={`
                  px-2.5 py-1 rounded-md text-xs font-medium transition-all
                  ${filterStatus === f
                    ? 'bg-white text-slate-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-600'}
                `}
              >
                {{ all: 'Tất cả', pending: 'Chờ chấm', graded: 'Đã chấm', overdue: 'Quá hạn' }[f]}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500"
              fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Tìm sinh viên, bài tập..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-100 rounded-lg
                focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 w-44"
            />
          </div>
        </div>
      </div>

      {/* Security Legend */}
      <div className="flex items-center gap-4 px-5 py-2 bg-slate-50/50 border-b border-slate-50">
        <span className="text-[10px] text-slate-500 font-medium">Security Controls:</span>
        <span className="text-[10px] text-emerald-600">● BR-17: ClamAV Virus Scan</span>
        <span className="text-[10px] text-indigo-500">● BR-16: MIME Magic Bytes Check</span>
        <span className="text-[10px] text-slate-500">● Path Traversal: Tên file đổi thành UUID</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-50">
              {['Sinh Viên', 'Bài Tập', 'Ngày Nộp', 'Trạng Thái', 'Bảo Mật File', 'Hành Động'].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-50">
            {filtered.map((submission) => (
              <tr
                key={submission.id}
                className={`
                  group hover:bg-slate-50/50 transition-colors
                  ${submission.virusScanStatus === 'infected' ? 'bg-red-50/30' : ''}
                `}
              >
                {/* Sinh Viên */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-600 text-[10px] font-bold flex-shrink-0">
                      {submission.studentName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{submission.studentName}</p>
                      {/* StudentID từ Audit log - không thể giả mạo vì lấy từ JWT khi nộp bài */}
                      <p className="text-[10px] text-slate-500 font-mono">{submission.studentId}</p>
                    </div>
                  </div>
                </td>

                {/* Bài Tập */}
                <td className="px-5 py-3.5">
                  <p className="text-xs font-medium text-slate-700 max-w-[180px] truncate">
                    {submission.assignmentName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{submission.courseCode}</p>
                </td>

                {/* Ngày Nộp */}
                <td className="px-5 py-3.5">
                  <p className="text-xs text-slate-600 whitespace-nowrap">{submission.submittedAt}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{submission.fileSize}</p>
                </td>

                {/* Trạng Thái Chấm Điểm */}
                <td className="px-5 py-3.5">
                  <GradingBadge
                    status={submission.gradingStatus}
                    score={submission.score}
                    isOverdue={submission.isOverdue}
                  />
                </td>

                {/* Bảo Mật File - BR-16 & BR-17 */}
                <td className="px-5 py-3.5">
                  <div className="flex flex-col gap-1">
                    {/* BR-17: Virus scan status từ ClamAV */}
                    <VirusScanBadge status={submission.virusScanStatus} />
                    {/* BR-16: MIME Validation (Magic Bytes check) */}
                    <MimeBadge validated={submission.mimeValidated} />
                  </div>
                </td>

                {/* Hành Động */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Chỉ hiển thị nút tải file nếu đã qua được cả MIME check và virus scan */}
                    {submission.mimeValidated && submission.virusScanStatus === 'clean' ? (
                      <button
                        className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 px-2 py-1 bg-indigo-50 rounded-lg transition-colors"
                        title="File đã xác thực MIME và quét virus - an toàn để tải"
                      >
                        Tải Xuống
                      </button>
                    ) : (
                      <span
                        className="text-[11px] font-medium text-slate-600 px-2 py-1 bg-slate-50 rounded-lg cursor-not-allowed"
                        title={submission.virusScanStatus === 'infected'
                          ? 'File nhiễm virus - không thể tải'
                          : 'Đang quét - vui lòng chờ'}
                      >
                        Bị chặn
                      </span>
                    )}
                    {submission.gradingStatus !== 'graded' && (
                      <button className="text-[11px] font-medium text-emerald-600 hover:text-emerald-800 px-2 py-1 bg-emerald-50 rounded-lg transition-colors">
                        Chấm Điểm
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-12 text-center">
            <svg className="w-10 h-10 text-slate-700 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm text-slate-500">Không có bài nộp phù hợp</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentTable;

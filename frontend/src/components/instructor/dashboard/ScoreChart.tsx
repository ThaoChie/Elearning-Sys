import React, { useEffect, useRef } from 'react';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartData,
  type ChartOptions,
} from 'chart.js';

// Đăng ký các thành phần Chart.js cần dùng (tree-shaking friendly)
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

// --- Dữ liệu mô phỏng: phân phối điểm các bài thi đã kết thúc ---
// Dữ liệu thực tế được lấy từ API /api/instructor/exams/{examId}/score-distribution
// API được bảo vệ bởi [Authorize(Policy = "InstructorOnly")] và chỉ trả về exam
// thuộc khóa học của Instructor hiện tại (kiểm tra ownership qua UserID từ JWT Claims).
const MOCK_SCORE_DATA: ChartData<'bar'> = {
  labels: ['0-2', '2-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10'],
  datasets: [
    {
      label: 'An Toàn Thông Tin - Cuối kỳ',
      data: [2, 3, 8, 15, 22, 28, 14, 6],
      backgroundColor: 'rgba(99, 102, 241, 0.75)',   // indigo
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1.5,
      borderRadius: 6,
      borderSkipped: false,
    },
    {
      label: 'Mật Mã Học - Giữa kỳ',
      data: [1, 2, 5, 10, 18, 30, 20, 12],
      backgroundColor: 'rgba(139, 92, 246, 0.6)',    // violet
      borderColor: 'rgba(139, 92, 246, 1)',
      borderWidth: 1.5,
      borderRadius: 6,
      borderSkipped: false,
    },
  ],
};

const CHART_OPTIONS: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        pointStyle: 'circle',
        padding: 16,
        font: { size: 11, family: 'Inter, sans-serif' },
        color: '#64748b',
      },
    },
    tooltip: {
      backgroundColor: '#1e1b4b',
      titleFont: { size: 12, family: 'Inter, sans-serif' },
      bodyFont: { size: 11, family: 'Inter, sans-serif' },
      padding: 10,
      cornerRadius: 8,
      callbacks: {
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} sinh viên`,
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Khoảng điểm',
        font: { size: 11, family: 'Inter, sans-serif' },
        color: '#94a3b8',
      },
      grid: { display: false },
      ticks: {
        color: '#94a3b8',
        font: { size: 10, family: 'Inter, sans-serif' },
      },
      border: { color: '#e2e8f0' },
    },
    y: {
      title: {
        display: true,
        text: 'Số sinh viên',
        font: { size: 11, family: 'Inter, sans-serif' },
        color: '#94a3b8',
      },
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: {
        color: '#94a3b8',
        font: { size: 10, family: 'Inter, sans-serif' },
        stepSize: 5,
      },
      border: { color: 'transparent', dash: [4, 4] },
    },
  },
};

// ============================================================
// SCORE CHART - Biểu đồ phân phối điểm thi
// ============================================================
const ScoreChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'bar'> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Hủy chart cũ trước khi tạo mới (tránh lỗi "Canvas already in use")
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: MOCK_SCORE_DATA,
      options: CHART_OPTIONS,
    });

    // Cleanup khi component unmount
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Phân Phối Điểm Thi</h3>
          <p className="text-xs text-slate-500 mt-0.5">Các bài thi đã kết thúc trong học kỳ</p>
        </div>
        {/* Security badge: dữ liệu điểm thi được mã hóa phía server */}
        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Encrypted Data
        </span>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0" style={{ minHeight: '220px' }}>
        <canvas ref={canvasRef} />
      </div>

      {/* Summary row */}
      <div className="mt-4 flex gap-4 pt-4 border-t border-slate-50">
        {[
          { label: 'Điểm TB', value: '7.4', color: 'text-indigo-600' },
          { label: 'Cao nhất', value: '10.0', color: 'text-emerald-600' },
          { label: 'Thấp nhất', value: '1.5', color: 'text-red-500' },
          { label: 'Tổng SV', value: '183', color: 'text-slate-700' },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center">
            <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScoreChart;

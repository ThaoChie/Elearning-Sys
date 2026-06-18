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

interface ScoreChartProps {
  data: any;
  loading: boolean;
}

// Rút ngắn tên quiz nếu quá dài
const truncateLabel = (name: string, maxLen = 12) =>
  name.length > maxLen ? name.slice(0, maxLen) + '…' : name;

const buildChartData = (quizzes: any[]): ChartData<'bar'> => ({
  labels: quizzes.map((q) => truncateLabel(q.title)),
  datasets: [
    {
      label: 'Số câu hỏi',
      data: quizzes.map((q) => q.questions),
      backgroundColor: 'rgba(99, 102, 241, 0.75)',   // indigo
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 1.5,
      borderRadius: 6,
      borderSkipped: false,
    },
  ],
});

const buildChartOptions = (): ChartOptions<'bar'> => ({
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
        label: (ctx) => ` ${ctx.dataset.label}: ${ctx.parsed.y} câu`,
      },
    },
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Tên đề thi',
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
        text: 'Số câu hỏi',
        font: { size: 11, family: 'Inter, sans-serif' },
        color: '#94a3b8',
      },
      beginAtZero: true,
      grid: { color: '#f1f5f9' },
      ticks: {
        color: '#94a3b8',
        font: { size: 10, family: 'Inter, sans-serif' },
        stepSize: 1,
      },
      border: { color: 'transparent', dash: [4, 4] },
    },
  },
});

// ============================================================
// SCORE CHART - Biểu đồ đề thi / câu hỏi
// ============================================================
const ScoreChart: React.FC<ScoreChartProps> = ({ data, loading }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart<'bar'> | null>(null);

  const quizzes: any[] = data?.recentQuizzes ?? [];
  const totalQuizzes = quizzes.length;
  const totalQuestions = quizzes.reduce((sum: number, q: any) => sum + (q.questions ?? 0), 0);
  const avgQuestions = totalQuizzes > 0 ? (totalQuestions / totalQuizzes).toFixed(1) : '0';
  const totalAssignments = data?.totalAssignments ?? 0;

  useEffect(() => {
    if (loading || !canvasRef.current || quizzes.length === 0) return;

    // Hủy chart cũ trước khi tạo mới (tránh lỗi "Canvas already in use")
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: 'bar',
      data: buildChartData(quizzes),
      options: buildChartOptions(),
    });

    // Cleanup khi component unmount
    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, JSON.stringify(quizzes)]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Thống Kê Đề Thi</h3>
          <p className="text-xs text-slate-500 mt-0.5">Số câu hỏi theo từng đề thi gần đây</p>
        </div>
        {/* Security badge */}
        <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Encrypted Data
        </span>
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 flex items-center justify-center" style={{ minHeight: '220px' }}>
        {loading ? (
          /* Skeleton spinner */
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-200 border-t-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400">Đang tải dữ liệu…</p>
          </div>
        ) : quizzes.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center gap-2 text-center">
            <svg className="w-10 h-10 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-xs text-slate-400 font-medium">Chưa có đề thi nào</p>
          </div>
        ) : (
          <canvas ref={canvasRef} className="w-full h-full" />
        )}
      </div>

      {/* Summary row */}
      <div className="mt-4 flex gap-4 pt-4 border-t border-slate-50">
        {[
          { label: 'Tổng đề thi', value: String(totalQuizzes), color: 'text-indigo-600' },
          { label: 'Tổng câu hỏi', value: String(totalQuestions), color: 'text-violet-600' },
          { label: 'TB câu hỏi/đề', value: avgQuestions, color: 'text-emerald-600' },
          { label: 'Tổng bài tập', value: String(totalAssignments), color: 'text-slate-700' },
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

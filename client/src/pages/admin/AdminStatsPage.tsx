import { useCallback, useEffect, useState } from 'react';
import { adminApi } from '../../api/admin';
import { parseError } from '../../api/client';
import { EmptyState } from '../../components/EmptyState';
import { Spinner } from '../../components/Spinner';
import type { LocationStat } from '../../types';

export default function AdminStatsPage() {
  const [limit, setLimit] = useState(10);
  const [items, setItems] = useState<LocationStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.locationStats({ limit });
      setItems(res);
    } catch (err) {
      setError(parseError(err).message);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
  }, [load]);

  const maxCount = Math.max(...items.map((it) => it.count), 1);
  const rowHeight = 44;
  const chartHeight = items.length * rowHeight + 20;
  const chartWidth = 640;
  const labelWidth = 160;
  const maxBarWidth = 400;

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1>Thống kê địa điểm</h1>
          <p className="muted">Top địa điểm được nhắc đến nhiều nhất trong các bài viết</p>
        </div>
        <div className="admin-actions">
          <label htmlFor="stats-limit-select" className="stats-limit-label">Hiển thị:</label>
          <select
            id="stats-limit-select"
            className="input stats-limit-select"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
            <option value={50}>Top 50</option>
          </select>
        </div>
      </div>

      {loading && (
        <div className="page-loading">
          <Spinner />
          <span>Đang tải thống kê…</span>
        </div>
      )}

      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && !error && items.length === 0 && (
        <EmptyState
          icon="📍"
          title="Chưa có dữ liệu thống kê"
          description="Chưa có bài viết nào ở trạng thái hoạt động để thống kê."
        />
      )}

      {!loading && !error && items.length > 0 && (
        <div className="stats-container">
          <div className="card stats-chart-card">
            <h2 className="stats-section-title">Biểu đồ tần suất địa điểm</h2>
            <div className="stats-chart-wrapper">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="stats-svg-chart"
                aria-label="Biểu đồ cột ngang thống kê địa điểm"
              >
                {items.map((item, index) => {
                  const y = index * rowHeight + 10;
                  const barWidth = Math.max(8, Math.round((item.count / maxCount) * maxBarWidth));
                  return (
                    <g key={item._id} className="stats-bar-group">
                      <text
                        x={labelWidth - 14}
                        y={y + 22}
                        className="stats-chart-label"
                        textAnchor="end"
                      >
                        {item.name}
                      </text>
                      <rect
                        x={labelWidth}
                        y={y + 7}
                        width={barWidth}
                        height={22}
                        rx={4}
                        className="stats-chart-bar"
                      />
                      <text
                        x={labelWidth + barWidth + 10}
                        y={y + 22}
                        className="stats-chart-value"
                        textAnchor="start"
                      >
                        {item.count}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Hạng</th>
                  <th>Địa điểm</th>
                  <th>Số bài viết</th>
                  <th>Tổng lượt thích</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item._id}>
                    <td data-label="Hạng">
                      <span className={`stats-rank stats-rank-${index + 1}`}>#{index + 1}</span>
                    </td>
                    <td data-label="Địa điểm">
                      <strong className="stats-location-name">{item.name}</strong>
                    </td>
                    <td data-label="Số bài viết">{item.count}</td>
                    <td data-label="Tổng lượt thích">❤️ {item.likes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

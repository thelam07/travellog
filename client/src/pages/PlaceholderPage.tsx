// Trang tạm cho route chưa làm; người phụ trách thay bằng trang thật.
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <h1>{title}</h1>
      <p className="muted">Đang làm.</p>
    </div>
  );
}

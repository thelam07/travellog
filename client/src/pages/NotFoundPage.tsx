import { Link } from 'react-router';

export default function NotFoundPage() {
  return (
    <div className="container main">
      <h1>Không tìm thấy trang</h1>
      <p>Đường dẫn không tồn tại hoặc đã bị xoá.</p>
      <Link to="/">Về trang chủ</Link>
    </div>
  );
}

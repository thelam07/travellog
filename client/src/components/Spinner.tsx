export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <span className={`spinner spinner-${size}`}></span>;
}

export function PageSpinner() {
  return (
    <div className="page-loading">
      <Spinner size="lg" />
    </div>
  );
}
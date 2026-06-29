import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-6">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-text">404</h1>
        <h2 className="mb-2 font-display text-2xl font-bold text-text">
          페이지를 찾을 수 없어요
        </h2>
        <p className="mb-8 text-text-secondary">
          요청한 페이지가 존재하지 않습니다.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-on-brand transition-colors hover:bg-brand-strong"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

"use client";

export default function AdminError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm text-center space-y-4">
        <p className="text-4xl">⚠️</p>
        <h1 className="font-bold text-base text-gray-800">エラーが発生しました</h1>
        <p className="text-sm text-gray-500">
          操作を完了できませんでした。しばらく待ってから再度お試しください。
        </p>
        <button
          onClick={reset}
          className="w-full py-2.5 bg-pink-400 text-white font-bold rounded-xl text-sm active:bg-pink-500"
        >
          再試行する
        </button>
      </div>
    </div>
  );
}

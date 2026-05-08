export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto animate-pulse">

        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-purple-200 rounded-2xl" />
          <div>
            <div className="h-7 w-52 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-36 bg-gray-100 rounded" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="h-4 bg-gray-100 rounded w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

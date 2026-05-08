export default function StudentLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto animate-pulse">

        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-indigo-200 rounded-2xl" />
          <div>
            <div className="h-7 w-52 bg-gray-200 rounded-lg mb-2" />
            <div className="h-4 w-36 bg-gray-100 rounded" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
              <div className="w-8 h-8 bg-gray-100 rounded-lg mx-auto mb-3" />
              <div className="h-8 w-12 bg-gray-200 rounded mx-auto mb-2" />
              <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border-2 border-gray-100">
              <div className="w-12 h-12 bg-gray-100 rounded-xl mx-auto mb-4" />
              <div className="h-4 w-24 bg-gray-200 rounded mx-auto mb-2" />
              <div className="h-3 w-32 bg-gray-100 rounded mx-auto" />
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

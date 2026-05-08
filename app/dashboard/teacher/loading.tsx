export default function TeacherLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto animate-pulse">

        {/* Header skeleton */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-blue-200 rounded-2xl" />
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

        {/* Cours skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-blue-100 overflow-hidden">
              <div className="bg-blue-200 px-5 py-4 h-16" />
              <div className="px-5 py-4 flex gap-4">
                <div className="h-4 w-20 bg-gray-100 rounded" />
                <div className="h-4 w-16 bg-gray-100 rounded" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

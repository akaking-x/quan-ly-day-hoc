interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

export function Loading({ size = 'md', className = '' }: LoadingProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`
          ${sizes[size]}
          border-2 border-primary-200 dark:border-primary-800
          border-t-primary-600 dark:border-t-primary-400
          rounded-full animate-spin
        `}
      />
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px]">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-primary-100 dark:border-primary-900 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-primary-600 dark:border-t-primary-400 rounded-full animate-spin" />
      </div>
      <p className="mt-4 text-gray-500 dark:text-gray-400">Đang tải...</p>
    </div>
  );
}

export function SkeletonLoader({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-lg ${className}`} />;
}

// Dashboard Skeleton
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="skeleton h-8 w-40 rounded-lg" />
        <div className="skeleton h-4 w-64 rounded mt-2" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div className="flex-1">
                <div className="skeleton h-3 w-16 rounded mb-2" />
                <div className="skeleton h-6 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="skeleton h-5 w-48 rounded mb-4" />
          <div className="skeleton h-64 w-full rounded-lg" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
          <div className="skeleton h-5 w-48 rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="skeleton w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-32 rounded mb-1" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-5 w-20 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Students List Skeleton
export function StudentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-32 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded mt-2" />
        </div>
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="skeleton h-10 flex-1 rounded-xl" />
          <div className="skeleton h-10 w-40 rounded-xl" />
          <div className="skeleton h-10 w-40 rounded-xl" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-4 w-24 rounded" />
            ))}
          </div>
        </div>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-32 rounded mb-1" />
              <div className="skeleton h-3 w-24 rounded" />
            </div>
            <div className="skeleton h-4 w-24 rounded hidden sm:block" />
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-4 w-20 rounded hidden sm:block" />
            <div className="flex gap-2">
              <div className="skeleton w-8 h-8 rounded-lg" />
              <div className="skeleton w-8 h-8 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Groups Skeleton
export function GroupsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-24 rounded-lg" />
          <div className="skeleton h-4 w-40 rounded mt-2" />
        </div>
        <div className="flex gap-3">
          <div className="skeleton h-10 w-32 rounded-xl" />
          <div className="skeleton h-10 w-28 rounded-xl" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="skeleton w-12 h-12 rounded-xl" />
                <div>
                  <div className="skeleton h-5 w-28 rounded mb-1" />
                  <div className="skeleton h-3 w-20 rounded" />
                </div>
              </div>
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-3/4 rounded" />
            </div>
            <div className="flex gap-2">
              <div className="skeleton h-6 w-16 rounded-full" />
              <div className="skeleton h-6 w-20 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Payments Skeleton
export function PaymentsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="skeleton h-8 w-28 rounded-lg" />
        <div className="skeleton h-4 w-56 rounded mt-2" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="skeleton w-12 h-12 rounded-xl" />
              <div>
                <div className="skeleton h-3 w-16 rounded mb-2" />
                <div className="skeleton h-6 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Navigation */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="text-center">
            <div className="skeleton h-6 w-40 rounded mb-1 mx-auto" />
            <div className="skeleton h-4 w-32 rounded mx-auto" />
          </div>
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>

        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-gray-50 dark:border-gray-700 last:border-0">
            <div className="skeleton w-10 h-10 rounded-full" />
            <div className="flex-1">
              <div className="skeleton h-4 w-28 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-4 w-12 rounded" />
            <div className="skeleton h-4 w-20 rounded hidden sm:block" />
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 w-20 rounded hidden sm:block" />
            <div className="skeleton h-4 w-24 rounded" />
            <div className="skeleton h-8 w-20 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Attendance/Calendar Skeleton
export function AttendanceSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-8 w-28 rounded-lg" />
          <div className="skeleton h-4 w-48 rounded mt-2" />
        </div>
        <div className="skeleton h-10 w-32 rounded-xl" />
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700">
        {/* Month nav */}
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton w-10 h-10 rounded-xl" />
          <div className="skeleton h-6 w-40 rounded" />
          <div className="skeleton w-10 h-10 rounded-xl" />
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="skeleton h-8 rounded" />
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings Skeleton
export function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <div className="skeleton h-8 w-28 rounded-lg" />
        <div className="skeleton h-4 w-48 rounded mt-2" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton h-4 w-32 rounded" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ))}
        <div className="skeleton h-10 w-28 rounded-xl" />
      </div>
    </div>
  );
}

// Generic Card Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-12 h-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-3 w-1/2 rounded" />
        </div>
      </div>
      <div className="skeleton h-20 rounded-lg" />
      <div className="flex gap-2">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-1/3 rounded" />
            <div className="skeleton h-3 w-1/4 rounded" />
          </div>
          <div className="skeleton h-6 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function NewsSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-4 bg-white rounded-2xl">
          <div className="w-12 h-12 rounded-xl skeleton flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 skeleton" />
            <div className="h-4 w-full skeleton" />
            <div className="h-4 w-3/4 skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function VideoSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl overflow-hidden">
          <div className="aspect-video skeleton" />
          <div className="p-3 space-y-2">
            <div className="h-4 w-3/4 skeleton" />
            <div className="h-3 w-1/2 skeleton" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function BlogSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 space-y-2">
          <div className="h-3 w-20 skeleton" />
          <div className="h-5 w-3/4 skeleton" />
          <div className="h-3 w-full skeleton" />
          <div className="h-3 w-2/3 skeleton" />
        </div>
      ))}
    </div>
  );
}

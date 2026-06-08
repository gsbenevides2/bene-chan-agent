"use client";

interface ChatSessionsSkeletonProps {
  itemCount?: number;
}

export default function ChatSessionsSkeleton({ 
  itemCount = 6 
}: ChatSessionsSkeletonProps) {
  return (
    <div className="bg-base-100 h-full">
      {/* Header Skeleton */}
      <div className="p-4 border-base-200 border-b">
        <div className="skeleton h-6 w-32 mb-2"></div>
        <div className="skeleton h-4 w-20"></div>
      </div>

      {/* Sessions List Skeleton */}
      <div className="h-full overflow-y-auto">
        <ul className="list">
          {Array.from({ length: itemCount }).map((_, index) => (
            <li key={index} className="p-0">
              <div className="p-4 w-full">
                <div className="flex justify-between items-start">
                  {/* Chat Info Skeleton */}
                  <div className="flex flex-1 items-start space-x-3 min-w-0">
                    {/* Chat Icon Skeleton */}
                    <div className="skeleton rounded-full w-10 h-10"></div>

                    {/* Chat Details Skeleton */}
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Chat Name Skeleton */}
                      <div className="skeleton h-5 w-36"></div>
                      
                      {/* Time Skeleton */}
                      <div className="skeleton h-4 w-16"></div>
                    </div>
                  </div>

                  {/* Action Menu Skeleton */}
                  <div className="skeleton rounded-full w-8 h-8"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
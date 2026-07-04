import React from 'react';
import { cn } from '../lib/utils';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className }) => {
  return (
    <div className={cn("animate-pulse bg-gray-200 rounded-md", className)} />
  );
};

export const CompanySkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 animate-pulse">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-16 w-16 rounded-xl" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
    </div>
    <div className="flex space-x-2 pt-2">
      <Skeleton className="h-6 w-20 rounded-full" />
      <Skeleton className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

export const TenderSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      <Skeleton className="h-6 w-24 rounded-full" />
    </div>
    <Skeleton className="h-4 w-full" />
    <div className="flex justify-between items-center pt-4 border-t border-gray-50">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-5 w-24" />
    </div>
  </div>
);

export const EventSkeleton = () => (
  <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100 flex flex-col md:flex-row animate-pulse">
    <div className="md:w-2/5 h-48 md:h-auto bg-gray-50 relative">
      <Skeleton className="w-full h-full rounded-none opacity-50" />
    </div>
    <div className="md:w-3/5 p-8 flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <div className="space-y-2 py-4">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="mt-auto flex items-center justify-between pt-6 border-t border-gray-50">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-24 rounded-xl" />
      </div>
    </div>
  </div>
);

export const CatalogueSkeleton = () => (
  <div className="bg-white border border-gray-200 flex flex-col animate-pulse">
    <div className="aspect-[4/5] relative bg-gray-50 border-b border-gray-200">
      <Skeleton className="w-full h-full rounded-none opacity-50" />
    </div>
    <div className="p-6 flex-grow flex flex-col space-y-4">
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-6 w-full" />
      <div className="mt-auto pt-4 border-t border-gray-100 grid grid-cols-3 gap-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <div className="mt-6 flex items-center justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  </div>
);

export const ArticleSkeleton = () => (
  <div className="min-h-screen bg-white pb-20 animate-pulse">
    <div className="relative h-[60vh] min-h-[400px] bg-gray-100">
      <Skeleton className="w-full h-full rounded-none opacity-50" />
      <div className="absolute inset-0 flex flex-col justify-end pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
          <Skeleton className="h-4 w-32 bg-gray-200/50" />
          <Skeleton className="h-16 w-3/4 max-w-2xl bg-gray-200/50" />
          <div className="flex items-center space-x-6 border-t border-gray-200/30 pt-6">
            <Skeleton className="h-10 w-10 rounded-full bg-gray-200/50" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24 bg-gray-200/50" />
              <Skeleton className="h-2 w-32 bg-gray-200/50" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-16">
        <aside className="lg:col-span-1 hidden lg:block space-y-12">
          <Skeleton className="h-4 w-24 mb-6" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </aside>
        
        <article className="lg:col-span-2 space-y-8">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </article>

        <aside className="lg:col-span-1 hidden lg:block space-y-8">
          <Skeleton className="h-4 w-32 mb-8" />
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-4 mb-8">
              <Skeleton className="aspect-video w-full rounded-2xl" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-32" />
            </div>
          ))}
        </aside>
      </div>
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="bg-neutral-bg min-h-screen pb-20 space-y-8">
    <div className="h-64 md:h-80 bg-gray-200">
      <Skeleton className="w-full h-full rounded-none opacity-50" />
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/3 space-y-6">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 flex flex-col items-center space-y-4">
            <Skeleton className="w-32 h-32 rounded-2xl -mt-24 border-4 border-white opacity-50" />
            <Skeleton className="h-8 w-3/4 mt-4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full mt-6" />
            <Skeleton className="h-10 w-full rounded-xl mt-4" />
          </div>
        </aside>
        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 space-y-4">
            <Skeleton className="h-8 w-1/3 mb-8" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="grid grid-cols-2 gap-8 pt-8 mt-4">
              <Skeleton className="h-32 w-full rounded-2xl" />
              <Skeleton className="h-32 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const BlogCardSkeleton = () => (
  <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col animate-pulse">
    <div className="h-48 bg-gray-200">
      <Skeleton className="w-full h-full rounded-none opacity-50" />
    </div>
    <div className="p-6 flex flex-col flex-1 space-y-4">
      <div className="flex space-x-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="mt-auto pt-6 border-t border-gray-50 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
    </div>
  </div>
);

export const ProductDetailSkeleton = () => (
  <div className="bg-neutral-bg min-h-screen pb-20 animate-pulse">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-4 w-32 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div className="space-y-6">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1,2,3].map(i => <Skeleton key={i} className="aspect-square rounded-2xl" />)}
          </div>
        </div>
        <div className="flex flex-col space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-64 w-full rounded-3xl" />
          <div className="grid grid-cols-2 gap-6">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const TenderDetailSkeleton = () => (
  <div className="bg-neutral-bg min-h-screen pb-20 animate-pulse">
    <div className="bg-white border-b border-gray-200 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-4 w-32 mb-8" />
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          <div className="space-y-4 flex-1">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full max-w-2xl" />
            <div className="flex space-x-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-16 w-32 rounded-xl" />
        </div>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-8">
          <Skeleton className="h-64 w-full rounded-3xl" />
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
        <div className="space-y-8">
          <Skeleton className="h-80 w-full rounded-3xl" />
        </div>
      </div>
    </div>
  </div>
);

export const ProductSkeleton: React.FC<{ view?: 'grid' | 'list' }> = ({ view = 'grid' }) => (

  <div className={cn(
    "bg-white rounded-[32px] border border-gray-100 overflow-hidden animate-pulse",
    view === 'list' && "flex md:flex-row"
  )}>
    <div className={cn("relative bg-gray-50", view === 'grid' ? "aspect-[4/3]" : "md:w-72 aspect-square")}>
      <Skeleton className="w-full h-full rounded-none opacity-50" />
    </div>
    <div className="p-6 flex flex-col justify-between flex-1 space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-2 mt-4">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-12 w-12 rounded-2xl" />
      </div>
    </div>
  </div>
);


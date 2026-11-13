import React from 'react';
import { MapPin } from 'lucide-react';
import { STORIES, StoryLocation } from '../config/stories.ts';

interface StoryButtonsProps {
  onSelectStory: (story: StoryLocation) => void;
  activeCoords?: { lat: number; lon: number } | null;
  className?: string;
  isCompact?: boolean;
}

export const StoryButtons: React.FC<StoryButtonsProps> = ({
  onSelectStory,
  activeCoords,
  className = '',
  isCompact = false,
}) => {
  return (
    <div
      className={`flex gap-2 ${
        isCompact ? 'flex-nowrap items-center' : 'flex-wrap items-center'
      } ${className}`}
    >
      {STORIES.map((story) => {
        const isActive =
          Boolean(activeCoords) &&
          Math.abs(activeCoords!.lat - story.lat) < 0.1 &&
          Math.abs(activeCoords!.lon - story.lon) < 0.1;

        if (isCompact) {
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => onSelectStory(story)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#1A1A1A] border-[#1A1A1A] text-[#FAF8F4] font-semibold'
                  : 'bg-[#FAF8F4] border-[#D8D3C8] text-[#1A1A1A] font-medium hover:bg-[#EFECE4] hover:border-[#8C877C]'
              }`}
            >
              <MapPin
                className={`w-3 h-3 shrink-0 ${
                  isActive ? 'text-[#FAF8F4]' : 'text-[#C8472B]'
                }`}
                aria-hidden="true"
              />
              <span>{story.name}</span>
            </button>
          );
        }

        return (
          <button
            key={story.id}
            type="button"
            onClick={() => onSelectStory(story)}
            aria-pressed={isActive}
            className={`w-full text-left px-3.5 py-3 rounded-lg border transition-colors cursor-pointer ${
              isActive
                ? 'bg-[#EAE5DA] border-[#1A1A1A]'
                : 'bg-[#FAF8F4] hover:bg-[#F2EEE6] border-[#D8D3C8] hover:border-[#8C877C]'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 font-medium text-sm text-[#1A1A1A]">
                <MapPin
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-[#1A1A1A]' : 'text-[#C8472B]'
                  }`}
                  aria-hidden="true"
                />
                <span>{story.name}</span>
              </span>
              <span className="text-xs text-[#6B6860] tabular-nums shrink-0">
                {story.lat}°, {story.lon}°
              </span>
            </div>
            <div className="text-xs text-[#52504A] mt-0.5 pl-5.5">{story.subtitle}</div>
          </button>
        );
      })}
    </div>
  );
};

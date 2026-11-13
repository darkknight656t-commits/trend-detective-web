/**
 * Preset story locations for quick global climate exploration.
 * Subtitles are descriptive, neutral geographic contexts rather than claims about results.
 */

export interface StoryLocation {
  id: string;
  name: string;
  subtitle: string;
  lat: number;
  lon: number;
  zoom: number;
}

export const STORIES: StoryLocation[] = [
  {
    id: 'arctic',
    name: 'Arctic (Svalbard)',
    subtitle: 'High-latitude polar region',
    lat: 78.2,
    lon: 15.6,
    zoom: 5,
  },
  {
    id: 'sahel',
    name: 'Sahel (Niamey, Niger)',
    subtitle: 'Semi-arid belt, variable rainfall',
    lat: 13.5,
    lon: 2.1,
    zoom: 6,
  },
  {
    id: 'amazon',
    name: 'Amazon basin (Manaus, Brazil)',
    subtitle: 'Tropical rainforest region',
    lat: -3.1,
    lon: -60.0,
    zoom: 6,
  },
];

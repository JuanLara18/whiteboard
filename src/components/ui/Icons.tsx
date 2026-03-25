// Inline SVG icons — stroke-based, 20×20 viewBox, 1.5px stroke weight
// All icons use currentColor so they inherit text color automatically.

type IconProps = { size?: number };
const defaults = { fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

export const IconSelect = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 2.5L4 15.5L7.5 12L9.5 16L11 15.2L9 11.5L13.5 11.5L4 2.5Z"
      fill="currentColor"
    />
  </svg>
);

export const IconHand = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 3.5V10.5M10 3.5a1.25 1.25 0 012.5 0V10.5M10 3.5a1.25 1.25 0 00-2.5 0V10.5M12.5 5a1.25 1.25 0 012.5 0V11.5a5.5 5.5 0 01-5.5 5.5h-.5A5.5 5.5 0 014 11.5V9.5a1.25 1.25 0 012.5 0V10.5"
      stroke="currentColor"
      {...defaults}
    />
  </svg>
);

export const IconNote = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 4a1 1 0 011-1h9l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm9-1v4h4"
      stroke="currentColor"
      {...defaults}
    />
  </svg>
);

export const IconPencil = ({ size = 18 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.5 3.5a2.121 2.121 0 113 3L6 17H3v-3L13.5 3.5z"
      stroke="currentColor"
      {...defaults}
    />
  </svg>
);

export const IconTrash = ({ size = 16 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3 5.5h14M8 5.5V4a1 1 0 012 0v1.5M7 8.5v6M10 8.5v6M13 8.5v6M5 5.5l.75 10a1 1 0 001 .917h6.5a1 1 0 001-.917L15 5.5"
      stroke="currentColor"
      {...defaults}
    />
  </svg>
);

export const IconDownload = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 3v10M7 10l3 3 3-3M3.5 15.5h13"
      stroke="currentColor"
      {...defaults}
    />
  </svg>
);

export const IconUpload = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 13V3M7 6l3-3 3 3M3.5 15.5h13"
      stroke="currentColor"
      {...defaults}
    />
  </svg>
);

export const IconImage = ({ size = 15 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.5 3.5h15a1 1 0 011 1v11a1 1 0 01-1 1h-15a1 1 0 01-1-1v-11a1 1 0 011-1zM1.5 13.5l4.5-5 3.5 4 2.5-2.5 4 5.5"
      stroke="currentColor"
      {...defaults}
    />
    <circle cx="6.5" cy="7.5" r="1" fill="currentColor" />
  </svg>
);

export const IconZoomIn = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 6v8M6 10h8" stroke="currentColor" {...defaults} />
  </svg>
);

export const IconZoomOut = ({ size = 14 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 10h8" stroke="currentColor" {...defaults} />
  </svg>
);

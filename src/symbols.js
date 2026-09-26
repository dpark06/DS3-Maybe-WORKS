// The five symbols from the poster key (paths exported straight from the Figma legend components).
export const SYMBOLS = {
  entrance: {
    name: 'Entrance',
    blurb: 'Walk right in',
    w: 140, h: 140,
    d: 'M140 70C140 108.66 108.66 140 70 140C31.3401 140 0 108.66 0 70C0 31.3401 31.3401 0 70 0C108.66 0 140 31.3401 140 70Z',
  },
  stop: {
    name: 'Stopping Point',
    blurb: 'Stop and stay awhile',
    w: 140, h: 140,
    d: 'M122 70C122 41.2812 98.7188 18 70 18C41.2812 18 18 41.2812 18 70C18 98.7188 41.2812 122 70 122V140C31.3401 140 0 108.66 0 70C0 31.3401 31.3401 0 70 0C108.66 0 140 31.3401 140 70C140 108.66 108.66 140 70 140V122C98.7188 122 122 98.7188 122 70Z',
  },
  exit: {
    name: 'Exit',
    blurb: 'Time to head out',
    w: 160, h: 110,
    d: 'M142.107 3.86087C145.498 -0.498481 151.781 -1.2837 156.14 2.10697C160.5 5.49769 161.285 11.7807 157.894 16.1402L87.8941 106.14C85.9995 108.576 83.0864 110.001 80.0005 110.001C76.9147 110.001 74.0015 108.576 72.107 106.14L2.10697 16.1402C-1.2837 11.7807 -0.498481 5.49769 3.86087 2.10697C8.2203 -1.2837 14.5034 -0.498481 17.8941 3.86087L80.0005 83.7115L142.107 3.86087Z',
  },
  fast: {
    name: 'Move Fast',
    blurb: 'Zoom right past',
    w: 160, h: 155,
    d: 'M142.929 67.9289C146.834 64.0237 153.166 64.0237 157.072 67.9289C160.977 71.8342 160.977 78.1663 157.072 82.0715L87.0715 152.072C83.1663 155.977 76.8342 155.977 72.9289 152.072L2.92893 82.0715C-0.976311 78.1663 -0.976311 71.8342 2.92893 67.9289C6.83418 64.0237 13.1663 64.0237 17.0715 67.9289L80.0002 130.858L142.929 67.9289ZM142.929 2.92893C146.834 -0.976306 153.166 -0.976306 157.072 2.92893C160.977 6.83418 160.977 13.1663 157.072 17.0715L87.0715 87.0715C83.1663 90.9768 76.8342 90.9768 72.9289 87.0715L2.92893 17.0715C-0.976311 13.1663 -0.976311 6.83418 2.92893 2.92893C6.83418 -0.976311 13.1663 -0.976311 17.0715 2.92893L80.0002 65.8576L142.929 2.92893Z',
  },
  restricted: {
    name: 'Restricted',
    blurb: 'Staff only, shhh',
    w: 120, h: 170,
    d: 'M101.681 4.45402C104.744 -0.14127 110.952 -1.38294 115.548 1.68058C120.143 4.7441 121.385 10.9525 118.321 15.5478L18.3212 165.548C15.2577 170.143 9.0493 171.385 4.45402 168.321C-0.14127 165.258 -1.38294 159.049 1.68058 154.454L101.681 4.45402Z',
  },
};

export const SYMBOL_KEYS = ['entrance', 'stop', 'exit', 'fast', 'restricted'];

export const CONFIRMATIONS = {
  entrance: 'Welcome in! The door is always open.',
  stop: 'Great spot to linger. Take your time!',
  exit: 'Nicely done. See you next time!',
  fast: 'Zoom zoom! Snack run complete.',
  restricted: 'Ooh, staff only. Very mysterious!',
};

export function symbolSVG(key, className = '') {
  const s = SYMBOLS[key];
  return `<svg class="${className}" viewBox="0 0 ${s.w} ${s.h}" width="${s.w}" height="${s.h}" aria-hidden="true" focusable="false"><path d="${s.d}" fill="currentColor"/></svg>`;
}

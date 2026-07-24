export const DESIGN_W = 1440
export const cqw = (px) => `${(px / DESIGN_W * 100).toFixed(4)}cqw`
export const cqwType = (px, minFactor = 0.62, maxFactor = 1.2) =>
  `clamp(${(px * minFactor).toFixed(2)}px, ${(px / DESIGN_W * 100).toFixed(4)}cqw, ${(px * maxFactor).toFixed(2)}px)`
export const MOBILE_BELOW = 768

// Curated accessible pastel color palette for wallets
export const WALLET_PALETTES = [
  { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }, // Emerald / Mint
  { bg: '#f3e8ff', text: '#7e22ce', border: '#e9d5ff' }, // Purple / Violet
  { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }, // Sky Blue
  { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }, // Amber / Orange
  { bg: '#ffe4e6', text: '#be123c', border: '#fecdd3' }, // Rose / Crimson
  { bg: '#e0e7ff', text: '#4338ca', border: '#c7d2fe' }, // Indigo
  { bg: '#ccfbf1', text: '#0f766e', border: '#99f6e4' }, // Teal / Cyan
  { bg: '#fef9c3', text: '#854d0e', border: '#fef08a' }, // Warm Gold / Yellow
  { bg: '#fae8ff', text: '#a21caf', border: '#f5d0fe' }, // Fuchsia
  { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1' }, // Slate Blue
  { bg: '#ecfccb', text: '#4d7c0f', border: '#d9f99d' }, // Lime / Apple
  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }, // Sapphire Blue
];

/**
 * Returns a consistent, distinct color palette for a given wallet.
 * Maps by index in user's wallets list if available, or falls back to a deterministic string hash.
 */
export const getWalletColor = (walletName = '', walletId = null, allWallets = []) => {
  if (!walletName && !walletId) {
    return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' };
  }

  // 1. If allWallets array is provided, match by index for maximum distinctness
  if (Array.isArray(allWallets) && allWallets.length > 0) {
    const index = allWallets.findIndex(
      (w) => (walletId && w.id === walletId) || 
             (w.wallet_name && walletName && w.wallet_name.toLowerCase().trim() === walletName.toLowerCase().trim())
    );
    if (index !== -1) {
      return WALLET_PALETTES[index % WALLET_PALETTES.length];
    }
  }

  // 2. Deterministic hash fallback based on wallet name or ID
  const seed = String(walletName || walletId || 'default').toLowerCase().trim();
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const paletteIndex = Math.abs(hash) % WALLET_PALETTES.length;
  return WALLET_PALETTES[paletteIndex];
};

/**
 * Returns inline CSS styles for rendering a clean pill badge.
 */
export const getWalletBadgeStyle = (palette) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: '6px',
  fontSize: '11px',
  fontWeight: '600',
  letterSpacing: '0.2px',
  backgroundColor: palette.bg,
  color: palette.text,
  border: `1px solid ${palette.border}`,
  lineHeight: '1.25',
  maxWidth: '140px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
});

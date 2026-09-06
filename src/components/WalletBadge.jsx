import React from 'react';
import { getWalletColor, getWalletBadgeStyle } from '../utils/walletColors';

const WalletBadge = ({ walletName, walletId, allWallets = [], style = {} }) => {
  const palette = getWalletColor(walletName, walletId, allWallets);
  const badgeStyle = { ...getWalletBadgeStyle(palette), ...style };

  return (
    <span style={badgeStyle} title={walletName || ''}>
      {walletName || 'Unknown Wallet'}
    </span>
  );
};

export default WalletBadge;

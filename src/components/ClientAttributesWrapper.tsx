'use client';

import React, { useEffect, useState } from 'react';

export default function ClientAttributesWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  
  // Get data from localStorage or other browser-only APIs
  const channelName = typeof window !== 'undefined' ? 
    localStorage.getItem('bybit-channel-name') || 'iAB4ZC8RQ4NEJ5hBFPq1j' : '';
  
  const isDefaultWallet = typeof window !== 'undefined' ? 
    localStorage.getItem('bybit-is-default-wallet') === 'true' : true;

  // Only update client-side
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html 
      lang="uk"
      {...(mounted && {
        'data-bybit-channel-name': channelName,
        'data-bybit-is-default-wallet': isDefaultWallet
      })}
    >
      {children}
    </html>
  );
}

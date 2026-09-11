'use client';

import React from 'react';
import { TransitionType } from '../../engine/types';

interface TransitionLayerProps {
  type: TransitionType | null;
  active: boolean;
}

export const TransitionLayer: React.FC<TransitionLayerProps> = ({ type, active }) => {
  if (!active || !type) return null;

  if (type === 'SMASH_CUT') {
    return (
      <div className="absolute inset-0 z-50 pointer-events-none bg-white animate-ping opacity-90" />
    );
  }

  if (type === 'FADE_OUT' || type === 'FADE_IN') {
    return (
      <div className="absolute inset-0 z-50 pointer-events-none bg-black transition-opacity duration-1000 opacity-100" />
    );
  }

  if (type === 'DISSOLVE') {
    return (
      <div className="absolute inset-0 z-50 pointer-events-none bg-cinema-950/80 transition-opacity duration-700 backdrop-blur-sm" />
    );
  }

  // Standard CUT
  return (
    <div className="absolute inset-0 z-50 pointer-events-none bg-black transition-opacity duration-150 opacity-100" />
  );
};

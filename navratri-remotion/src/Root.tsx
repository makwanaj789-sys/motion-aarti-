import React from 'react';
import { Composition } from 'remotion';
import { NavratriHindi } from './NavratriHindi';
import { FPS, H, TOTAL_FRAMES, W } from './timing';

export const Root: React.FC = () => (
  <Composition id="NavratriHindi" component={NavratriHindi} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
);

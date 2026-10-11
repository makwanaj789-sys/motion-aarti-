import React from 'react';
import { Composition } from 'remotion';
import { Navratri } from './Navratri';
import { FPS, H, TOTAL_FRAMES, W } from './timing';

export const Root: React.FC = () => (
  <Composition id="Navratri" component={Navratri} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
);

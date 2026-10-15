import React from 'react';
import { Composition } from 'remotion';
import { AstraPromo, DURATION, FPS, H, W } from './Astra';

export const Root: React.FC = () => (
  <Composition id="AstraPromo" component={AstraPromo} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} />
);

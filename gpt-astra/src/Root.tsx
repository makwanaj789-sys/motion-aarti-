import React from 'react';
import { Composition } from 'remotion';
import { AstraRef, DURATION, FPS, H, W } from './AstraRef';
import { AstraPromo, DURATION as D1 } from './Astra';

export const Root: React.FC = () => (
  <>
    <Composition id="AstraRef" component={AstraRef} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="AstraPromo" component={AstraPromo} durationInFrames={Math.round(D1 * FPS)} fps={FPS} width={W} height={H} />
  </>
);

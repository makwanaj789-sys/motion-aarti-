import React from 'react';
import { Composition } from 'remotion';
import { AstraRef, DURATION, FPS, H, W } from './AstraRef';
import { AstraPromo, DURATION as D1 } from './Astra';
import { AstraV3, DURATION as D3 } from './AstraV3';

export const Root: React.FC = () => (
  <>
    <Composition id="AstraV3" component={AstraV3} durationInFrames={Math.round(D3 * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="AstraRef" component={AstraRef} durationInFrames={Math.round(DURATION * FPS)} fps={FPS} width={W} height={H} />
    <Composition id="AstraPromo" component={AstraPromo} durationInFrames={Math.round(D1 * FPS)} fps={FPS} width={W} height={H} />
  </>
);

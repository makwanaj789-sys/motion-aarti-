import React from 'react';
import { Composition } from 'remotion';
import { NavratriPhoto } from './NavratriPhoto';
import { NavratriHindi } from './NavratriHindi';
import { FPS, H, TOTAL_FRAMES, W } from './timing';

export const Root: React.FC = () => (
  <>
    <Composition id="NavratriPhoto" component={NavratriPhoto} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
    <Composition id="NavratriHindi" component={NavratriHindi} durationInFrames={TOTAL_FRAMES} fps={FPS} width={W} height={H} />
  </>
);

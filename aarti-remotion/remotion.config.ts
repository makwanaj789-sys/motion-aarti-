import { Config } from '@remotion/cli/config';

// Chromium shipped with this machine; drop this line to let Remotion fetch its own.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
Config.setVideoImageFormat('png');
Config.setChromiumOpenGlRenderer('swangle');

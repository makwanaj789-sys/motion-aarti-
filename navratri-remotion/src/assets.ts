// Image slots used by the edit. Drop a licensed photo into assets_src/ and run
// `npm run cutouts`: it writes public/photos/<slot>.png (a clean cutout for
// `cutout: true` slots, an optimised copy otherwise) and fills `file` below.
// A slot whose file is null renders as a clearly labelled placeholder, never
// as a stand-in image.
export type Slot = {
  id: string;
  what: string;
  cutout: boolean;
  file: string | null;
  // focus point (0..1) kept in frame when the photo is cropped to a wide band
  focus?: [number, number];
};

export const SLOTS: Record<string, Slot> = {
  ground: { id: 'ground', what: 'Garba ground / courtyard at night, many dancers in a circle', cutout: false, file: null, focus: [0.5, 0.45] },
  dancerF: { id: 'dancerF', what: 'Woman in chaniya choli mid-twirl, full figure', cutout: true, file: null },
  dancerM: { id: 'dancerM', what: 'Man in kediyu dancing, full figure', cutout: true, file: null },
  dandiyaPair: { id: 'dandiyaPair', what: 'Two dancers striking dandiya sticks', cutout: true, file: null },
  sticks: { id: 'sticks', what: 'Pair of decorated dandiya sticks', cutout: true, file: null },
  bandhani: { id: 'bandhani', what: 'Bandhani fabric close-up (texture)', cutout: false, file: null, focus: [0.5, 0.5] },
  mirror: { id: 'mirror', what: 'Mirror-work (abhla) embroidery close-up', cutout: false, file: null, focus: [0.5, 0.5] },
  jewel: { id: 'jewel', what: 'Traditional jewellery (necklace / jhumka)', cutout: true, file: null },
  garbo: { id: 'garbo', what: 'Decorated earthen garbo with a lit diya', cutout: true, file: null },
  amba: { id: 'amba', what: 'Maa Amba — respectful murti photo or traditional painting', cutout: false, file: null, focus: [0.5, 0.35] },
  marigold: { id: 'marigold', what: 'Marigold garland / toran', cutout: true, file: null },
};

// filled by scripts/make_cutouts.py: { slot: { file, w, h } }
import photos from './photos.json';
const found = photos as Record<string, { file: string; w: number; h: number }>;
for (const [k, v] of Object.entries(found)) if (SLOTS[k]) SLOTS[k].file = v.file;
export const sizeOf = (id: string): [number, number] => (found[id] ? [found[id].w, found[id].h] : [1000, 1000]);

export const missingSlots = () => Object.values(SLOTS).filter((s) => !s.file);

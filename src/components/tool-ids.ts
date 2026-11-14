// Seznam naprav na strani »Merilna oprema«. Vsak id mora imeti opis v content/oprema/oprema.yaml
// in delujočo napravo v ToolSims.tsx (TypeScript in test to preverita).
export const TOOL_IDS = [
  'manometrska-baterija',
  'digitalna-baterija',
  'termometer-cevni',
  'termometer-vbodni',
  'ir-termometer',
  'klescni-ampermeter',
  'multimeter',
  'tester-napetosti',
  'merilnik-izolacije',
  'vakuumska-crpalka',
  'vakuummeter',
  'detektor-puscanja',
  'tehtnica',
  'naprava-za-zajem',
  'dusik-regulator',
  'manometer-vode',
  'termokamera',
] as const;
export type ToolId = (typeof TOOL_IDS)[number];

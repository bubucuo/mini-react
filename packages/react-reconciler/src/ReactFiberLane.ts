export type Lanes = number;
export type Lane = number;

export const NoLanes: Lanes = /*                        */ 0b0000000000000000000000000000000;
export const NoLane: Lane = /*                          */ 0b0000000000000000000000000000000;
export const SyncLane: Lane = /*                        */ 0b0000000000000000000000000000001;

export const InputContinuousLane: Lane = /*             */ 0b0000000000000000000000000000100;

export const DefaultLane: Lane = /*                     */ 0b0000000000000000000000000010000;

const TransitionLanes: Lanes = /*                       */ 0b0000000001111111111111111000000;

export const IdleLane: Lane = /*                        */ 0b0100000000000000000000000000000;

export const NoTimestamp = -1;

export function mergeLanes(a: Lanes | Lane, b: Lanes | Lane): Lanes {
  return a | b;
}

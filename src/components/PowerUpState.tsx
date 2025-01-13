export type PowerUpType = 'SPEED' | 'MULTIPLIER' | 'SHIELD';
export type Coordinate = { x: number; y: number };

export interface PowerUpState extends Coordinate {
  type: PowerUpType;
  active: boolean;
  duration: number;
}
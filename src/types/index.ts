type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Coordinate = { x: number; y: number };
type PowerUpType = 'SPEED' | 'MULTIPLIER' | 'SHIELD';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface PowerUp extends Coordinate {
  type: PowerUpType;
}
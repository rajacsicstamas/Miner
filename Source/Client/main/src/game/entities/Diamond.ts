import { Entity, EntityType } from './Entity';

export class Diamond extends Entity {
  public falling: boolean;
  public points: number;

  constructor(x: number, y: number, points: number = 10) {
    super(x, y, EntityType.DIAMOND);
    this.solid = false; // Player can walk through and collect
    this.movable = true;
    this.collectible = true;
    this.fallable = true;
    this.falling = false;
    this.points = points;
  }

  public canMoveTo(x: number, y: number): boolean {
    // Diamonds can move due to gravity
    return x >= 0 && y >= 0;
  }

  public startFalling(): void {
    this.falling = true;
  }

  public stopFalling(): void {
    this.falling = false;
  }

  public isFalling(): boolean {
    return this.falling;
  }

  public update(): void {
    // Physics update will be handled by the game engine
  }

  public onCollision(other: Entity): void {
    if (other.type === EntityType.PLAYER) {
      // Diamond gets collected by player
      // This will be handled by the game logic
    }
  }

  public getDisplayChar(): string {
    return '♦';
  }

  public getDisplayColor(): string {
    return this.falling ? '#00ffff' : '#0088ff';
  }
}

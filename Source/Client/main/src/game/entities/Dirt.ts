import { Entity, EntityType } from './Entity';

export class Dirt extends Entity {
  public diggable: boolean;

  constructor(x: number, y: number) {
    super(x, y, EntityType.DIRT);
    this.solid = true; // Blocks movement until dug
    this.movable = false;
    this.collectible = false;
    this.fallable = false;
    this.diggable = true;
  }

  public canMoveTo(_x: number, _y: number): boolean {
    // Dirt doesn't move
    return false;
  }

  public dig(): void {
    // When dug, dirt becomes empty space
    this.type = EntityType.EMPTY;
    this.solid = false;
    this.diggable = false;
  }

  public isDug(): boolean {
    return this.type === EntityType.EMPTY;
  }

  public onCollision(other: Entity): void {
    if (other.type === EntityType.PLAYER && this.diggable) {
      // Player digs through dirt
      this.dig();
    }
  }

  public getDisplayChar(): string {
    return this.isDug() ? ' ' : '▓';
  }

  public getDisplayColor(): string {
    return this.isDug() ? '#000000' : '#8B4513';
  }
}

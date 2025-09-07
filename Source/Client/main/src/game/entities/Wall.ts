import { Entity, EntityType } from './Entity';

export class Wall extends Entity {
  public destructible: boolean;

  constructor(x: number, y: number, destructible: boolean = false) {
    super(x, y, EntityType.WALL);
    this.solid = true;
    this.movable = false;
    this.collectible = false;
    this.fallable = false;
    this.destructible = destructible;
  }

  public canMoveTo(_x: number, _y: number): boolean {
    // Walls don't move
    return false;
  }

  public destroy(): void {
    if (this.destructible) {
      this.type = EntityType.EMPTY;
      this.solid = false;
    }
  }

  public isDestroyed(): boolean {
    return this.type === EntityType.EMPTY;
  }

  public onCollision(_other: Entity): void {
    // Walls typically block all movement
    // Some special walls might be destructible
  }

  public getDisplayChar(): string {
    if (this.isDestroyed()) return ' ';
    return this.destructible ? '▒' : '█';
  }

  public getDisplayColor(): string {
    if (this.isDestroyed()) return '#000000';
    return this.destructible ? '#555555' : '#333333';
  }
}

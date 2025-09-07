import { Entity, EntityType } from './Entity';

export class Player extends Entity {
  public alive: boolean;
  public diamondsCollected: number;

  constructor(x: number, y: number) {
    super(x, y, EntityType.PLAYER);
    this.solid = true;
    this.movable = true;
    this.collectible = false;
    this.fallable = false;
    this.alive = true;
    this.diamondsCollected = 0;
  }

  public canMoveTo(x: number, y: number): boolean {
    // Player can move to any position (collision will be handled by game logic)
    return x >= 0 && y >= 0;
  }

  public collectDiamond(): void {
    this.diamondsCollected++;
  }

  public die(): void {
    this.alive = false;
  }

  public getDisplayChar(): string {
    return this.alive ? '@' : '☠';
  }

  public getDisplayColor(): string {
    return this.alive ? '#00ff00' : '#ff0000';
  }
}

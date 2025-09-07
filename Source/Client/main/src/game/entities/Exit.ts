import { Entity, EntityType } from './Entity';

export class Exit extends Entity {
  public isOpen: boolean;
  public diamondsRequired: number;

  constructor(x: number, y: number, diamondsRequired: number = 0) {
    super(x, y, EntityType.EXIT);
    this.solid = false; // Player can walk through when open
    this.movable = false;
    this.collectible = false;
    this.fallable = false;
    this.isOpen = diamondsRequired === 0;
    this.diamondsRequired = diamondsRequired;
  }

  public canMoveTo(_x: number, _y: number): boolean {
    // Exits don't move
    return false;
  }

  public open(): void {
    this.isOpen = true;
    this.solid = false;
  }

  public close(): void {
    this.isOpen = false;
    this.solid = true;
  }

  public checkOpenCondition(diamondsCollected: number): void {
    if (diamondsCollected >= this.diamondsRequired && !this.isOpen) {
      this.open();
    }
  }

  public onCollision(other: Entity): void {
    if (other.type === EntityType.PLAYER && this.isOpen) {
      // Player reaches the exit - level complete!
      // This will be handled by the game logic
    }
  }

  public getDisplayChar(): string {
    return this.isOpen ? '◊' : '▲';
  }

  public getDisplayColor(): string {
    return this.isOpen ? '#00ff00' : '#ffff00';
  }
}

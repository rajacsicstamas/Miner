export const EntityType = {
  EMPTY: 'empty',
  PLAYER: 'player',
  BOULDER: 'boulder',
  DIAMOND: 'diamond',
  DIRT: 'dirt',
  WALL: 'wall',
  EXIT: 'exit'
} as const;

export type EntityType = typeof EntityType[keyof typeof EntityType];

export interface Position {
  x: number;
  y: number;
}

export abstract class Entity {
  public x: number;
  public y: number;
  public type: EntityType;
  public solid: boolean;
  public movable: boolean;
  public collectible: boolean;
  public fallable: boolean;
  // Animation support
  public previousX: number;
  public previousY: number;
  public isAnimating: boolean;

  constructor(x: number, y: number, type: EntityType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.solid = false;
    this.movable = false;
    this.collectible = false;
    this.fallable = false;
    // Initialize animation state
    this.previousX = x;
    this.previousY = y;
    this.isAnimating = false;
  }

  public getPosition(): Position {
    return { x: this.x, y: this.y };
  }

  public setPosition(x: number, y: number): void {
    // Only set animation flag if position is changing
    if (x !== this.x || y !== this.y) {
      // Store current position as previous before updating
      this.previousX = this.x;
      this.previousY = this.y;
      this.isAnimating = true;
    }
    this.x = x;
    this.y = y;
  }

  /**
   * Get interpolated position for smooth animation
   * @param progress Animation progress from 0.0 to 1.0
   */
  public getInterpolatedPosition(progress: number): Position {
    if (!this.isAnimating) {
      return { x: this.x, y: this.y };
    }

    const deltaX = this.x - this.previousX;
    const deltaY = this.y - this.previousY;
    
    return {
      x: this.previousX + (deltaX * progress),
      y: this.previousY + (deltaY * progress)
    };
  }

  /**
   * Reset animation state (called at start of new turn)
   */
  public resetAnimation(): void {
    this.previousX = this.x;
    this.previousY = this.y;
    this.isAnimating = false;
  }

  public canMoveTo(_x: number, _y: number): boolean {
    return true; // Override in subclasses
  }

  public update(): void {
    // Override in subclasses for entity-specific behavior
  }

  public onCollision(_other: Entity): void {
    // Override in subclasses for collision handling
  }

  public getDisplayChar(): string {
    // Default display character - override in subclasses
    return '?';
  }

  public getDisplayColor(): string {
    // Default color - override in subclasses
    return '#ffffff';
  }
}

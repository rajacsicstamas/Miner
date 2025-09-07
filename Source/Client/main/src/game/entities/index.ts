// Core Entity System
export { Entity, EntityType, type Position } from './Entity';

// Game Entities
export { Player } from './Player';
export { Boulder } from './Boulder';
export { Diamond } from './Diamond';
export { Dirt } from './Dirt';
export { Wall } from './Wall';
export { Exit } from './Exit';

// Import classes for factory
import { Entity, EntityType } from './Entity';
import { Player } from './Player';
import { Boulder } from './Boulder';
import { Diamond } from './Diamond';
import { Dirt } from './Dirt';
import { Wall } from './Wall';
import { Exit } from './Exit';

// Entity Factory
export class EntityFactory {
  public static createEntity(type: EntityType, x: number, y: number, ...args: any[]): Entity {
    switch (type) {
      case EntityType.PLAYER:
        return new Player(x, y);
      case EntityType.BOULDER:
        return new Boulder(x, y);
      case EntityType.DIAMOND:
        return new Diamond(x, y, args[0] || 10);
      case EntityType.DIRT:
        return new Dirt(x, y);
      case EntityType.WALL:
        return new Wall(x, y, args[0] || false);
      case EntityType.EXIT:
        return new Exit(x, y, args[0] || 0);
      default:
        throw new Error(`Unknown entity type: ${type}`);
    }
  }

  public static createPlayer(x: number, y: number): Player {
    return new Player(x, y);
  }

  public static createBoulder(x: number, y: number): Boulder {
    return new Boulder(x, y);
  }

  public static createDiamond(x: number, y: number, points: number = 10): Diamond {
    return new Diamond(x, y, points);
  }

  public static createDirt(x: number, y: number): Dirt {
    return new Dirt(x, y);
  }

  public static createWall(x: number, y: number, destructible: boolean = false): Wall {
    return new Wall(x, y, destructible);
  }

  public static createExit(x: number, y: number, diamondsRequired: number = 0): Exit {
    return new Exit(x, y, diamondsRequired);
  }
}

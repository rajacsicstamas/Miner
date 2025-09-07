import { GameGrid } from '../game/core/GameGrid';
import { Direction } from '../game/core/InputManager';
import { Player, Boulder, Diamond, Dirt, EntityType, Exit } from '../game/entities';

export interface MovementResult {
	success: boolean;
	diamondCollected?: boolean;
	playerDied?: boolean;
	levelComplete?: boolean;
	scoreChange?: number;
}

export interface PhysicsResult {
	entityMoved: boolean;
	playerDied?: boolean;
}

/**
 * Pure functions for game logic - no side effects, easily testable
 */
export class GameLogic {
	
	/**
	 * Attempt to move player in given direction
	 */
	static movePlayer(grid: GameGrid, direction: Direction): MovementResult {
		const player = grid.findEntityByType(EntityType.PLAYER) as Player;
		if (!player || !player.alive) {
			return { success: false };
		}

		const { x, y } = player.getPosition();
		const { dx, dy } = this.getDirectionVector(direction);
		const newX = x + dx;
		const newY = y + dy;

		// Check bounds
		if (!grid.isValidPosition(newX, newY)) {
			return { success: false };
		}

		// Check what's at the target position
		const targetEntity = grid.getEntity(newX, newY);
		if (!targetEntity) {
			// Empty space - simple move
			return this.executePlayerMove(grid, player, newX, newY);
		}

		// Handle collision with different entity types
		switch (targetEntity.type) {
			case EntityType.DIRT:
				return this.handleDirtMovement(grid, player, targetEntity as Dirt, newX, newY);

			case EntityType.DIAMOND:
				return this.handleDiamondCollection(grid, player, targetEntity as Diamond, newX, newY);

			case EntityType.BOULDER:
				return this.handleBoulderPush(grid, player, targetEntity, newX, newY, direction);

			case EntityType.WALL:
				return { success: false };

			case EntityType.EXIT:
				return this.handleExitMovement(grid, player, targetEntity, newX, newY);

			default:
				return { success: false };
		}
	}

	/**
	 * Update physics for falling objects
	 */
	static updatePhysics(grid: GameGrid, _deltaTime: number): PhysicsResult {
		let entityMoved = false;
		let playerDied = false;

		const { width, height } = grid.getDimensions();

		// Process from bottom to top to avoid double-processing
		for (let y = height - 2; y >= 0; y--) {
			for (let x = 0; x < width; x++) {
				const entity = grid.getEntity(x, y);
				
				if (entity && entity.type === EntityType.BOULDER) {
					const boulder = entity as Boulder;
					const moveResult = this.tryMoveBoulderDown(grid, boulder, x, y);
					
					if (moveResult.moved) {
						entityMoved = true;
					} else {
						// Boulder couldn't move - check if it should stop falling
						const belowY = y + 1;
						if (grid.isValidPosition(x, belowY) && grid.getEntity(x, belowY)) {
							// Something is blocking the boulder - stop falling
							if (boulder.falling) {
								boulder.stopFalling();
							}
						}
					}
					
					if (moveResult.playerKilled) {
						playerDied = true;
					}
				} else if (entity && entity.type === EntityType.DIAMOND) {
					const diamond = entity as Diamond;
					const moveResult = this.tryMoveDiamondDown(grid, diamond, x, y);
					
					if (moveResult.moved) {
						entityMoved = true;
					} else {
						// Diamond couldn't move - check if it should stop falling
						const belowY = y + 1;
						if (grid.isValidPosition(x, belowY) && grid.getEntity(x, belowY)) {
							// Something is blocking the diamond - stop falling
							if (diamond.falling) {
								diamond.stopFalling();
							}
						}
					}
					
					if (moveResult.playerKilled) {
						playerDied = true;
					}
				}
			}
		}

		// Second pass: Check for rolling after falling has been processed
		for (let y = height - 2; y >= 0; y--) {
			for (let x = 0; x < width; x++) {
				const entity = grid.getEntity(x, y);
				
				if (entity && (entity.type === EntityType.BOULDER || entity.type === EntityType.DIAMOND)) {
					const rollResult = this.tryRolling(grid, entity, x, y);
					
					if (rollResult.moved) {
						entityMoved = true;
					}
					
					if (rollResult.playerKilled) {
						playerDied = true;
					}
				}
			}
		}

		return { entityMoved, playerDied };
	}

	/**
	 * Check if level is complete
	 */
	static checkLevelComplete(grid: GameGrid): boolean {
		const player = grid.findEntityByType(EntityType.PLAYER) as Player;
		const exit = grid.findEntityByType(EntityType.EXIT) as Exit;
		
		if (!player || !exit) {
			return false;
		}

		// Check if player is at exit position and has enough diamonds
		const playerPos = player.getPosition();
		const exitPos = exit.getPosition();
		
		const playerAtExit = playerPos.x === exitPos.x && playerPos.y === exitPos.y;
		const hasEnoughDiamonds = player.diamondsCollected >= exit.diamondsRequired;
		
		return playerAtExit && hasEnoughDiamonds && exit.isOpen;
	}

	// Private helper methods

	private static getDirectionVector(direction: Direction): { dx: number; dy: number } {
		switch (direction) {
			case Direction.UP: return { dx: 0, dy: -1 };
			case Direction.DOWN: return { dx: 0, dy: 1 };
			case Direction.LEFT: return { dx: -1, dy: 0 };
			case Direction.RIGHT: return { dx: 1, dy: 0 };
		}
	}

	private static executePlayerMove(grid: GameGrid, player: Player, newX: number, newY: number): MovementResult {
		const success = grid.moveEntity(player.getPosition().x, player.getPosition().y, newX, newY);
		return { success };
	}

	private static handleDirtMovement(grid: GameGrid, player: Player, dirt: Dirt, newX: number, newY: number): MovementResult {
		// Player digs through dirt
		dirt.dig();
		return this.executePlayerMove(grid, player, newX, newY);
	}

	private static handleDiamondCollection(grid: GameGrid, player: Player, diamond: Diamond, newX: number, newY: number): MovementResult {
		// Collect the diamond
		player.collectDiamond();
		
		// Remove diamond from grid
		grid.removeEntity(newX, newY);
		
		// Move player to diamond position
		const moveResult = this.executePlayerMove(grid, player, newX, newY);
		
		return {
			...moveResult,
			diamondCollected: true,
			scoreChange: diamond.points
		};
	}

	private static handleBoulderPush(grid: GameGrid, player: Player, _boulder: any, newX: number, newY: number, direction: Direction): MovementResult {
		// Only allow horizontal pushing of boulders
		if (direction === Direction.UP || direction === Direction.DOWN) {
			// Cannot push boulders vertically - movement blocked
			return { success: false };
		}

		const { dx, dy } = this.getDirectionVector(direction);
		const boulderNewX = newX + dx;
		const boulderNewY = newY + dy;

		// Check if boulder destination is valid
		if (!grid.isValidPosition(boulderNewX, boulderNewY)) {
			return { success: false };
		}

		const boulderTarget = grid.getEntity(boulderNewX, boulderNewY);
		if (boulderTarget) {
			return { success: false };
		}

		// Push the boulder
		const boulderMoved = grid.moveEntity(newX, newY, boulderNewX, boulderNewY);
		if (!boulderMoved) {
			return { success: false };
		}

		// Move player to boulder's old position
		return this.executePlayerMove(grid, player, newX, newY);
	}

	private static handleExitMovement(_grid: GameGrid, player: Player, exit: any, newX: number, newY: number): MovementResult {
		// Check if player has collected enough diamonds
		const diamondsRequired = exit.diamondsRequired || 0;
		
		if (player.diamondsCollected < diamondsRequired) {
			return { success: false };
		}

		// Check if exit is open
		if (exit.solid) {
			return { success: false };
		}

		// Move player to exit
		player.setPosition(newX, newY);
		
		return {
			success: true,
			levelComplete: true
		};
	}

	private static tryMoveBoulderDown(grid: GameGrid, boulder: Boulder, x: number, y: number): { moved: boolean; playerKilled: boolean } {
		const belowY = y + 1;
		
		// Check if space below is free
		if (!grid.isValidPosition(x, belowY)) {
			boulder.stopFalling();
			return { moved: false, playerKilled: false };
		}

		const entityBelow = grid.getEntity(x, belowY);
		if (!entityBelow) {
			// Boulder can fall - set falling state and move
			boulder.startFalling();
			const moved = grid.moveEntity(x, y, x, belowY);
			// Keep falling state - don't stop it here
			return { moved, playerKilled: false };
		}

		// Check if falling onto player - only kill if boulder was falling
		if (entityBelow.type === EntityType.PLAYER) {
			if (boulder.falling) {
				(entityBelow as Player).alive = false;
				return { moved: false, playerKilled: true };
			}
		}

		// Boulder cannot fall - stop falling state
		boulder.stopFalling();
		return { moved: false, playerKilled: false };
	}

	private static tryMoveDiamondDown(grid: GameGrid, diamond: Diamond, x: number, y: number): { moved: boolean; playerKilled: boolean } {
		const belowY = y + 1;
		
		// Check if space below is free
		if (!grid.isValidPosition(x, belowY)) {
			diamond.stopFalling();
			return { moved: false, playerKilled: false };
		}

		const entityBelow = grid.getEntity(x, belowY);
		if (!entityBelow) {
			// Diamond can fall - set falling state and move
			diamond.startFalling();
			const moved = grid.moveEntity(x, y, x, belowY);
			// Keep falling state - don't stop it here
			return { moved, playerKilled: false };
		}

		// Check if falling onto player - only kill if diamond was falling
		if (entityBelow.type === EntityType.PLAYER) {
			if (diamond.falling) {
				(entityBelow as Player).alive = false;
				return { moved: false, playerKilled: true };
			}
		}

		// Diamond cannot fall - stop falling state
		diamond.stopFalling();
		return { moved: false, playerKilled: false };
	}

	/**
	 * Try to roll a boulder or diamond off another boulder/diamond
	 * Rolling rules:
	 * - Bottom object is a diamond or boulder and isn't falling
	 * - Top object is a diamond or boulder  
	 * - There is empty space beside and diagonally down of top object
	 * - First try right rolling, then left rolling
	 */
	private static tryRolling(grid: GameGrid, entity: any, x: number, y: number): { moved: boolean; playerKilled: boolean } {
		// Check if there's something directly below
		const belowY = y + 1;
		if (!grid.isValidPosition(x, belowY)) {
			return { moved: false, playerKilled: false };
		}

		const entityBelow = grid.getEntity(x, belowY);
		if (!entityBelow) {
			return { moved: false, playerKilled: false }; // Nothing below, can't roll
		}

		// Check if bottom object is a boulder or diamond and not falling
		const isBottomRollable = (entityBelow.type === EntityType.BOULDER || entityBelow.type === EntityType.DIAMOND);
		const isBottomFalling = (entityBelow as Boulder | Diamond).falling;
		
		if (!isBottomRollable || isBottomFalling) {
			return { moved: false, playerKilled: false }; // Bottom object not suitable for rolling
		}

		// Try rolling right first
		const rollResult = this.tryRollDirection(grid, entity, x, y, 1); // 1 for right
		if (rollResult.moved) {
			return rollResult;
		}

		// Try rolling left if right failed
		return this.tryRollDirection(grid, entity, x, y, -1); // -1 for left
	}

	/**
	 * Try to roll in a specific direction (right = 1, left = -1)
	 */
	private static tryRollDirection(grid: GameGrid, entity: any, x: number, y: number, direction: number): { moved: boolean; playerKilled: boolean } {
		const sideX = x + direction;
		const diagonalY = y + 1;
		const diagonalX = x + direction;

		// Check bounds
		if (!grid.isValidPosition(sideX, y) || !grid.isValidPosition(diagonalX, diagonalY)) {
			return { moved: false, playerKilled: false };
		}

		// Check if side position is empty
		const sideEntity = grid.getEntity(sideX, y);
		if (sideEntity) {
			return { moved: false, playerKilled: false }; // Side blocked
		}

		// Check if diagonal position is empty
		const diagonalEntity = grid.getEntity(diagonalX, diagonalY);
		if (diagonalEntity) {
			return { moved: false, playerKilled: false }; // Diagonal blocked
		}

		// Can roll! Move the entity diagonally (one step) and start falling
		const moved = grid.moveEntity(x, y, diagonalX, diagonalY);
		if (moved) {
			// Start falling state for the rolled object
			if (entity.type === EntityType.BOULDER) {
				(entity as Boulder).startFalling();
			} else if (entity.type === EntityType.DIAMOND) {
				(entity as Diamond).startFalling();
			}
		}

		return { moved, playerKilled: false };
	}
}

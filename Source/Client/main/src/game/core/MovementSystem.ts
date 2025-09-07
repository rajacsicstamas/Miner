import { GameGrid } from './GameGrid';
import { Entity, EntityType, Player, Dirt, Diamond } from '../entities';
import { Direction } from './InputManager';

export interface MovementResult
{
	success: boolean;
	diamondCollected?: boolean;
	playerDied?: boolean;
	message?: string;
}

export class MovementSystem
{
	private grid: GameGrid;

	constructor( grid: GameGrid )
	{
		this.grid = grid;
	}

	public movePlayer( direction: Direction ): MovementResult
	{
		const player = this.grid.findEntityByType( EntityType.PLAYER ) as Player;
		if ( !player || !player.alive )
		{
			return { success: false };
		}

		const { x, y } = player.getPosition();
		const { dx, dy } = this.getDirectionVector( direction );
		const newX = x + dx;
		const newY = y + dy;

		// Check bounds
		if ( !this.grid.isValidPosition( newX, newY ) )
		{
			return { success: false };
		}

		const targetEntity = this.grid.getEntity( newX, newY );

		// Handle movement based on target entity
		if ( !targetEntity )
		{
			// Move to empty space
			return this.movePlayerToPosition( player, newX, newY );
		}

		switch ( targetEntity.type )
		{
			case EntityType.DIRT:
				return this.handleDirtMovement( player, targetEntity as Dirt, newX, newY );

			case EntityType.DIAMOND:
				return this.handleDiamondCollection( player, targetEntity as Diamond, newX, newY );

			case EntityType.BOULDER:
				return this.handleBoulderPush( player, targetEntity, newX, newY, direction );

			case EntityType.WALL:
				return { success: false };

			case EntityType.EXIT:
				return this.handleExitMovement( player, targetEntity, newX, newY );

			default:
				return { success: false };
		}
	}

	private movePlayerToPosition( player: Player, newX: number, newY: number ): MovementResult
	{
		const { x, y } = player.getPosition();
		const success = this.grid.moveEntity( x, y, newX, newY );
		return { success };
	}

	private handleDirtMovement( player: Player, dirt: Dirt, newX: number, newY: number ): MovementResult
	{
		// Player digs through dirt
		dirt.dig();
		return this.movePlayerToPosition( player, newX, newY );
	}

	private handleDiamondCollection( player: Player, _diamond: Diamond, newX: number, newY: number ): MovementResult
	{
		// Collect the diamond
		player.collectDiamond();
		
		// Remove diamond from grid
		this.grid.removeEntity( newX, newY );
		
		// Move player to diamond position
		const moveResult = this.movePlayerToPosition( player, newX, newY );
		
		return {
			...moveResult,
			diamondCollected: true
		};
	}

	private handleBoulderPush( player: Player, _boulder: Entity, newX: number, newY: number, direction: Direction ): MovementResult
	{
		// Check if boulder can be pushed
		const { dx, dy } = this.getDirectionVector( direction );
		const boulderNewX = newX + dx;
		const boulderNewY = newY + dy;

		// Check if boulder destination is valid
		if ( !this.grid.isValidPosition( boulderNewX, boulderNewY ) )
		{
			return { success: false };
		}

		const boulderTarget = this.grid.getEntity( boulderNewX, boulderNewY );
		if ( boulderTarget )
		{
			return { success: false };
		}

		// Push the boulder
		const boulderMoved = this.grid.moveEntity( newX, newY, boulderNewX, boulderNewY );
		if ( !boulderMoved )
		{
			return { success: false };
		}

		// Move player to boulder's old position
		return this.movePlayerToPosition( player, newX, newY );
	}

	private handleExitMovement( player: Player, exit: Entity, newX: number, newY: number ): MovementResult
	{
		// Check if player has collected enough diamonds
		const exitEntity = exit as any; // Exit entity should have diamondsRequired property
		const diamondsRequired = exitEntity.diamondsRequired || 0;
		
		if ( player.diamondsCollected < diamondsRequired )
		{
			return { 
				success: false, 
				message: `Need ${diamondsRequired - player.diamondsCollected} more diamonds to exit!` 
			};
		}

		// Check if exit is open (should be open if we have enough diamonds)
		if ( exit.solid )
		{
			return { success: false };
		}

		// Player reaches the exit with enough diamonds - move them to the exit position
		// But do it in a special way that preserves both player and exit for level completion detection
		const { x, y } = player.getPosition();
		
		// Update player position without using grid.moveEntity to avoid overwriting the exit
		player.setPosition( newX, newY );
		
		// Remove player from old position
		this.grid.setEntity( x, y, null );
		
		// Don't set player at exit position - just update player's internal position
		// This way both player position and exit entity are preserved for completion check
		
		return {
			success: true,
			message: 'Level complete! Well done!'
		};
	}

	private getDirectionVector( direction: Direction ): { dx: number, dy: number }
	{
		switch ( direction )
		{
			case Direction.UP:
				return { dx: 0, dy: -1 };
			case Direction.DOWN:
				return { dx: 0, dy: 1 };
			case Direction.LEFT:
				return { dx: -1, dy: 0 };
			case Direction.RIGHT:
				return { dx: 1, dy: 0 };
			default:
				return { dx: 0, dy: 0 };
		}
	}

	public canMove( direction: Direction ): boolean
	{
		const player = this.grid.findEntityByType( EntityType.PLAYER ) as Player;
		if ( !player || !player.alive )
		{
			return false;
		}

		const { x, y } = player.getPosition();
		const { dx, dy } = this.getDirectionVector( direction );
		const newX = x + dx;
		const newY = y + dy;

		if ( !this.grid.isValidPosition( newX, newY ) )
		{
			return false;
		}

		const targetEntity = this.grid.getEntity( newX, newY );
		if ( !targetEntity )
		{
			return true; // Can move to empty space
		}

		// Check if we can interact with the target entity
		switch ( targetEntity.type )
		{
			case EntityType.DIRT:
			case EntityType.DIAMOND:
				return true;
			case EntityType.BOULDER:
				// Check if boulder can be pushed
				const boulderNewX = newX + dx;
				const boulderNewY = newY + dy;
				if ( !this.grid.isValidPosition( boulderNewX, boulderNewY ) )
				{
					return false;
				}
				const boulderTarget = this.grid.getEntity( boulderNewX, boulderNewY );
				return !boulderTarget || !boulderTarget.solid;
			case EntityType.EXIT:
				// Check if player has enough diamonds to use the exit
				const exitEntity = targetEntity as any;
				const diamondsRequired = exitEntity.diamondsRequired || 0;
				return player.diamondsCollected >= diamondsRequired;
			case EntityType.WALL:
			default:
				return false;
		}
	}
}

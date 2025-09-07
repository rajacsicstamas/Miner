import { GameGrid } from './GameGrid';
import { Entity, EntityType, Boulder, Diamond } from '../entities';

export interface PhysicsResult
{
	entityMoved: boolean;
	impactOccurred: boolean;
	playerCrushed: boolean;
}

export class PhysicsSystem
{
	private grid: GameGrid;
	private fallDelay: number;
	private lastFallTime: number;

	constructor( grid: GameGrid )
	{
		this.grid = grid;
		this.fallDelay = 300; // 300ms between fall steps
		this.lastFallTime = 0;
	}

	public update( _deltaTime: number ): PhysicsResult
	{
		const currentTime = Date.now();
		
		if ( currentTime - this.lastFallTime < this.fallDelay )
		{
			return {
				entityMoved: false,
				impactOccurred: false,
				playerCrushed: false
			};
		}

		this.lastFallTime = currentTime;
		return this.applyGravity();
	}

	private applyGravity(): PhysicsResult
	{
		const result: PhysicsResult = {
			entityMoved: false,
			impactOccurred: false,
			playerCrushed: false
		};

		const { width, height } = this.grid.getDimensions();
		
		// Process from bottom to top to avoid moving entities multiple times
		for ( let y = height - 2; y >= 0; y-- )
		{
			for ( let x = 0; x < width; x++ )
			{
				const entity = this.grid.getEntity( x, y );
				
				if ( entity && this.canFall( entity ) )
				{
					const fallResult = this.makeEntityFall( entity, x, y );
					
					if ( fallResult.entityMoved )
					{
						result.entityMoved = true;
					}
					
					if ( fallResult.impactOccurred )
					{
						result.impactOccurred = true;
					}
					
					if ( fallResult.playerCrushed )
					{
						result.playerCrushed = true;
					}
				}
			}
		}

		return result;
	}

	private canFall( entity: Entity ): boolean
	{
		// Only boulders and diamonds can fall
		return entity.type === EntityType.BOULDER || 
			   entity.type === EntityType.DIAMOND;
	}

	private makeEntityFall( entity: Entity, x: number, y: number ): PhysicsResult
	{
		const result: PhysicsResult = {
			entityMoved: false,
			impactOccurred: false,
			playerCrushed: false
		};

		const belowY = y + 1;
		const { height } = this.grid.getDimensions();

		// Check if there's space below
		if ( belowY >= height )
		{
			return result; // At bottom of grid
		}

		const entityBelow = this.grid.getEntity( x, belowY );

		if ( !entityBelow )
		{
			// Empty space below - entity can fall
			this.grid.removeEntity( x, y );
			entity.setPosition( x, belowY );
			this.grid.setEntity( x, belowY, entity );
			
			// Mark entity as falling
			if ( entity.type === EntityType.BOULDER )
			{
				( entity as Boulder ).startFalling();
			}
			else if ( entity.type === EntityType.DIAMOND )
			{
				( entity as Diamond ).startFalling();
			}

			result.entityMoved = true;
		}
		else
		{
			// Something is below - try to roll left or right before giving up
			const rollResult = this.tryRolling( entity, x, y );
			if ( rollResult.entityMoved )
			{
				result.entityMoved = true;
			}
			else
			{
				// Can't roll, handle impact
				const impactResult = this.handleImpact( entity, entityBelow, x, y, belowY );
				result.impactOccurred = impactResult.impactOccurred;
				result.playerCrushed = impactResult.playerCrushed;
			}
		}

		return result;
	}

	private tryRolling( entity: Entity, x: number, y: number ): PhysicsResult
	{
		const result: PhysicsResult = {
			entityMoved: false,
			impactOccurred: false,
			playerCrushed: false
		};

		// Only boulders and diamonds can roll
		if ( entity.type !== EntityType.BOULDER && entity.type !== EntityType.DIAMOND )
		{
			return result;
		}

		const { width } = this.grid.getDimensions();
		
		// Try rolling left first, then right (random order could be added later)
		const directions = [-1, 1]; // left, right
		
		for ( const dir of directions )
		{
			const newX = x + dir;
			
			// Check bounds
			if ( newX < 0 || newX >= width )
			{
				continue;
			}
			
			// Check if we can roll in this direction
			if ( this.canRollToPosition( entity, x, y, newX, y ) )
			{
				// Move entity to new position
				this.grid.removeEntity( x, y );
				entity.setPosition( newX, y );
				this.grid.setEntity( newX, y, entity );
				
				result.entityMoved = true;
				return result;
			}
		}
		
		return result;
	}

	private canRollToPosition( _entity: Entity, fromX: number, fromY: number, toX: number, toY: number ): boolean
	{
		// For rolling, we need to check:
		// 1. The target position (toX, toY) is empty
		// 2. The position below the target (toX, toY+1) is empty (so the entity can fall after rolling)
		// 3. The entity below the current position is solid (round objects roll off solid surfaces)
		
		const entityAtTarget = this.grid.getEntity( toX, toY );
		if ( entityAtTarget )
		{
			return false; // Target position is occupied
		}
		
		// Check if there's empty space below the target for the entity to fall into
		const { height } = this.grid.getDimensions();
		const belowTargetY = toY + 1;
		
		if ( belowTargetY >= height )
		{
			return false; // At bottom edge, can't roll
		}
		
		const entityBelowTarget = this.grid.getEntity( toX, belowTargetY );
		if ( entityBelowTarget )
		{
			return false; // No space below target to fall into
		}
		
		// Check that the entity below current position is a boulder or diamond (something round to roll off of)
		const belowCurrentY = fromY + 1;
		if ( belowCurrentY >= height )
		{
			return false; // At bottom edge
		}
		
		const entityBelowCurrent = this.grid.getEntity( fromX, belowCurrentY );
		if ( !entityBelowCurrent || 
			 ( entityBelowCurrent.type !== EntityType.BOULDER && 
			   entityBelowCurrent.type !== EntityType.DIAMOND ) )
		{
			return false; // Can only roll off other boulders or diamonds
		}
		
		return true;
	}

	private handleImpact( 
		fallingEntity: Entity, 
		targetEntity: Entity, 
		_x: number, 
		_y: number, 
		_belowY: number 
	): PhysicsResult
	{
		const result: PhysicsResult = {
			entityMoved: false,
			impactOccurred: false,
			playerCrushed: false
		};

		// Check if falling entity was actually falling
		let wasFalling = false;
		if ( fallingEntity.type === EntityType.BOULDER )
		{
			wasFalling = ( fallingEntity as Boulder ).isFalling();
			( fallingEntity as Boulder ).stopFalling();
		}
		else if ( fallingEntity.type === EntityType.DIAMOND )
		{
			wasFalling = ( fallingEntity as Diamond ).isFalling();
			( fallingEntity as Diamond ).stopFalling();
		}

		if ( wasFalling )
		{
			result.impactOccurred = true;

			// If a falling boulder or diamond hits the player, crush them
			if ( ( fallingEntity.type === EntityType.BOULDER || 
				   fallingEntity.type === EntityType.DIAMOND ) && 
				 targetEntity.type === EntityType.PLAYER )
			{
				result.playerCrushed = true;
			}
		}

		return result;
	}

	public setFallDelay( delay: number ): void
	{
		this.fallDelay = delay;
	}
}

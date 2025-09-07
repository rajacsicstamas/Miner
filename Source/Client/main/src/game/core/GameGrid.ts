import { Entity, EntityType } from '../entities';

export interface GridDimensions
{
	width: number;
	height: number;
}

export class GameGrid
{
	private grid: ( Entity | null )[][];
	private width: number;
	private height: number;

	constructor( width: number, height: number )
	{
		this.width = width;
		this.height = height;
		this.grid = this.initializeGrid();
	}

	private initializeGrid(): ( Entity | null )[][]
	{
		const grid: ( Entity | null )[][] = [];
		for ( let y = 0; y < this.height; y++ )
		{
			grid[y] = [];
			for ( let x = 0; x < this.width; x++ )
			{
				grid[y][x] = null; // Empty space
			}
		}
		return grid;
	}

	public getDimensions(): GridDimensions
	{
		return { width: this.width, height: this.height };
	}

	public isValidPosition( x: number, y: number ): boolean
	{
		return x >= 0 && x < this.width && y >= 0 && y < this.height;
	}

	public getEntity( x: number, y: number ): Entity | null
	{
		if ( !this.isValidPosition( x, y ) )
		{
			return null;
		}
		return this.grid[y][x];
	}

	public setEntity( x: number, y: number, entity: Entity | null ): boolean
	{
		if ( !this.isValidPosition( x, y ) )
		{
			return false;
		}

		// Update entity position if it's not null
		if ( entity )
		{
			entity.setPosition( x, y );
		}

		this.grid[y][x] = entity;
		return true;
	}

	public moveEntity( fromX: number, fromY: number, toX: number, toY: number ): boolean
	{
		if ( !this.isValidPosition( fromX, fromY ) || !this.isValidPosition( toX, toY ) )
		{
			return false;
		}

		const entity = this.getEntity( fromX, fromY );
		if ( !entity )
		{
			return false;
		}

		// Check if destination is available
		const targetEntity = this.getEntity( toX, toY );
		if ( targetEntity && targetEntity.solid )
		{
			return false; // Cannot move to solid entity
		}

		// Move the entity
		this.setEntity( fromX, fromY, null );
		this.setEntity( toX, toY, entity );
		
		// Update entity's position coordinates and animation state
		entity.setPosition(toX, toY);

		return true;
	}

	public removeEntity( x: number, y: number ): Entity | null
	{
		if ( !this.isValidPosition( x, y ) )
		{
			return null;
		}

		const entity = this.getEntity( x, y );
		this.setEntity( x, y, null );
		return entity;
	}

	public findEntityByType( entityType: EntityType ): Entity | null
	{
		for ( let y = 0; y < this.height; y++ )
		{
			for ( let x = 0; x < this.width; x++ )
			{
				const entity = this.grid[y][x];
				if ( entity && entity.type === entityType )
				{
					return entity;
				}
			}
		}
		return null;
	}

	public findAllEntitiesByType( entityType: EntityType ): Entity[]
	{
		const entities: Entity[] = [];
		for ( let y = 0; y < this.height; y++ )
		{
			for ( let x = 0; x < this.width; x++ )
			{
				const entity = this.grid[y][x];
				if ( entity && entity.type === entityType )
				{
					entities.push( entity );
				}
			}
		}
		return entities;
	}

	public getNeighbors( x: number, y: number ): ( Entity | null )[]
	{
		const neighbors: ( Entity | null )[] = [];
		const directions = [
			{ dx: 0, dy: -1 }, // North
			{ dx: 1, dy: 0 },  // East
			{ dx: 0, dy: 1 },  // South
			{ dx: -1, dy: 0 }  // West
		];

		for ( const dir of directions )
		{
			const nx = x + dir.dx;
			const ny = y + dir.dy;
			neighbors.push( this.getEntity( nx, ny ) );
		}

		return neighbors;
	}

	public isEmpty( x: number, y: number ): boolean
	{
		const entity = this.getEntity( x, y );
		return entity === null || entity.type === EntityType.EMPTY;
	}

	public isSolid( x: number, y: number ): boolean
	{
		const entity = this.getEntity( x, y );
		return entity !== null && entity.solid;
	}

	public clear(): void
	{
		this.grid = this.initializeGrid();
	}

	public getAllEntities(): Entity[]
	{
		const entities: Entity[] = [];
		for ( let y = 0; y < this.height; y++ )
		{
			for ( let x = 0; x < this.width; x++ )
			{
				const entity = this.grid[y][x];
				if ( entity )
				{
					entities.push( entity );
				}
			}
		}
		return entities;
	}

	// Debug method to print the grid
	public printGrid(): string
	{
		let output = '';
		for ( let y = 0; y < this.height; y++ )
		{
			let row = '';
			for ( let x = 0; x < this.width; x++ )
			{
				const entity = this.grid[y][x];
				row += entity ? entity.getDisplayChar() : ' ';
			}
			output += row + '\n';
		}
		return output;
	}
}

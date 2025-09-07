import { Entity, EntityType } from './Entity';

export class Boulder extends Entity
{
	public falling: boolean;
	public canRoll: boolean;

	constructor( x: number, y: number )
	{
		super( x, y, EntityType.BOULDER );
		this.solid = true;
		this.movable = true;
		this.collectible = false;
		this.fallable = true;
		this.falling = false;
		this.canRoll = true;
	}

	public canMoveTo( x: number, y: number ): boolean
	{
		// Boulders can only move due to gravity or rolling
		return x >= 0 && y >= 0;
	}

	public startFalling(): void
	{
		this.falling = true;
	}

	public stopFalling(): void
	{
		this.falling = false;
	}

	public isFalling(): boolean
	{
		return this.falling;
	}

	public update(): void
	{
		// Physics update will be handled by the game engine
		// This is where we'd implement falling logic
	}

	public onCollision( other: Entity ): void
	{
		// Handle collision with player (crush) or other entities
		if ( other.type === EntityType.PLAYER && this.falling )
		{
			// Player gets crushed by falling boulder
			other.onCollision( this );
		}
	}

	public getDisplayChar(): string
	{
		return '●';
	}

	public getDisplayColor(): string
	{
		return this.falling ? '#888888' : '#666666';
	}
}

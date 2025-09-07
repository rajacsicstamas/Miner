import { Level } from './Level';
import { InputManager, Direction } from './InputManager';
import { MovementSystem, type MovementResult } from './MovementSystem';
import { PhysicsSystem, type PhysicsResult } from './PhysicsSystem';
import { Player, EntityType, Exit } from '../entities';

export interface GameState
{
	level: Level;
	score: number;
	lives: number;
	timeRemaining: number;
	isPlaying: boolean;
	isPaused: boolean;
	gameMessage: string;
}

export class GameController
{
	private inputManager: InputManager;
	private movementSystem: MovementSystem;
	private physicsSystem: PhysicsSystem;
	private gameState: GameState;
	private lastMoveTime: number;
	private moveDelay: number; // Milliseconds between moves
	private onLevelComplete?: () => void;
	private levelCompleteTriggered: boolean;
	private messageTimeout?: number;

	constructor( level: Level, onLevelComplete?: () => void )
	{
		this.inputManager = new InputManager();
		this.movementSystem = new MovementSystem( level.getGrid() );
		this.physicsSystem = new PhysicsSystem( level.getGrid() );
		this.lastMoveTime = 0;
		this.moveDelay = 150; // 150ms delay between moves
		this.onLevelComplete = onLevelComplete;
		this.levelCompleteTriggered = false;

		this.gameState = {
			level,
			score: 0,
			lives: 3,
			timeRemaining: level.getTimeLimit(),
			isPlaying: true,
			isPaused: false,
			gameMessage: ''
		};
	}

	public update( deltaTime: number ): void
	{
		if ( !this.gameState.isPlaying || this.gameState.isPaused )
		{
			return;
		}

		// Update time
		this.gameState.timeRemaining -= deltaTime;
		if ( this.gameState.timeRemaining <= 0 )
		{
			this.handleTimeUp();
			return;
		}

		// Update physics (gravity, falling objects)
		const physicsResult = this.physicsSystem.update( deltaTime );
		this.handlePhysicsResult( physicsResult );

		// Handle input with delay to prevent too fast movement
		const currentTime = Date.now();
		if ( currentTime - this.lastMoveTime > this.moveDelay )
		{
			this.handleInput();
		}

		// Check win condition
		this.checkLevelComplete();
	}

	private handleInput(): void
	{
		const pressedDirection = this.inputManager.getPressedDirection();
		if ( pressedDirection )
		{
			const result = this.movementSystem.movePlayer( pressedDirection );
			this.handleMovementResult( result );
			this.lastMoveTime = Date.now();
		}
	}

	private handleMovementResult( result: MovementResult ): void
	{
		if ( result.success )
		{
			if ( result.diamondCollected )
			{
				this.gameState.score += 10; // Points per diamond
				
				// Check if exit should open
				const player = this.gameState.level.getGrid().findEntityByType( EntityType.PLAYER ) as Player;
				const exit = this.gameState.level.getGrid().findEntityByType( EntityType.EXIT ) as Exit;
				
				if ( player && exit )
				{
					exit.checkOpenCondition( player.diamondsCollected );
				}
			}
			else if ( result.message )
			{
				this.setMessage( result.message, 1500 );
			}
			else
			{
				this.clearMessage();
			}

			if ( result.playerDied )
			{
				this.handlePlayerDeath();
			}
		}
		else if ( result.message )
		{
			this.setMessage( result.message, 1500 );
		}
	}

	private setMessage( message: string, duration: number ): void
	{
		if ( this.messageTimeout )
		{
			clearTimeout( this.messageTimeout );
		}
		
		this.gameState.gameMessage = message;
		this.messageTimeout = window.setTimeout( () => {
			this.gameState.gameMessage = '';
			this.messageTimeout = undefined;
		}, duration );
	}

	private clearMessage(): void
	{
		if ( this.messageTimeout )
		{
			clearTimeout( this.messageTimeout );
			this.messageTimeout = undefined;
		}
		this.gameState.gameMessage = '';
	}

	private handlePhysicsResult( result: PhysicsResult ): void
	{
		if ( result.playerCrushed )
		{
			this.setMessage( 'Crushed by falling object! ☠', 2000 );
			this.handlePlayerDeath();
		}
		else if ( result.impactOccurred )
		{
			// Could add sound effects or other feedback here
		}
	}

	private handlePlayerDeath(): void
	{
		this.gameState.lives--;

		if ( this.gameState.lives <= 0 )
		{
			this.gameState.isPlaying = false;
			this.setMessage( 'Game Over! No lives remaining.', 5000 );
		}
		else
		{
			// Reset level or respawn player
			this.setMessage( `Lives remaining: ${this.gameState.lives}`, 2000 );
		}
	}

	private checkLevelComplete(): void
	{
		if ( this.gameState.level.isComplete() && !this.levelCompleteTriggered )
		{
			this.levelCompleteTriggered = true;
			this.gameState.isPlaying = false;
			this.gameState.gameMessage = 'Level Complete! 🎉';
			
			// Bonus points for remaining time
			const timeBonus = Math.floor( this.gameState.timeRemaining );
			this.gameState.score += timeBonus;
			
			// Notify parent component that level is complete
			if ( this.onLevelComplete )
			{
				setTimeout( () => {
					this.onLevelComplete?.();
				}, 1500 ); // Wait 1.5 seconds to show completion message
			}
		}
	}

	private handleTimeUp(): void
	{
		this.gameState.isPlaying = false;
		this.gameState.gameMessage = 'Time\'s up! ⏰';
		this.handlePlayerDeath();
	}

	public pause(): void
	{
		this.gameState.isPaused = true;
	}

	public resume(): void
	{
		this.gameState.isPaused = false;
	}

	public restart(): void
	{
		// Reset level
		this.gameState.level.reset();
		this.movementSystem = new MovementSystem( this.gameState.level.getGrid() );
		
		// Reset game state
		this.gameState.score = 0;
		this.gameState.lives = 3;
		this.gameState.timeRemaining = this.gameState.level.getTimeLimit();
		this.gameState.isPlaying = true;
		this.gameState.isPaused = false;
		this.gameState.gameMessage = 'Game restarted!';
	}

	public loadLevel( level: Level ): void
	{
		this.gameState.level = level;
		this.movementSystem = new MovementSystem( level.getGrid() );
		this.physicsSystem = new PhysicsSystem( level.getGrid() );
		this.gameState.score = 0; // Reset level score
		this.gameState.timeRemaining = level.getTimeLimit();
		this.gameState.isPlaying = true;
		this.gameState.gameMessage = `Level loaded: ${level.getName()}`;
		this.levelCompleteTriggered = false; // Reset level completion flag
	}

	public getGameState(): GameState
	{
		return { ...this.gameState };
	}

	public getInputManager(): InputManager
	{
		return this.inputManager;
	}

	public canPlayerMove( direction: Direction ): boolean
	{
		return this.movementSystem.canMove( direction );
	}

	public cleanup(): void
	{
		this.inputManager.cleanup();
	}
}

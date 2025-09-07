import { Level, type LevelData } from '../game/core/Level';
import { Direction } from '../game/core/InputManager';
import { GameLogic } from './GameLogic';
import { EntityType } from '../game/entities';

// Turn-based game constants
const TURN_DURATION_MS = 200; // 200ms per turn - adjustable

export interface GameState {
	level: Level;
	levelData: LevelData; // Store original level data for restart
	score: number;
	lives: number;
	timeRemaining: number;
	isPlaying: boolean;
	isPaused: boolean;
	gameMessage: string;
	// Turn-based state
	currentTurn: number;
	lastTurnTime: number;
	// Animation state
	turnProgress: number; // 0.0 to 1.0, how far through current turn
	// Input state
	currentlyPressedDirection: Direction | null;
	lastPressedDirection: Direction | null;
	lastPressTime: number;
}

export interface GameInput {
	direction?: Direction;
	pause?: boolean;
	reset?: boolean;
}

export interface GameEvent {
	type: string;
	data?: any;
	timestamp: number;
}

export type GameEventListener = (event: GameEvent) => void;

/**
 * Pure game engine with no dependencies on React or DOM
 * Manages game state and logic independently
 */
export class GameEngine {
	private state: GameState;
	private eventListeners: Map<string, GameEventListener[]> = new Map();
	
	constructor(initialLevel: Level, levelData: LevelData) {
		this.state = {
			level: initialLevel,
			levelData: levelData,
			score: 0,
			lives: 3,
			timeRemaining: initialLevel.getTimeLimit(),
			isPlaying: true,
			isPaused: false,
			gameMessage: '',
			// Turn-based state
			currentTurn: 0,
			lastTurnTime: Date.now(),
			// Animation state
			turnProgress: 0.0,
			// Input state
			currentlyPressedDirection: null,
			lastPressedDirection: null,
			lastPressTime: 0
		};
	}

	/**
	 * Get current game state (immutable)
	 */
	public getState(): Readonly<GameState> {
		return { ...this.state };
	}

	/**
	 * Main game update loop - now turn-based with smooth animations
	 */
	public update(deltaTime: number): void {
		if (!this.state.isPlaying || this.state.isPaused) {
			return;
		}

		const currentTime = Date.now();
		const timeSinceLastTurn = currentTime - this.state.lastTurnTime;
		
		// Calculate turn progress for smooth interpolation (0.0 to 1.0)
		this.state.turnProgress = Math.min(timeSinceLastTurn / TURN_DURATION_MS, 1.0);
		
		// Check if it's time for the next turn
		if (timeSinceLastTurn >= TURN_DURATION_MS) {
			this.processTurn();
			this.state.lastTurnTime = currentTime;
			this.state.currentTurn++;
			this.state.turnProgress = 0.0; // Reset progress for new turn
		}

		// Update real-time elements (like UI time display)
		this.state.timeRemaining -= deltaTime;
		if (this.state.timeRemaining <= 0) {
			this.handleTimeUp();
			return;
		}
	}

	/**
	 * Handle input from external sources - now tracks pressed state
	 */
	public handleInput(input: GameInput): void {
		if (input.pause) {
			this.togglePause();
		}

		if (input.reset) {
			this.resetGame();
		}

		if (input.direction && this.state.isPlaying && !this.state.isPaused) {
			this.state.lastPressedDirection = input.direction;
			this.state.lastPressTime = Date.now();
		}
	}

	/**
	 * Set currently pressed direction (called from key down/up events)
	 */
	public setCurrentlyPressed(direction: Direction | null): void {
		this.state.currentlyPressedDirection = direction;
	}

	/**
	 * Reset animation state for all entities on the grid
	 */
	private resetAllEntityAnimations(): void {
		const grid = this.state.level.getGrid();
		const dimensions = grid.getDimensions();
		
		for (let y = 0; y < dimensions.height; y++) {
			for (let x = 0; x < dimensions.width; x++) {
				const entity = grid.getEntity(x, y);
				if (entity && typeof entity.resetAnimation === 'function') {
					entity.resetAnimation();
				}
			}
		}
	}

	/**
	 * Process one game turn - decides player action and updates physics
	 */
	private processTurn(): void {
		// Reset all entity animations at the start of the turn
		this.resetAllEntityAnimations();
		
		// Determine player action for this turn
		const playerAction = this.determinePlayerAction();
		
		// Execute player movement
		if (playerAction) {
			this.processMovement(playerAction);
		}
		
		// Update physics (falling objects, etc.)
		this.updatePhysics(0); // Turn-based, no deltaTime needed
		
		// Check win/lose conditions
		this.checkGameConditions();
		
		// Clear old input events (keep currently pressed state)
		const currentTime = Date.now();
		if (currentTime - this.state.lastPressTime > TURN_DURATION_MS) {
			this.state.lastPressedDirection = null;
		}
	}

	/**
	 * Determine what the player should do this turn based on input priority
	 */
	private determinePlayerAction(): Direction | null {
		// Priority 1: Currently pressed button
		if (this.state.currentlyPressedDirection) {
			return this.state.currentlyPressedDirection;
		}
		
		// Priority 2: Button pressed during this turn period
		const currentTime = Date.now();
		if (this.state.lastPressedDirection && 
			(currentTime - this.state.lastPressTime) <= TURN_DURATION_MS) {
			return this.state.lastPressedDirection;
		}
		
		// Priority 3: No action
		return null;
	}

	/**
	 * Load a new level
	 */
	public loadLevel(level: Level, levelData: LevelData): void {
		this.state.level = level;
		this.state.levelData = levelData;
		this.state.timeRemaining = level.getTimeLimit();
		this.state.gameMessage = '';
		this.state.isPlaying = true;
		// Reset turn-based state
		this.state.currentTurn = 0;
		this.state.lastTurnTime = Date.now();
		this.state.currentlyPressedDirection = null;
		this.state.lastPressedDirection = null;
		this.state.lastPressTime = 0;
		this.emitEvent('LEVEL_LOADED', { level });
	}

	/**
	 * Subscribe to game events
	 */
	public addEventListener(eventType: string, listener: GameEventListener): void {
		if (!this.eventListeners.has(eventType)) {
			this.eventListeners.set(eventType, []);
		}
		this.eventListeners.get(eventType)!.push(listener);
	}

	/**
	 * Unsubscribe from game events
	 */
	public removeEventListener(eventType: string, listener: GameEventListener): void {
		const listeners = this.eventListeners.get(eventType);
		if (listeners) {
			const index = listeners.indexOf(listener);
			if (index > -1) {
				listeners.splice(index, 1);
			}
		}
	}

	/**
	 * Clean up resources
	 */
	public destroy(): void {
		this.eventListeners.clear();
		this.state.isPlaying = false;
	}

	// Private methods for game logic

	private processMovement(direction: Direction): any {
		const grid = this.state.level.getGrid();
		const result = GameLogic.movePlayer(grid, direction);
		
		if (result.success) {
			if (result.diamondCollected) {
				this.state.score += result.scoreChange || 10;
				this.emitEvent('DIAMOND_COLLECTED', { 
					score: this.state.score,
					totalDiamonds: this.state.level.getPlayer()?.diamondsCollected || 0
				});
				
				// Check if exit should open
				const player = grid.findEntityByType(EntityType.PLAYER);
				const exit = grid.findEntityByType(EntityType.EXIT);
				if (player && exit) {
					(exit as any).checkOpenCondition((player as any).diamondsCollected);
				}
			}
			
			if (result.levelComplete) {
				this.state.isPlaying = false;
				this.emitEvent('LEVEL_COMPLETE', {
					score: this.state.score,
					timeRemaining: this.state.timeRemaining
				});
			}
			
			if (result.playerDied) {
				this.handlePlayerDeath();
			}
		}
		
		return result;
	}

	private updatePhysics(deltaTime: number): void {
		const grid = this.state.level.getGrid();
		const result = GameLogic.updatePhysics(grid, deltaTime);
		
		if (result.playerDied) {
			this.handlePlayerDeath();
		}
	}

	private handlePlayerDeath(): void {
		this.state.lives--;
		this.emitEvent('PLAYER_DIED', { 
			lives: this.state.lives,
			score: this.state.score 
		});
		
		if (this.state.lives <= 0) {
			this.state.isPlaying = false;
			this.emitEvent('GAME_OVER', { score: this.state.score });
		} else {
			// Restart the level with reduced lives
			this.state.level = new Level(this.state.levelData);
			this.state.isPlaying = true;
		}
	}

	private checkGameConditions(): void {
		const grid = this.state.level.getGrid();
		
		// Check for level completion using pure function
		if (GameLogic.checkLevelComplete(grid)) {
			this.state.isPlaying = false;
			this.emitEvent('LEVEL_COMPLETE', { 
				score: this.state.score,
				timeRemaining: this.state.timeRemaining 
			});
		}

		// Check for game over conditions
		if (this.state.lives <= 0) {
			this.state.isPlaying = false;
			this.emitEvent('GAME_OVER', { score: this.state.score });
		}
	}

	/**
	 * Get interpolated position for an entity based on turn progress
	 */
	public getInterpolatedPosition(entity: any): { x: number; y: number } {
		// Use the entity's own interpolation method if it exists
		if (entity && typeof entity.getInterpolatedPosition === 'function') {
			return entity.getInterpolatedPosition(this.state.turnProgress);
		}
		
		// Fallback to current position if entity doesn't support interpolation
		return { x: entity.x, y: entity.y };
	}

	private handleTimeUp(): void {
		this.state.lives--;
		if (this.state.lives > 0) {
			this.state.timeRemaining = this.state.level.getTimeLimit();
			this.emitEvent('LIFE_LOST', { livesRemaining: this.state.lives });
		} else {
			this.state.isPlaying = false;
			this.emitEvent('GAME_OVER', { reason: 'TIME_UP', score: this.state.score });
		}
	}

	private togglePause(): void {
		this.state.isPaused = !this.state.isPaused;
		this.emitEvent('PAUSE_TOGGLED', { isPaused: this.state.isPaused });
	}

	private resetGame(): void {
		this.state.score = 0;
		this.state.lives = 3;
		this.state.timeRemaining = this.state.level.getTimeLimit();
		this.state.isPlaying = true;
		this.state.isPaused = false;
		this.state.gameMessage = '';
		// Reset turn-based state
		this.state.currentTurn = 0;
		this.state.lastTurnTime = Date.now();
		this.state.turnProgress = 0.0;
		this.state.currentlyPressedDirection = null;
		this.state.lastPressedDirection = null;
		this.state.lastPressTime = 0;
		this.emitEvent('GAME_RESET', {});
	}

	private emitEvent(type: string, data?: any): void {
		const event: GameEvent = {
			type,
			data,
			timestamp: Date.now()
		};

		const listeners = this.eventListeners.get(type);
		if (listeners) {
			listeners.forEach(listener => listener(event));
		}
	}
}

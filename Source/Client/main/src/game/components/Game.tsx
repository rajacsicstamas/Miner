import { useEffect, useState, useRef } from 'preact/hooks';
import { Level, SAMPLE_LEVELS } from '../core/Level';
import { GameEngine, type GameState } from '../../engine/GameEngine';
import { Direction } from '../core/InputManager';
import { GridRenderer } from './GridRenderer';

export interface GameProps
{
	level: Level;
	onScoreChange?: ( score: number ) => void;
	onLevelComplete?: () => void;
	onGameOver?: () => void;
}

export function Game( { level, onScoreChange, onLevelComplete, onGameOver }: GameProps )
{
	const [gameState, setGameState] = useState<GameState | null>( null );
	const gameEngineRef = useRef<GameEngine | null>( null );
	const animationFrameRef = useRef<number>();
	const lastTimeRef = useRef<number>( 0 );
	
	// Use refs to store callbacks to prevent re-renders
	const onScoreChangeRef = useRef( onScoreChange );
	const onLevelCompleteRef = useRef( onLevelComplete );
	const onGameOverRef = useRef( onGameOver );
	
	// Update refs when props change
	onScoreChangeRef.current = onScoreChange;
	onLevelCompleteRef.current = onLevelComplete;
	onGameOverRef.current = onGameOver;

	// Initialize game engine
	useEffect( () =>
	{
		if ( gameEngineRef.current ) {
			// If we already have a game engine, just load the new level
			// We need to find the level data from SAMPLE_LEVELS
			const levelData = SAMPLE_LEVELS.find(data => data.name === level.getName());
			if (levelData) {
				gameEngineRef.current.loadLevel( level, levelData );
				setGameState( gameEngineRef.current.getState() );
			}
		} else {
			// Create new game engine only if we don't have one
			const levelData = SAMPLE_LEVELS.find(data => data.name === level.getName());
			if (levelData) {
				const gameEngine = new GameEngine( level, levelData );
				
				// Subscribe to engine events
				gameEngine.addEventListener('LEVEL_COMPLETE', () => {
					if ( onLevelCompleteRef.current ) {
						onLevelCompleteRef.current();
					}
				});
				
				gameEngine.addEventListener('GAME_OVER', () => {
					if ( onGameOverRef.current ) {
						onGameOverRef.current();
					}
				});
				
				gameEngine.addEventListener('DIAMOND_COLLECTED', (event) => {
					if (onScoreChangeRef.current && event.data?.score) {
						onScoreChangeRef.current(event.data.score);
					}
				});
				
				gameEngineRef.current = gameEngine;
				setGameState( gameEngine.getState() );
			}
		}
	}, [level] ); // Only depend on level, not callbacks

	// Cleanup only on component unmount
	useEffect( () => {
		return () => {
			if ( gameEngineRef.current ) {
				gameEngineRef.current.destroy();
			}
		};
	}, [] );

	// Game loop
	useEffect( () =>
	{
		const gameLoop = ( currentTime: number ) =>
		{
			if ( !gameEngineRef.current )
			{
				return;
			}

			const deltaTime = ( currentTime - lastTimeRef.current ) / 1000; // Convert to seconds
			lastTimeRef.current = currentTime;

			// Update game
			gameEngineRef.current.update( deltaTime );
			const newGameState = gameEngineRef.current.getState();

			// Check for game over (no dependency on previous state)
			if ( !newGameState.isPlaying && newGameState.lives <= 0 && onGameOverRef.current )
			{
				onGameOverRef.current();
			}

			// Update UI state
			setGameState( newGameState );

			// Continue game loop
			animationFrameRef.current = requestAnimationFrame( gameLoop );
		};

		animationFrameRef.current = requestAnimationFrame( gameLoop );

		return () =>
		{
			if ( animationFrameRef.current )
			{
				cancelAnimationFrame( animationFrameRef.current );
			}
		};
	}, [] ); // No dependencies - game loop is completely independent

	// Handle keyboard input - turn-based with current press tracking
	useEffect(() => {
		const keyState = {
			up: false,
			down: false,
			left: false,
			right: false
		};

		// Function to get current active direction
		const getCurrentDirection = (): Direction | null => {
			if (keyState.up) return Direction.UP;
			if (keyState.down) return Direction.DOWN;
			if (keyState.left) return Direction.LEFT;
			if (keyState.right) return Direction.RIGHT;
			return null;
		};

		// Update engine with current press state
		const updateCurrentlyPressed = () => {
			if (gameEngineRef.current) {
				gameEngineRef.current.setCurrentlyPressed(getCurrentDirection());
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (!gameEngineRef.current) {
				return;
			}
			
			let keyChanged = false;

			switch (event.key.toLowerCase()) {
				case 'w':
				case 'arrowup':
					if (!keyState.up) {
						keyState.up = true;
						keyChanged = true;
					}
					break;
				case 'a':
				case 'arrowleft':
					if (!keyState.left) {
						keyState.left = true;
						keyChanged = true;
					}
					break;
				case 's':
				case 'arrowdown':
					if (!keyState.down) {
						keyState.down = true;
						keyChanged = true;
					}
					break;
				case 'd':
				case 'arrowright':
					if (!keyState.right) {
						keyState.right = true;
						keyChanged = true;
					}
					break;
				case ' ':
				case 'enter':
					// For pause/action
					return;
				default:
					return; // Don't prevent default for unhandled keys
			}
			
			if (keyChanged) {
				event.preventDefault();
				const direction = getCurrentDirection();
				
				// Send input event for press detection
				if (direction) {
					gameEngineRef.current.handleInput({ direction });
				}
				
				// Update currently pressed state
				updateCurrentlyPressed();
			}
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			switch (event.key.toLowerCase()) {
				case 'w':
				case 'arrowup':
					keyState.up = false;
					break;
				case 'a':
				case 'arrowleft':
					keyState.left = false;
					break;
				case 's':
				case 'arrowdown':
					keyState.down = false;
					break;
				case 'd':
				case 'arrowright':
					keyState.right = false;
					break;
			}
			
			// Update currently pressed state
			updateCurrentlyPressed();
		};

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('keyup', handleKeyUp);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('keyup', handleKeyUp);
		};
	}, []);

	// Handle focus for keyboard input
	useEffect( () =>
	{
		const gameElement = document.getElementById( 'game-container' );
		if ( gameElement )
		{
			gameElement.focus();
		}
	}, [] );

	if ( !gameState )
	{
		return <div>Loading game...</div>;
	}

	const formatTime = ( seconds: number ): string =>
	{
		const mins = Math.floor( seconds / 60 );
		const secs = Math.floor( seconds % 60 );
		return `${mins}:${secs.toString().padStart( 2, '0' )}`;
	};

	return (
		<div 
			id="game-container" 
			class="game-container"
			tabIndex={0}
			style={{
				position: 'relative',
				width: '100vw',
				height: '100vh',
				margin: 0,
				padding: 0,
				overflow: 'hidden'
			}}
		>
			{/* Game stats overlay in top left corner */}
			<div style={{
				position: 'absolute',
				top: '0px',
				left: '0px',
				zIndex: 10,
				background: 'rgba(0, 0, 0, 0.8)',
				color: 'white',
				padding: '10px 15px',
				fontFamily: 'monospace',
				fontSize: '14px',
				display: 'flex',
				gap: '20px',
				alignItems: 'center'
			}}>
				<span>Score: {gameState.score}</span>
				<span>Lives: {'♥'.repeat(gameState.lives)}</span>
				<span>Time: {formatTime(gameState.timeRemaining)}</span>
				<span>Diamonds: {gameState.level.getPlayer()?.diamondsCollected || 0} / {gameState.level.getDiamondsRequired()}</span>
			</div>

			{/* Game message overlay */}
			{gameState.gameMessage && (
				<div style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					zIndex: 20,
					background: 'rgba(0, 0, 0, 0.9)',
					color: 'white',
					padding: '20px',
					borderRadius: '10px',
					fontSize: '18px',
					textAlign: 'center'
				}}>
					{gameState.gameMessage}
				</div>
			)}

			{/* Game over overlay */}
			{!gameState.isPlaying && (
				<div style={{
					position: 'absolute',
					top: '50%',
					left: '50%',
					transform: 'translate(-50%, -50%)',
					zIndex: 30,
					background: 'rgba(0, 0, 0, 0.9)',
					color: 'white',
					padding: '30px',
					borderRadius: '15px',
					fontSize: '24px',
					textAlign: 'center'
				}}>
					{gameState.level.isComplete() ? 'Level Complete! 🎉' : 'Game Over'}
				</div>
			)}

			{/* Canvas takes full screen */}
			<div style={{
				position: 'absolute',
				top: 0,
				left: 0,
				width: '100%',
				height: '100%'
			}}>
				<GridRenderer 
					grid={gameState.level.getGrid()} 
					gameState={gameState}
					cellSize={64}
					gameEngine={gameEngineRef.current}
				/>
			</div>
		</div>
	);
}

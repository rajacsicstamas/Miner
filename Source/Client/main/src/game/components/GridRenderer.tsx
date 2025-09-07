import { useEffect, useRef, useCallback, useState } from 'preact/hooks';
import { GameGrid } from '../core/GameGrid';
import type { GameState } from '../core';

export interface GridRendererProps
{
	grid: GameGrid;
	gameState?: GameState;
	cellSize?: number;
	gameEngine?: any; // Add reference to game engine for interpolation
}

// Simple entity colors without sprite generation
const ENTITY_COLORS = {
	player: '#00ff00',
	boulder: '#8B4513', 
	diamond: '#00ffff',
	dirt: '#654321',
	wall: '#666666',
	exit: '#ffff00'
};

export function GridRenderer( { grid, gameState, cellSize = 32, gameEngine }: GridRendererProps )
{
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [spriteImages, setSpriteImages] = useState<Map<string, HTMLImageElement>>(new Map());
	const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
	const { width: gridWidth, height: gridHeight } = grid.getDimensions();
	
	// Get device pixel ratio for high DPI support
	const devicePixelRatio = window.devicePixelRatio || 1;

	// Update canvas size when window resizes
	useEffect(() => {
		const updateCanvasSize = () => {
			setCanvasSize({
				width: window.innerWidth,
				height: window.innerHeight
			});
		};

		updateCanvasSize();
		window.addEventListener('resize', updateCanvasSize);
		return () => window.removeEventListener('resize', updateCanvasSize);
	}, []);

	// Update camera to follow player - removed, now calculated in render function

	// Load sprite images from files
	useEffect(() => {
		const entityTypes = ['player', 'boulder', 'diamond', 'dirt', 'wall', 'exit'];
		const imagePromises = entityTypes.map(type => {
			return new Promise<[string, HTMLImageElement]>((resolve, reject) => {
				const img = new Image();
				img.onload = () => resolve([type, img]);
				img.onerror = () => reject(new Error(`Failed to load ${type}.png`));
				img.src = `/${type}.png`; // Load from public folder
			});
		});

		Promise.all(imagePromises).then(results => {
			const imageMap = new Map(results);
			setSpriteImages(imageMap);
		}).catch(error => {
			console.error('Failed to load sprite images:', error);
		});
	}, []);

	// Render function with camera and DPI awareness
	const renderCanvas = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) {
			return;
		}

		const ctx = canvas.getContext('2d');
		if (!ctx) {
			return;
		}

		// Calculate canvas dimensions with DPI scaling
		const bufferWidth = canvasSize.width * devicePixelRatio;
		const bufferHeight = canvasSize.height * devicePixelRatio;

		// Set up high DPI canvas
		canvas.width = bufferWidth;
		canvas.height = bufferHeight;
		canvas.style.width = `${canvasSize.width}px`;
		canvas.style.height = `${canvasSize.height}px`;
		
		// Scale the context to account for device pixel ratio
		ctx.scale(devicePixelRatio, devicePixelRatio);

		// Clear canvas with background color (#555 for no map areas)
		ctx.fillStyle = '#555555';
		ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);

		// Calculate camera position every frame based on interpolated player position
		let cameraX = 0, cameraY = 0;
		if (gameEngine) {
			// Find the player entity
			let playerEntity = null;
			for (let y = 0; y < gridHeight; y++) {
				for (let x = 0; x < gridWidth; x++) {
					const entity = grid.getEntity(x, y);
					if (entity && entity.type === 'player') {
						playerEntity = entity;
						break;
					}
				}
				if (playerEntity) break;
			}

			if (playerEntity) {
				// Get interpolated player position for smooth camera following
				const interpolatedPos = gameEngine.getInterpolatedPosition(playerEntity);
				
				// Center camera exactly on the interpolated player position
				const playerPixelX = interpolatedPos.x * cellSize;
				const playerPixelY = interpolatedPos.y * cellSize;
				
				// Center camera perfectly on sliding player
				cameraX = playerPixelX - (canvasSize.width / 2) + (cellSize / 2);
				cameraY = playerPixelY - (canvasSize.height / 2) + (cellSize / 2);
			}
		}

		// Apply camera transform
		ctx.save();
		ctx.translate(-cameraX, -cameraY);

		// Draw map area background (#000 for inside map)
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, gridWidth * cellSize, gridHeight * cellSize);

		// Draw entities with sprites or fallback colors using interpolated positions
		for (let y = 0; y < gridHeight; y++) {
			for (let x = 0; x < gridWidth; x++) {
				const entity = grid.getEntity(x, y);
				
				if (entity) {
					// Get interpolated position from game engine
					let pixelX, pixelY;
					if (gameEngine) {
						const interpolatedPos = gameEngine.getInterpolatedPosition(entity);
						pixelX = interpolatedPos.x * cellSize;
						pixelY = interpolatedPos.y * cellSize;
					} else {
						// Fallback to entity position
						pixelX = entity.x * cellSize;
						pixelY = entity.y * cellSize;
					}
					
					// Try to use sprite image first
					const spriteImage = spriteImages.get(entity.type);
					if (spriteImage) {
						ctx.drawImage(spriteImage, pixelX, pixelY, cellSize, cellSize);
					} else {
						// Fallback to colored rectangle
						ctx.fillStyle = ENTITY_COLORS[entity.type as keyof typeof ENTITY_COLORS] || '#ffffff';
						ctx.fillRect(pixelX + 1, pixelY + 1, cellSize - 2, cellSize - 2);
					}
				}
			}
		}

		// Restore context (remove camera transform)
		ctx.restore();
	}, [grid, cellSize, canvasSize, gridWidth, gridHeight, spriteImages, devicePixelRatio, gameEngine]);

	// Re-render when grid, gameState, or gameEngine changes
	useEffect(() => {
		renderCanvas();
	}, [grid, gameState, gameEngine, renderCanvas]);

	return (
		<canvas
			ref={canvasRef}
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				width: '100vw',
				height: '100vh',
				imageRendering: 'pixelated',
				display: 'block',
				zIndex: 1
			}}
		/>
	);
}

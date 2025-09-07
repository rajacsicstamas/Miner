import { GameGrid } from './GameGrid';
import { Entity, EntityType, EntityFactory, Player } from '../entities';

export interface LevelData
{
	name: string;
	diamondsRequired: number;
	timeLimit: number;
	layout: string[];
}

export class Level
{
	private grid: GameGrid;
	private name: string;
	private diamondsRequired: number;
	private timeLimit: number;
	private player: Player | null;

	constructor( levelData: LevelData )
	{
		// Calculate dimensions from layout
		const height = levelData.layout.length;
		const width = levelData.layout.length > 0 ? Math.max(...levelData.layout.map(row => row.length)) : 0;
		
		this.grid = new GameGrid( width, height );
		this.name = levelData.name;
		this.diamondsRequired = levelData.diamondsRequired;
		this.timeLimit = levelData.timeLimit;
		this.player = null;

		this.loadLayout( levelData.layout );
	}

	private loadLayout( layout: string[] ): void
	{
		const { height } = this.grid.getDimensions();

		for ( let y = 0; y < height && y < layout.length; y++ )
		{
			const row = layout[y];
			for ( let x = 0; x < row.length; x++ )
			{
				const char = row[x];
				const entity = this.createEntityFromChar( char, x, y );
				
				if ( entity )
				{
					this.grid.setEntity( x, y, entity );
					
					// Keep reference to player
					if ( entity.type === EntityType.PLAYER )
					{
						this.player = entity as Player;
					}
				}
			}
		}
	}

	private createEntityFromChar( char: string, x: number, y: number ): Entity | null
	{
		switch ( char )
		{
			case '@':
				return EntityFactory.createPlayer( x, y );
			case '#':
				return EntityFactory.createWall( x, y );
			case '.':
				return EntityFactory.createDirt( x, y );
			case '*':
				return EntityFactory.createDiamond( x, y );
			case 'O':
				return EntityFactory.createBoulder( x, y );
			case 'E':
				return EntityFactory.createExit( x, y, this.diamondsRequired );
			case ' ':
			default:
				return null; // Empty space
		}
	}

	public getGrid(): GameGrid
	{
		return this.grid;
	}

	public getPlayer(): Player | null
	{
		return this.player;
	}

	public getName(): string
	{
		return this.name;
	}

	public getDiamondsRequired(): number
	{
		return this.diamondsRequired;
	}

	public getTimeLimit(): number
	{
		return this.timeLimit;
	}

	public getDiamondsRemaining(): number
	{
		const diamonds = this.grid.findAllEntitiesByType( EntityType.DIAMOND );
		return diamonds.length;
	}

	public isComplete(): boolean
	{
		// Level is complete when player reaches the exit and has enough diamonds
		if ( !this.player )
		{
			return false;
		}

		const exit = this.grid.findEntityByType( EntityType.EXIT );
		if ( !exit )
		{
			return false;
		}

		// Check if player is at exit position
		const playerPos = this.player.getPosition();
		const exitPos = exit.getPosition();
		
		const isAtExit = playerPos.x === exitPos.x && playerPos.y === exitPos.y;
		const hasEnoughDiamonds = this.player.diamondsCollected >= this.diamondsRequired;
		
		return isAtExit && hasEnoughDiamonds;
	}

	public reset(): void
	{
		// This would reload the original layout
		this.grid.clear();
		this.player = null;
		// Would need to store original layout to reload
	}
}

// Sample level layouts
export const SAMPLE_LEVELS: LevelData[] = [
	{
		name: "First Steps",
		diamondsRequired: 5,
		timeLimit: 120,
		layout: [
			"####################",
			"#@.................#",
			"#..O...........O...#",
			"#..*..O.....O..*...#",
			"#.....O.....O......#",
			"#....O.......O.....#",
			"#...*...O.O...*....#",
			"#......O...O.......#",
			"#.O.......*......O.#",
			"#...O.........O....#",
			"#.....O.....O......#",
			"#..................E",
			"####################"
		]
	},
	{
		name: "Boulder Push",
		diamondsRequired: 8,
		timeLimit: 150,
		layout: [
			"########################",
			"#@.....................#",
			"#..O.........O.........#",
			"#..O...*.....*....O....#",
			"#.O...O.......O...O....#",
			"#.*...O......O...*....#",
			"#....O.O....O.O........#",
			"#...*.....*.....*......#",
			"#..O................O..#",
			"#.O..................O.#",
			"#..O................O..#",
			"#...*...............*..#",
			"#....O............O....#",
			"#......................E",
			"########################"
		]
	},
	{
		name: "Rolling Hills",
		diamondsRequired: 10,
		timeLimit: 180,
		layout: [
			"##########################",
			"#@.......................#",
			"#..O.........O...........#",
			"#..O..O..O..O..O..O......#",
			"#..*.*.*.*.*.*.*........#",
			"#......O...O.............#",
			"#.....O.....O............#",
			"#......O..O..O..O........#",
			"#......*.*.*.*..........#",
			"#....O.......O...........#",
			"#...O.........O..........#",
			"#..O..............O......#",
			"#..*..........O..........#",
			"#............O...........#",
			"#...........O............#",
			"#........................E",
			"##########################"
		]
	},
	{
		name: "Cave Crawler",
		diamondsRequired: 12,
		timeLimit: 200,
		layout: [
			"############################",
			"#@.........................#",
			"#..O.........O.............#",
			"#...*.....*.....*.....*....#",
			"#..O...........O...........#",
			"###..###..###..###..###....#",
			"#......O.........O.........#",
			"#....O....O....O....O......#",
			"#..O.........O.............#",
			"#.*.........*.........*....#",
			"#..O.........O.............#",
			"#.....*.....*.....*........#",
			"#...O.........O............#",
			"#..O..................O....#",
			"#.O....................O...#",
			"#..*...................*...#",
			"#..O................O......#",
			"#..........................E",
			"############################"
		]
	},
	{
		name: "Diamond Mine",
		diamondsRequired: 15,
		timeLimit: 240,
		layout: [
			"##############################",
			"#@...........................#",
			"#..O.................O.......#",
			"#..O..*..O..*..O..*..O..*....#",
			"#.O..........................#",
			"#.*..O..*..O..*..O..*..O.....#",
			"#...O........................#",
			"#......O.............O.......#",
			"#..O..O..O..O..O..O..O.......#",
			"#.*.*.*.*.*.*.*.*...........#",
			"#.O..........................#",
			"#....O.............O.........#",
			"#...*...*...*...*...*........#",
			"#..O.................O.......#",
			"#.O........................O.#",
			"#...O..................O.....#",
			"#..*......................*.#",
			"#..O..................O......#",
			"#............................E",
			"##############################"
		]
	},
	{
		name: "Master Challenge",
		diamondsRequired: 20,
		timeLimit: 300,
		layout: [
			"##################################",
			"#@...............................#",
			"#..O.................O...........#",
			"#..O..*..O..*..O..*..O..*..O.....#",
			"#.O..............................#",
			"#.*..O..*..O..*..O..*..O..*......#",
			"#...O........................O...#",
			"#......O.............O...........#",
			"####..####..####..####..####.....#",
			"#..O.........................O...#",
			"#..O..O..O..O..O..O..O..O........#",
			"#..*.*.*.*.*.*.*.*..............#",
			"#.O..............................#",
			"#....O.............O.............#",
			"#..*...*...*...*...*...*........#",
			"#..O.................O...........#",
			"#...O.................O..........#",
			"#..O............................O#",
			"#.O..............................#",
			"#..*...........................*.#",
			"#..O..................O..........#",
			"#.....O.............O............#",
			"#................................E",
			"##################################"
		]
	}
];

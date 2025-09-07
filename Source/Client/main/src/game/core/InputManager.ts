export const Direction = {
	UP: 'up',
	DOWN: 'down',
	LEFT: 'left',
	RIGHT: 'right'
} as const;

export type Direction = typeof Direction[keyof typeof Direction];

export interface InputState
{
	up: boolean;
	down: boolean;
	left: boolean;
	right: boolean;
	action: boolean; // Space or Enter for special actions
}

export class InputManager
{
	private inputState: InputState;
	private keyDownHandlers: Map<string, () => void>;
	private keyUpHandlers: Map<string, () => void>;

	constructor()
	{
		this.inputState = {
			up: false,
			down: false,
			left: false,
			right: false,
			action: false
		};

		this.keyDownHandlers = new Map();
		this.keyUpHandlers = new Map();

		this.setupEventListeners();
		this.bindDefaultKeys();
	}

	private setupEventListeners(): void
	{
		document.addEventListener( 'keydown', ( event ) => this.handleKeyDown( event ) );
		document.addEventListener( 'keyup', ( event ) => this.handleKeyUp( event ) );
	}

	private bindDefaultKeys(): void
	{
		// WASD Keys
		this.bindKey( 'KeyW', () => this.inputState.up = true, () => this.inputState.up = false );
		this.bindKey( 'KeyA', () => this.inputState.left = true, () => this.inputState.left = false );
		this.bindKey( 'KeyS', () => this.inputState.down = true, () => this.inputState.down = false );
		this.bindKey( 'KeyD', () => this.inputState.right = true, () => this.inputState.right = false );

		// Arrow Keys
		this.bindKey( 'ArrowUp', () => this.inputState.up = true, () => this.inputState.up = false );
		this.bindKey( 'ArrowLeft', () => this.inputState.left = true, () => this.inputState.left = false );
		this.bindKey( 'ArrowDown', () => this.inputState.down = true, () => this.inputState.down = false );
		this.bindKey( 'ArrowRight', () => this.inputState.right = true, () => this.inputState.right = false );

		// Action keys
		this.bindKey( 'Space', () => this.inputState.action = true, () => this.inputState.action = false );
		this.bindKey( 'Enter', () => this.inputState.action = true, () => this.inputState.action = false );
	}

	private bindKey( keyCode: string, onKeyDown: () => void, onKeyUp: () => void ): void
	{
		this.keyDownHandlers.set( keyCode, onKeyDown );
		this.keyUpHandlers.set( keyCode, onKeyUp );
	}

	private handleKeyDown( event: KeyboardEvent ): void
	{
		const handler = this.keyDownHandlers.get( event.code );
		if ( handler )
		{
			event.preventDefault();
			handler();
		}
	}

	private handleKeyUp( event: KeyboardEvent ): void
	{
		const handler = this.keyUpHandlers.get( event.code );
		if ( handler )
		{
			event.preventDefault();
			handler();
		}
	}

	public getInputState(): InputState
	{
		return { ...this.inputState };
	}

	public isPressed( direction: Direction ): boolean
	{
		switch ( direction )
		{
			case Direction.UP:
				return this.inputState.up;
			case Direction.DOWN:
				return this.inputState.down;
			case Direction.LEFT:
				return this.inputState.left;
			case Direction.RIGHT:
				return this.inputState.right;
			default:
				return false;
		}
	}

	public isActionPressed(): boolean
	{
		return this.inputState.action;
	}

	public getDirectionVector( direction: Direction ): { dx: number, dy: number }
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

	public getPressedDirection(): Direction | null
	{
		if ( this.inputState.up ) return Direction.UP;
		if ( this.inputState.down ) return Direction.DOWN;
		if ( this.inputState.left ) return Direction.LEFT;
		if ( this.inputState.right ) return Direction.RIGHT;
		return null;
	}

	public cleanup(): void
	{
		document.removeEventListener( 'keydown', ( event ) => this.handleKeyDown( event ) );
		document.removeEventListener( 'keyup', ( event ) => this.handleKeyUp( event ) );
	}
}

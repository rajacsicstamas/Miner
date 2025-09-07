import { useState, useCallback, useRef } from 'preact/hooks'
import './app.css'
import { Level, SAMPLE_LEVELS, Game } from './game'

export function App()
{
	const [score, setScore] = useState( 0 );
	const [currentLevelIndex, setCurrentLevelIndex] = useState( 0 );
	const [level, setLevel] = useState( () => new Level( SAMPLE_LEVELS[0] ) );
	const levelStartScoreRef = useRef( 0 );

	const handleScoreChange = useCallback( ( levelScore: number ) =>
	{
		setScore( levelStartScoreRef.current + levelScore );
	}, [] );

	const handleLevelComplete = useCallback( () =>
	{
		// Store the current total score before advancing
		levelStartScoreRef.current = score;
		
		// Automatically advance to next level
		const newIndex = ( currentLevelIndex + 1 ) % SAMPLE_LEVELS.length;
		
		setCurrentLevelIndex( newIndex );
		setLevel( new Level( SAMPLE_LEVELS[newIndex] ) );
	}, [currentLevelIndex, score] );

	const handleGameOver = useCallback( () =>
	{
		// Game over handler - could add game over logic here
	}, [] );

	return (
		<Game 
			level={level}
			onScoreChange={handleScoreChange}
			onLevelComplete={handleLevelComplete}
			onGameOver={handleGameOver}
		/>
	);
}

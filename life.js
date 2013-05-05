"use strict";

$(function(){
	// Some browsers cache things oddly so let's init the start state for some components
	$('.noOnFlyChange').removeAttr('disabled');
	$('a.noOnFlyChange').show();
	$('#speed').val(0);
	$('#xSize').val(20);
	$('#ySize').val(20);
	generateGameViewPreview();

	// Allow generation of a random string for seed
	$('#randomSeed').on('click', function() {
		var seed = [];	    		
	    while (seed.length < 32) {
	        seed.push(Math.random().toString(36).substring(2));
	    }
	    seed = seed.join().substring(0, 32);
		$('#seed').val(seed).trigger('input'); // Make sure we trigger input so our listener can generate a new preview
	});
	
	// Let's show the initial seed state as a preview when an initial state param is changed
	$('.initialStateParam').on('input', generateGameViewPreview);

	// Handle game start logic (lots of it)	    	
	$('#startGame').on('click', function() {
		// Collect form values
		var xSize = $('#xSize').val() || 0;
		var ySize = $('#ySize').val() || 0;
		var speed = $('#speed').val();
		var seed = $('#seed').val();  
		
		// Validate the dimensions
		if(!validateDimensions(xSize, ySize)) {
			return;
		}

		// Disable form components that can't change while sim is running
		$('.noOnFlyChange').attr('disabled', 'disabled');
		$('a.noOnFlyChange').hide();
		
		// Hide the start button and show pause/reset
		$(this).hide();
		$('#pauseGame').show();
		$('#resetGame').show();
		
		// Show generation counter
		$('#generation').show();
		
		// Initialize the game state, paint the initial view, and start the game loop
		var gameState = initializeGameState(xSize, ySize, seed);
		var currentGameView = paintGameView(gameState);
		var generation = 0; // Initialize it as 0 and then run the updater which increments it to 1 and displays it for the seed state
		updateGenerationCounter();
		var gameLoop = generateGameLoop();
		
		// Catch speed changes and update scope
		$('#speed').on('change', function() {
		    speed = $(this).val();
		    pauseGame(gameLoop);
		    gameLoop = generateGameLoop();
		});
		
		// Handle pausing by pausing the game loop, hiding pause, and showing resume
		$('#pauseGame').on('click', function() {
    		pauseGame(gameLoop);
    		$(this).hide();
    		$('#resumeGame').show();
    	});
		
		// Handle resuming by recreating the game loop, hiding the resume button, and showing pause
		$('#resumeGame').on('click', function() {
			gameLoop = resumeGame();
			$(this).hide();
			$('#pauseGame').show();
		});
		
		// Handle reset by pausing the game loop, resetting state, enabling the form fields, hiding pause/resume, and showing start
    	$('#resetGame').on('click', function() {
    		pauseGame();
    		gameState = [];
    		gameLoop = null;
    		generation = 0;
    		currentGameView = null;
    		$('#gameView').empty();
    		$('#generation,#pauseGame,#resumeGame').hide();
    		$('.noOnFlyChange').removeAttr('disabled');
    		$('a.noOnFlyChange,#startGame').show();
    		generateGameViewPreview();
    	});
		
		// Updates the generation counter
    	function updateGenerationCounter() {
    		$('#generation span').html(++generation);
    	}
    	
    	// Pause the game loop
    	function pauseGame() {
    		clearInterval(gameLoop);
    	}
    	
    	// Resume the game by generating a new game loop
    	function resumeGame() {
    		return generateGameLoop();
    	}
    	
    	// Generates a new game loop
    	function generateGameLoop() {
    		return setInterval(function() {
    			gameState = gameTick(gameState);
    			currentGameView = paintGameView(gameState, currentGameView);
    			updateGenerationCounter();
    		}, speed);
    	}
	});
	// End Start Callback
	
	// Some quick and dirty validation to prevent people from blowing their browsers up
	function validateDimensions(xSize, ySize) {
		
		if (isNaN(xSize) || isNaN(ySize)) {
			generateWarning('Numbers only, please.');
			return false;
		}
		
		if(xSize == 0 || ySize == 0) {
			generateWarning('Please provide dimensions > 0 and <= 100');
			return false;
		}
		
		if(xSize > 100 || ySize > 100) {
			generateWarning('You\'re going to have a bad time at those dimensions. Keep it to 100 or less.');
			return false;
		}
		
		return true;
	}
	
	// Quick and dirty warning message generation
	function generateWarning(message) {
		$('#gameView').empty();
		var warning = $('<h2>' + message + '</h2>');
		$('#gameView').append(warning);
		warning.fadeTo(0, 0.5);
	}
	
	
	// Generates a preview based on the current input of what the seeded state will look like
	function generateGameViewPreview() {
		var xSize = $('#xSize').val() || 0;
		var ySize = $('#ySize').val() || 0;
		
		if(!validateDimensions(xSize, ySize)) {
			return;
		}
		var seed = $('#seed').val();   
		var gameState = initializeGameState(xSize, ySize, seed);
		var gameView = paintGameView(gameState);
		// Lower the opacity so it's clear it's a preview
		gameView.fadeTo(0, 0.5);
	}
	
	// Paint the game view based on the given game state
	function paintGameView(gameState, currentGameGrid) {
		if (currentGameGrid) {
			currentGameGrid.find('tbody>tr').each(function(rowIndex, row) {
				row = $(row);
				row.children().each(function(colIndex, col) {
					col = $(col);
					if(gameState[rowIndex][colIndex] === true) {
						col.addClass('alive');
					} else {
						col.removeClass('alive');
					}
				});
			});
		} else {
			currentGameGrid = $('<table></table>').addClass('gameGrid');
			for(var i = 0; i < gameState.length; i++) {
			    var row = $('<tr></tr>').addClass('gameRow');
			    for (var j = 0; j < gameState[i].length; j++) {
			    	var col = $('<td></td>').addClass('gameCol');
			    	if (gameState[i][j] === true) {
			    		col.addClass('alive');
			    	}
			    	row.append(col);
			    }
			    currentGameGrid.append(row);			    
			}
			
			$('#gameView').empty();
			$('#gameView').append(currentGameGrid);
		}
		
		return currentGameGrid;
	}
	
	/**
	 * The functions below are pure and should not interact with any UI or state
	 */
	
	// Initializes the game state array given dimensions and a seed value
	function initializeGameState(xSize, ySize, seed) {
		var initialGameState = [];
		
		for (var i = 0; i < ySize; i++) {
			initialGameState[i] = [];
			for (var j = 0; j < xSize; j++) {
				initialGameState[i][j] = false;
			}
		}
		
		Math.seedrandom(seed);
		var iterations = Math.floor((Math.random() * (xSize * ySize)) + 1 );
		
		for(var i = 0; i < iterations; i++) {
			var randXIndex = Math.floor((Math.random() * (xSize - 1)));
		    var randYIndex = Math.floor((Math.random() * (ySize - 1)));
		    initialGameState[randYIndex][randXIndex] = true;	    		    
		}
		
		return initialGameState;
	}
	
	// Computes the next generation for the game state
	// This is the actual game of life algorithm
	function gameTick(currentGameState) {
		/*
		 * Rules:
		 *	 1. A live cell with < 2 or > 3 neighbors dies
		 *   2. A live cell with exactly 2 or 3 neighbors lives
		 *   3. A dead cell with exactly 3 neighbors comes to life
		 *
		 *  Note: An outer boundary is considered a dead adjacent cell
		 */
		
		return currentGameState.map(function(row, rowIndex, state) {
			return row.map(function(cell, cellIndex) {
				var liveNeighborCount = countNeighbors(state, rowIndex, cellIndex);
				return (cell) ? (liveNeighborCount === 2 || liveNeighborCount == 3) : (liveNeighborCount === 3);
			});
		});
 	}
	
	// Count the number of living neighbors for a given cell
	function countNeighbors(gameState, row, col) {
	    var n = 0;
	    
	    if (gameState[row][col - 1]) n++; // check left
	    if (gameState[row][col + 1]) n++; // check right
	    
		// Can I move up?
		if (gameState[row - 1]) {
			if (gameState[row - 1][col - 1]) n++; // check top left
			if (gameState[row - 1][col]) n++; // check top
			if (gameState[row - 1][col + 1]) n++; // check top right
		}
		// Can I move down?
		if (gameState[row + 1]) {
			if (gameState[row + 1][col - 1]) n++; // check bottom left
			if (gameState[row + 1][col]) n++; // check bottom
			if (gameState[row + 1][col + 1]) n++; // check bottom right
		}
		
		return n;
	}
});	
// We will use `strict mode`, which helps us by having the browser catch many common JS mistakes
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode

// PLAN
// Start Screen: Pick Beginner (8x8, 10), Intermediate (16x16, 40), Expert (30x16, 99), Custom (you choose)
// Game Starts via GenerateBoard()
// On first click, you want to not click a mine. So after first click, call GenerateMinesAndNumbers()
// Left mouse click to remove item, right mouse button to set flag or question mark. Right clicking on an already placed flag/question removes it
// Click space to switch between flag and question mark mode for right mouse click

"use strict";
const app = new PIXI.Application({
    width: 1024,
    height: 576
});
document.body.appendChild(app.view);

// constants
const sceneWidth = app.view.width;
const sceneHeight = app.view.height;	

// aliases
let stage;

// game variables
let startScene;
let gameScene,scoreLabel;

let explosionTextures;
let explosions = [];
let fireballSound;
let score = 0;
let paused = true;

//The 2D array that holds all the info
let gameBoard;
let boardWidth;
let boardHeight;
let mineCount;
let tileCount;

//These two arrays hold all of the tiles
let tileList = [];
let coveredTileList = [];
let mineList = [];

// Disables context menu so right click can maybe work.
document.addEventListener('contextmenu', event => event.preventDefault());

// NEW FUNCTIONS
// Creates the 2D board of tiles 
function GenerateBoard(width, height) {
    ClearBoard();
    gameBoard = [];
    boardWidth = width;
    boardHeight = height;
    for (let i = 0; i < boardHeight; i++) {
        let data = [];
        let coveredTilesData = [];
        for (let j = 0; j < boardWidth; j++) {
            data.push(0);
            let coverTile = new CoveredTile(32 + j * 32, 32 + i * 32, j, i);
            coveredTileList.push(coverTile);
            gameScene.addChildAt(coverTile, 1);
            coveredTilesData.push(coverTile);
        }
        gameBoard.push(data);
        CoveredTile.coveredBoard.push(coveredTilesData);
    }

    tileCount = boardHeight * boardWidth;
    console.log(gameBoard);
    console.log(CoveredTile.coveredBoard);
}

// Adds mines to the board
// Needs to randomly place each mine so that it's
// 1. not where the user first clicked
// 2. not on another mine
// Then it needs to add 1 to all tiles, except null and other mines
function GenerateMinesAndNumbers(mines) {
    mineCount = mines;
    for (let i = 0; i < mineCount; i++) {
        let mineX = Math.floor(Math.random() * boardWidth);
        let mineY = Math.floor(Math.random() * boardHeight);

        console.log(mineY);
        console.log(mineX);
        console.log(gameBoard);

        // This will make sure that the new mine isn't placed on an
        // old mine
        // TODO: Make sure that the first clicked mine also isn't selected
        while(gameBoard[mineY][mineX] == "m") {
            mineX = Math.floor(Math.random() * boardWidth);
            mineY = Math.floor(Math.random() * boardHeight);
        }

        // After a valid square is selected, change it to "m"
        gameBoard[mineY][mineX] = "m";

        // Then, add +1 to all eight tiles around it, except null and other mines
        const directions = [[-1,-1], [-1, 0], [-1, 1],
                            [0,-1],           [0, 1],
                            [1,-1],  [1, 0],  [1, 1]];
        for (const[rowOffset, colOffset] of directions) {
            let newRow = mineX + rowOffset;
            let newCol = mineY + colOffset;

            if (newRow >= 0 && newRow < gameBoard[0].length &&
                newCol >= 0 && newCol < gameBoard.length) {
                if (gameBoard[newCol][newRow] !== "m"){
                    gameBoard[newCol][newRow]++;
                } 
            }
        }
    }

    //This sets all of the mine, number, and blank tiles 
    for (let i = 0; i < boardHeight; i++) {
        for (let j = 0; j < boardWidth; j++) {
            let data = gameBoard[i][j];
            let tile = 0;

            switch(data) {
                case 0: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ZeroTile.png", "0"); break;
                case 1: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/OneTile.png", "1"); break;
                case 2: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwoTile.png", "2"); break;
                case 3: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ThreeTile.png", "3"); break;
                case 4: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FourTile.png", "4"); break;
                case 5: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FiveTile.png", "5"); break;
                case 6: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SixTile.png", "6"); break;
                case 7: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SevenTile.png", "7"); break;
                case 8: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/EightTile.png", "8"); break;
                case "m": 
                    tile = new MineTile(32 + j * 32, 32 + i * 32, j, i); 
                    mineList.push(tile);
                    break;
            }

            tileList.push(tile);
            gameScene.addChildAt(tile, 0);
        }
    }

    CoveredTile.board = gameBoard;
    console.log(gameBoard);
}

function ClearBoard() {
    coveredTileList.forEach(c=>gameScene.removeChild(c));
    coveredTileList = [];

    tileList.forEach(t=>gameScene.removeChild(t));
    tileList = [];

    explosions.forEach(e=>gameScene.removeChild(e));
    explosions = [];

    mineList = [];

    CoveredTile.globalMode = "flag";
    CoveredTile.numUncovered = 0;
    CoveredTile.board = [];
    CoveredTile.coveredBoard = [];
}

function end(result) {
    console.log("Result: " + result);
}

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        CoveredTile.toggleMode();
        scoreLabel.text = `Press Space To Switch. Current Mode: ${CoveredTile.globalMode}. Tiles Left: ${(tileCount - CoveredTile.numUncovered) - mineCount}`;
    }

    if (e.key === 'r') {
        gameScene.visible = false;
        startScene.visible = true;
    }
})

// OLD FUNCTIONS THAT HAVE BEEN MODIFIED

function setup() {
	stage = app.stage;
	// #1 - Create the `start` scene
	startScene = new PIXI.Container();
    stage.addChild(startScene);
	// #2 - Create the main `game` scene and make it invisible
    gameScene = new PIXI.Container();
    gameScene.visible = false;
    gameScene.interactiveChildren = true;
    stage.addChild(gameScene);
	// #4 - Create labels for all 3 scenes
	createLabelsAndButtons();
	// #5 - Create ship

	// #6 - Load Sounds
    fireballSound = new Howl({src: ['sounds/fireball.mp3']});
	//shootSound = new Howl({src: ['sounds/shoot.wav']});
    //hitSound = new Howl({src: ['sounds/hit.mp3']});

	// #7 - Load sprite sheet
    explosionTextures = loadSpriteSheet();
	// #8 - Start update loop
	app.ticker.add(gameLoop);
	// #9 - Start listening for click events on the canvas
	//app.view.onclick = fireBullet;

	// Now our `startScene` is visible
	// Clicking the button calls startGame()
}

function createLabelsAndButtons() {
    let buttonStyle = new PIXI.TextStyle({
        fill: 0xFF000,
        fontSize: 24,
        fontFamily: "Press Start 2P"
    });

    //set up startScene and make start label
    let startLabel1 = new PIXI.Text("Minesweeper!");
    startLabel1.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 40,
        fontFamily: "Press Start 2P",
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    startLabel1.x = 270;
    startLabel1.y = 120;
    startScene.addChild(startLabel1);

    //make middle start label
    let startLabel2 = new PIXI.Text("Don't blow up");
    startLabel2.style = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 24,
        fontFamily: "Press Start 2P",
        fontStyle: "italic",
        stroke: 0xFF0000,
        strokeThickness: 6
    });
    startLabel2.x = 350;
    startLabel2.y = 300;
    startScene.addChild(startLabel2);

    //Creates the difficulty buttons
    //Beginner (8x8, 10), Intermediate (16x16, 40), Expert (30x16, 99), Custom (you choose)
    let startButton = new PIXI.Text("Beginner");
    startButton.style = buttonStyle;
    startButton.x = 375;
    startButton.y = sceneHeight - 160;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {startGame(8,8,10);}); //startGame is a function reference
    startButton.on("pointerover", e => e.target.alpha = 0.7);
    startButton.on("pointerout", e => e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    startButton = new PIXI.Text("Intermediate");
    startButton.style = buttonStyle;
    startButton.x = 375;
    startButton.y = sceneHeight - 130;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {startGame(16,16,40);}); //startGame is a function reference
    startButton.on("pointerover", e => e.target.alpha = 0.7);
    startButton.on("pointerout", e => e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    startButton = new PIXI.Text("Expert");
    startButton.style = buttonStyle;
    startButton.x = 375;
    startButton.y = sceneHeight - 100;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", function e() {startGame(30,16,99);}); //startGame is a function reference
    startButton.on("pointerover", e => e.target.alpha = 0.7);
    startButton.on("pointerout", e => e.currentTarget.alpha = 1.0);
    startScene.addChild(startButton);

    //set up gameScene
    let textStyle = new PIXI.TextStyle({
        fill: 0xFFFFFF,
        fontSize: 12,
        fontFamily: "Press Start 2P",
        stroke: 0xFF0000,
        strokeThickness: 4
    });

    //score label
    scoreLabel = new PIXI.Text();
    scoreLabel.style = textStyle;
    scoreLabel.x = 5;
    scoreLabel.y = 5;
    gameScene.addChild(scoreLabel);
    increaseScoreBy(0);
}

function startGame(width, height, mines){
    GenerateBoard(width,height);
    GenerateMinesAndNumbers(mines);
    console.log("got to here");
    startScene.visible = false;
    gameScene.visible = true;
    score = 0;
    paused = false;
    scoreLabel.text = `Press Space To Switch. Current Mode: ${CoveredTile.globalMode} Tiles Left: ${(tileCount - CoveredTile.numUncovered) - mineCount}`;
}

function increaseScoreBy(value) {
    score += value;
    //scoreLabel.text = `Score: ${score}`;
}

function gameLoop(){
	if (paused) return; // keep this commented out for now

    scoreLabel.text = `Press Space To Switch. Current Mode: ${CoveredTile.globalMode}. Tiles Left: ${(tileCount - CoveredTile.numUncovered) - mineCount}`;

    //Checks if you lose
	for (let i = 0; i < mineList.length; i++) {
        if(mineList[i].clicked == true) {
            console.log("you went kaboom");
            createExplosion(mineList[i].x + 16, mineList[i].y + 16, 64, 64);
            //fireballSound.play();
            coveredTileList.forEach(c=>gameScene.removeChild(c));
            coveredTileList = [];
            paused = true;
            scoreLabel.text = `You Lose. Press R To Restart`;
        }
    }

    //Checks if you win
    if (CoveredTile.numUncovered >= tileCount - mineCount) {
        scoreLabel.text = `You Win!!! Press R To Restart`;
        coveredTileList.forEach(c=>gameScene.removeChild(c));
        coveredTileList = [];
        paused = true;
    }
	
}

function loadSpriteSheet() {
    // the 16 animation frames in each row are 64 x 64 pixels
    // we are using the secoond row

    let spriteSheet = PIXI.BaseTexture.from("images/explosions.png");
    let width = 64;
    let height = 64;
    let numFrames = 16;
    let textures = [];
    for (let i = 0; i < numFrames; i++) {
        let frame = new PIXI.Texture(spriteSheet, new PIXI.Rectangle(i*width, 64, width, height));
        textures.push(frame);
    }

    return textures;
}

function createExplosion(x, y, frameWidth, frameHeight) {
    // the animation frames are 64 x 64 pixels
    let w2 = frameWidth / 2;
    let h2 = frameHeight / 2;
    let expl = new PIXI.AnimatedSprite(explosionTextures);
    expl.x = x - w2; 
    expl.y = y - h2;
    expl.animationSpeed = 1/7;
    expl.loop = false;
    expl.onComplete = e => gameScene.removeChild(expl);
    explosions.push(expl);
    gameScene.addChild(expl);
    expl.play();
}
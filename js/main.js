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
let normalMineCount = 5;
let doubleMineCount = 2;
let radioactiveMineCount = 2;
let antiMineCount = 2;
let nightMineCount = 0;
let tileCount;
let gameMode = "double";
let safetyClick = true;

//These two arrays hold all of the tiles
let tileList = [];
let coveredTileList = [];
let mineList = [];
let savedRadioactive = [];

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
        for (let j = 0; j < boardWidth; j++) {
            data.push("e");
        }
        gameBoard.push(data);
    }

    tileCount = boardHeight * boardWidth;
    console.log(gameBoard);
}

function GenerateCovers() {
    for (let i = 0; i < boardHeight; i++) {
        let coveredTilesData = [];
        for (let j = 0; j < boardWidth; j++) {
            let coverTile = new CoveredTile(32 + j * 32, 32 + i * 32, j, i);
            coveredTileList.push(coverTile);
            gameScene.addChild(coverTile);
            coveredTilesData.push(coverTile);
        }
        CoveredTile.coveredBoard.push(coveredTilesData);
    }
    console.log(CoveredTile.coveredBoard);
}

// Adds mines to the board
// Needs to randomly place each mine so that it's
// 1. not where the user first clicked
// 2. not on another mine
// Then it needs to add 1 to all tiles, except null and other mines
function GenerateMinesAndNumbers(mines) {
    
    mineCount = mines;
    let mineAssortmentArray = [];
    let radioactiveArray = [];
    let mineName = "";

    switch(gameMode) {
        case "normal": 
            mineAssortmentArray.push(mines); //id 0 = normal
            mineAssortmentArray.push(0); //id 1 = double
            mineAssortmentArray.push(0); //id 2 = radioactive
            mineAssortmentArray.push(0); //id 3 = anti
            mineAssortmentArray.push(0); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "double": 
            mineAssortmentArray.push(mines/2); //id 0 = normal
            mineAssortmentArray.push(mines/2); //id 1 = double
            mineAssortmentArray.push(0); //id 2 = radioactive
            mineAssortmentArray.push(0); //id 3 = anti
            mineAssortmentArray.push(0); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Double Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "radioactive": 
            mineAssortmentArray.push(0); //id 0 = normal
            mineAssortmentArray.push(0); //id 1 = double
            mineAssortmentArray.push(mines); //id 2 = radioactive
            mineAssortmentArray.push(0); //id 3 = anti
            mineAssortmentArray.push(0); //id 4 = night
            CoveredTile.flagList.push("Radioactive Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "anti": 
            mineAssortmentArray.push(mines/2); //id 0 = normal
            mineAssortmentArray.push(0); //id 1 = double
            mineAssortmentArray.push(0); //id 2 = radioactive
            mineAssortmentArray.push(mines/2); //id 3 = anti
            mineAssortmentArray.push(0); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Anti Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "night": 
            mineAssortmentArray.push(mines/2); //id 0 = normal
            mineAssortmentArray.push(0); //id 1 = double
            mineAssortmentArray.push(0); //id 2 = radioactive
            mineAssortmentArray.push(0); //id 3 = anti
            mineAssortmentArray.push(mines/2); //id 4 = night
            CoveredTile.flagList.push("Flag");
            CoveredTile.flagList.push("Night Flag");
            CoveredTile.flagList.push("Question");
            break;
        case "custom":
            mineAssortmentArray.push(normalMineCount); //id 0 = normal
            mineAssortmentArray.push(doubleMineCount); //id 1 = double
            mineAssortmentArray.push(radioactiveMineCount); //id 2 = radioactive
            mineAssortmentArray.push(antiMineCount); //id 3 = anti
            mineAssortmentArray.push(nightMineCount); //id 4 = night

            if (normalMineCount > 0) {
                CoveredTile.flagList.push("Flag");
            }
            if (doubleMineCount > 0) {
                CoveredTile.flagList.push("Double Flag");
            }
            if (radioactiveMineCount > 0) {
                CoveredTile.flagList.push("Radioactive Flag");
            }
            if (antiMineCount > 0) {
                CoveredTile.flagList.push("Anti Flag");
            }
            if (nightMineCount > 0) {
                CoveredTile.flagList.push("Night Flag");
            }

            CoveredTile.flagList.push("Question");
            break;
    }

    CoveredTile.globalMode = CoveredTile.flagList[0];

    if (mineAssortmentArray[4] > 0) {
        CoveredTile.nightMode = true;
    }

    for (let id = 0; id < mineAssortmentArray.length; id++) {

        switch (id) {
            case 0: mineName = "m"; break;
            case 1: mineName = "d"; break;
            case 2: mineName = "r"; break;
            case 3: mineName = "a"; break;
            case 4: mineName = "k"; break;
        }

        for (let i = 0; i < mineAssortmentArray[id]; i++) {
            let mineX = Math.floor(Math.random() * boardWidth);
            let mineY = Math.floor(Math.random() * boardHeight);
            radioactiveArray = [];
            console.log("id: " + id);
    
            // This will make sure that the new mine isn't placed on an
            // old mine
            // TODO: Make sure that the first clicked mine also isn't selected
            while(gameBoard[mineY][mineX] == "m" ||
                  gameBoard[mineY][mineX] == "d" ||
                  gameBoard[mineY][mineX] == "r" ||
                  gameBoard[mineY][mineX] == "a" ||
                  gameBoard[mineY][mineX] == "k") {
                mineX = Math.floor(Math.random() * boardWidth);
                mineY = Math.floor(Math.random() * boardHeight);
            }
    
            // After a valid square is selected, change it to the mine name
            gameBoard[mineY][mineX] = mineName;
    
            // Then, add +1, +2, or -1 to all eight tiles around it, except null and other mines
            
            let directions = [];

            if (id == 4) {
                directions = [[-2,1],   [-1, 2],  [1, 2], 
                              [2, 1],             [-2, -1],
                              [-1,-2],  [1, -2],  [2, -1]];
            }
            else {
                directions = [[-1,-1], [-1, 0], [-1, 1],
                                [0,-1],           [0, 1],
                                [1,-1],  [1, 0],  [1, 1]];
            }

            for (const[rowOffset, colOffset] of directions) {
                let newRow = mineX + rowOffset;
                let newCol = mineY + colOffset;
    
                if (newRow >= 0 && newRow < gameBoard[0].length &&
                    newCol >= 0 && newCol < gameBoard.length) {
                    if (gameBoard[newCol][newRow] !== "m" &&
                        gameBoard[newCol][newRow] !== "d" &&
                        gameBoard[newCol][newRow] !== "r" &&
                        gameBoard[newCol][newRow] !== "a" &&
                        gameBoard[newCol][newRow] !== "k"){
                        
                        if (gameBoard[newCol][newRow] == "e") {gameBoard[newCol][newRow] = 0;}
    
                        switch(mineName) {
                            case "m": gameBoard[newCol][newRow]++; break;
                            case "d": gameBoard[newCol][newRow] += 2; break;
                            case "r": 
                                gameBoard[newCol][newRow]++; 
                                const savedPosition = {col:newCol, row:newRow};
                                radioactiveArray.push(savedPosition);
                                break;
                            case "a": gameBoard[newCol][newRow]--; break;
                            case "k": gameBoard[newCol][newRow]++; break;
                        }
                    } 
                }
            }

            if (id == 2) {
                console.log(radioactiveArray.length);
                let choice = Math.floor(Math.random() * radioactiveArray.length);
                gameBoard[radioactiveArray[choice].col][radioactiveArray[choice].row]++;
                savedRadioactive.push[radioactiveArray[choice]];
            }
        }
    
        //This sets all of the mine, number, and blank tiles 
        for (let i = 0; i < boardHeight; i++) {
            for (let j = 0; j < boardWidth; j++) {
                let data = gameBoard[i][j];
                let tile = 0;
    
                switch(data) {
                    case "e": tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ZeroTile.png", "e"); break;
                    case -8: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegEightTile.png", "-8"); break;
                    case -7: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegSevenTile.png", "-7"); break;
                    case -6: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegSixTile.png", "-6"); break;
                    case -5: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegFiveTile.png", "-5"); break;
                    case -4: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegFourTile.png", "-4"); break;
                    case -3: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegThreeTile.png", "-3"); break;
                    case -2: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegTwoTile.png", "-2"); break;
                    case -1: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegOneTile.png", "-1"); break;
                    case 0: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ZeroNumTile.png", "0"); break;
                    case 1: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/OneTile.png", "1"); break;
                    case 2: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwoTile.png", "2"); break;
                    case 3: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ThreeTile.png", "3"); break;
                    case 4: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FourTile.png", "4"); break;
                    case 5: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FiveTile.png", "5"); break;
                    case 6: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SixTile.png", "6"); break;
                    case 7: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SevenTile.png", "7"); break;
                    case 8: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/EightTile.png", "8"); break;
                    case 9: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NineTile.png", "9"); break;
                    case 10: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TenTile.png", "10"); break;
                    case 11: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ElevenTile.png", "11"); break;
                    case 12: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwelveTile.png", "12"); break;
                    case 13: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ThirteenTile.png", "13"); break;
                    case 14: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FourteenTile.png", "14"); break;
                    case 15: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FifteenTile.png", "15"); break;
                    case 16: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SixteenTile.png", "16"); break;
                    case 17: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SeventeenTile.png", "17"); break;
                    case 18: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/EighteenTile.png", "18"); break;
                    case 19: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NineteenTile.png", "19"); break;
                    case 20: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyTile.png", "20"); break;
                    case 21: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyOneTile.png", "21"); break;
                    case 22: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyTwoTile.png", "22"); break;
                    case 23: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyThreeTile.png", "23"); break;
                    case 24: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyFourTile.png", "24"); break;
                    case "m": //mine
                        tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/MineTile.png", "m"); 
                        mineList.push(tile);
                        break;
                    case "d": //double mine
                        tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/DoubleMineTile.png", "d"); 
                        mineList.push(tile);
                        break;
                    case "r": //radioactive mine
                        tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/RadioactiveTile.png", "r"); 
                        mineList.push(tile);
                        break;
                    case "a": //anti mine
                        tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/AntiMineTile.png", "a"); 
                        mineList.push(tile);
                        break;
                    case "k": //night mine
                        tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/NightMineTile.png", "k"); 
                        mineList.push(tile);
                        break;
                }
    
                tileList.push(tile);
                gameScene.addChild(tile);
            }
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
    savedRadioactive = [];

    safetyClick = true;
    CoveredTile.globalMode = "Temp";
    CoveredTile.numUncovered = 0;
    CoveredTile.board = [];
    CoveredTile.coveredBoard = [];
    CoveredTile.flagList = [];
    CoveredTile.currentFlag = 0;
    CoveredTile.nightMode = false;
    CoveredTile.firstClick = 0;
}

function SafetyMine(mine) {
    console.log("safety mine activated");
    safetyClick = false;

    //logic
    //remove old numbers
    //move mine
    //add new numbers
    //regenerate board

    let directions = [];

    //determine what type of mine it is
    if (mine.tileData == "k") {
        directions = [[-2,1],   [-1, 2],  [1, 2], 
                      [2, 1],             [-2, -1],
                      [-1,-2],  [1, -2],  [2, -1]];
    }
    else {
        directions = [[-1,-1], [-1, 0], [-1, 1],
                        [0,-1],           [0, 1],
                        [1,-1],  [1, 0],  [1, 1]];
    }

    //Remove old numbers
    for (const[rowOffset, colOffset] of directions) {
        let newRow = mine.xIndex + rowOffset;
        let newCol = mine.yIndex + colOffset;

        if (newRow >= 0 && newRow < gameBoard[0].length &&
            newCol >= 0 && newCol < gameBoard.length) {
            if (gameBoard[newCol][newRow] !== "m" &&
                gameBoard[newCol][newRow] !== "d" &&
                gameBoard[newCol][newRow] !== "r" &&
                gameBoard[newCol][newRow] !== "a" &&
                gameBoard[newCol][newRow] !== "k"){
                
                if (gameBoard[newCol][newRow] == "e") {gameBoard[newCol][newRow] = 0;}

                switch(mine.tileData) {
                    case "m": gameBoard[newCol][newRow]--; break;
                    case "d": gameBoard[newCol][newRow] -= 2; break;
                    case "r": gameBoard[newCol][newRow]--; 
                        for (let i = 0; i < savedRadioactive.length; i++) {
                            if (savedRadioactive[i].col == newCol &&
                                savedRadioactive[i].row == newRow) {
                                    gameBoard[newCol][newRow]--; 
                                }
                        }
                        break;
                    case "a": gameBoard[newCol][newRow]++; break;
                    case "k": gameBoard[newCol][newRow]--; break;
                }

                //Make sure 0 tiles and empty tiles are displayed correctly
                if (gameBoard[newCol][newRow] == "0" && mine.tileData != "a") {
                    gameBoard[newCol][newRow] = "e";
                }
            } 
        }
    }

    //move mine to a new location
    let mineX = Math.floor(Math.random() * boardWidth);
    let mineY = Math.floor(Math.random() * boardHeight);
    let radioactiveArray = [];    

    while(gameBoard[mineY][mineX] == "m" ||
          gameBoard[mineY][mineX] == "d" ||
          gameBoard[mineY][mineX] == "r" ||
          gameBoard[mineY][mineX] == "a" ||
          gameBoard[mineY][mineX] == "k") {
               mineX = Math.floor(Math.random() * boardWidth);
               mineY = Math.floor(Math.random() * boardHeight);
        }
    
    // After a valid square is selected, change it to the mine name
    // Remove old mine
    gameBoard[mineY][mineX] = mine.tileData;
    gameBoard[mine.yIndex][mine.xIndex] = "e";
    
    // Then, add +1, +2, or -1 to all eight tiles around it, except null and other mines
    for (const[rowOffset, colOffset] of directions) {
        let newRow = mineX + rowOffset;
        let newCol = mineY + colOffset;
    
            if (newRow >= 0 && newRow < gameBoard[0].length &&
                newCol >= 0 && newCol < gameBoard.length) {
                if (gameBoard[newCol][newRow] !== "m" &&
                    gameBoard[newCol][newRow] !== "d" &&
                    gameBoard[newCol][newRow] !== "r" &&
                    gameBoard[newCol][newRow] !== "a" &&
                    gameBoard[newCol][newRow] !== "k"){
                        
                    if (gameBoard[newCol][newRow] == "e") {gameBoard[newCol][newRow] = 0;}
    
                    switch(mine.tileData) {
                        case "m": gameBoard[newCol][newRow]++; break;
                        case "d": gameBoard[newCol][newRow] += 2; break;
                        case "r": 
                                gameBoard[newCol][newRow]++; 
                                const savedPosition = {col:newCol, row:newRow};
                                radioactiveArray.push(savedPosition);
                                break;
                        case "a": gameBoard[newCol][newRow]--; break;
                        case "k": gameBoard[newCol][newRow]++; break;
                        }
                    } 
                }
            }

            if (mine.tileData == "r") {
                console.log(radioactiveArray.length);
                let choice = Math.floor(Math.random() * radioactiveArray.length);
                gameBoard[radioactiveArray[choice].col][radioactiveArray[choice].row]++;
            }
    
    //Remove everything from the board

    let savedX = mine.xIndex;
    let savedY = mine.yIndex;

    coveredTileList.forEach(c=>gameScene.removeChild(c));
    coveredTileList = [];

    mineList.forEach(e=>gameScene.removeChild(e));
    mineList = [];

    tileList.forEach(t=>gameScene.removeChild(t));
    tileList = [];

    //Remake the board
    for (let i = 0; i < boardHeight; i++) {
        for (let j = 0; j < boardWidth; j++) {
            let data = gameBoard[i][j];
            let tile = 0;

            switch(data) {
                case "e": tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ZeroTile.png", "e"); break;
                case -8: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegEightTile.png", "-8"); break;
                case -7: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegSevenTile.png", "-7"); break;
                case -6: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegSixTile.png", "-6"); break;
                case -5: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegFiveTile.png", "-5"); break;
                case -4: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegFourTile.png", "-4"); break;
                case -3: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegThreeTile.png", "-3"); break;
                case -2: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegTwoTile.png", "-2"); break;
                case -1: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NegOneTile.png", "-1"); break;
                case 0: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ZeroNumTile.png", "0"); break;
                case 1: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/OneTile.png", "1"); break;
                case 2: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwoTile.png", "2"); break;
                case 3: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ThreeTile.png", "3"); break;
                case 4: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FourTile.png", "4"); break;
                case 5: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FiveTile.png", "5"); break;
                case 6: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SixTile.png", "6"); break;
                case 7: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SevenTile.png", "7"); break;
                case 8: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/EightTile.png", "8"); break;
                case 9: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NineTile.png", "9"); break;
                case 10: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TenTile.png", "10"); break;
                case 11: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ElevenTile.png", "11"); break;
                case 12: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwelveTile.png", "12"); break;
                case 13: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/ThirteenTile.png", "13"); break;
                case 14: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FourteenTile.png", "14"); break;
                case 15: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/FifteenTile.png", "15"); break;
                case 16: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SixteenTile.png", "16"); break;
                case 17: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/SeventeenTile.png", "17"); break;
                case 18: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/EighteenTile.png", "18"); break;
                case 19: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/NineteenTile.png", "19"); break;
                case 20: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyTile.png", "20"); break;
                case 21: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyOneTile.png", "21"); break;
                case 22: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyTwoTile.png", "22"); break;
                case 23: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyThreeTile.png", "23"); break;
                case 24: tile = new Tile(32 + j * 32, 32 + i * 32, j, i, "images/TwentyFourTile.png", "24"); break;
                case "m": //mine
                    tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/MineTile.png", "m"); 
                    mineList.push(tile);
                    break;
                case "d": //double mine
                    tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/DoubleMineTile.png", "d"); 
                    mineList.push(tile);
                    break;
                case "r": //radioactive mine
                    tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/RadioactiveTile.png", "r"); 
                    mineList.push(tile);
                    break;
                case "a": //anti mine
                    tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/AntiMineTile.png", "a"); 
                    mineList.push(tile);
                    break;
                case "k": //night mine
                    tile = new MineTile(32 + j * 32, 32 + i * 32, j, i, "images/NightMineTile.png", "k"); 
                    mineList.push(tile);
                    break;
            }

            tileList.push(tile);
            gameScene.addChild(tile);
        }
    }

    //Regenerate the covers
    CoveredTile.coveredBoard = [];
    GenerateCovers();

    //Call the reveal adjacent tile on the now empty mine square
    for (let i = 0; i < coveredTileList.length; i++) {
        if(coveredTileList[i].yIndex == savedY &&
           coveredTileList[i].xIndex == savedX) {
            coveredTileList[i].revealAdjacent();
        }
    }
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
}

function startGame(width, height, mines){
    GenerateBoard(width,height);
    GenerateMinesAndNumbers(mines);
    GenerateCovers();
    console.log("got to here");
    startScene.visible = false;
    gameScene.visible = true;
    score = 0;
    paused = false;
    scoreLabel.text = `Press Space To Switch. Current Mode: ${CoveredTile.globalMode} Tiles Left: ${(tileCount - CoveredTile.numUncovered) - mineCount}`;
}

function gameLoop(){
	if (paused) return; // keep this commented out for now

    scoreLabel.text = `Press Space To Switch. Current Mode: ${CoveredTile.globalMode}. Tiles Left: ${(tileCount - CoveredTile.numUncovered) - mineCount}`;

    //Checks if you lose
	for (let i = 0; i < mineList.length; i++) {
        if(mineList[i].clicked == true && safetyClick == false) {
            console.log("you went kaboom");
            createExplosion(mineList[i].x + 16, mineList[i].y + 16, 64, 64);
            //fireballSound.play();
            coveredTileList.forEach(c=>gameScene.removeChild(c));
            coveredTileList = [];
            paused = true;
            scoreLabel.text = `You Lose. Press R To Restart`;
        }
        else if (mineList[i].clicked == true && safetyClick == true) {
            mineList[i].clicked = false;
            SafetyMine(mineList[i]);
        }
    }

    if (CoveredTile.firstClick >= 2) {
        safetyClick = false;
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
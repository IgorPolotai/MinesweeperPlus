// The Tile class handles all of the Mine, Number, Borders, and Cover Tiles, and holds useful data
class Tile extends PIXI.Sprite {
    constructor(x, y, xIndex, yIndex, tileImage, tileData) {
        super(app.loader.resources[tileImage].texture);
        this.anchor.set(.5,.5);
        this.x = x;
        this.y = y;
        this.xIndex = xIndex;
        this.yIndex = yIndex;
        this.tileData = tileData;
    }
}

// The Mine Tile used to handle the checking of whether a Mine Tile was clicked, but that 
// got absorbed by the CoveredTile, so now this class is a relic of the past that I'm too 
// afraid to delete in case I anger the JavaScript Gods and they 404 my life. This class
// currently does nothing special at all.
class MineTile extends Tile {
    constructor(x, y, xIndex, yIndex, tileImage, tileData) {
        super(x, y, xIndex, yIndex, tileImage, tileData);
    }
}

// The CoveredTile class is the real brains of Minesweeper. It handles everything from
// placing flags, checking if the mines are clicked, revealing adjacent tiles if you click
// and empty one, and much much more.
class CoveredTile extends Tile {
    constructor(x, y, xIndex, yIndex, tileImage, tileData) {
        super(x, y, xIndex, yIndex, tileImage, tileData);

        this.interactive = true;
        this.buttomMode = true;
        this.on('mousedown', this.changeFace.bind(this));
        this.on('mouseupoutside', this.changeFaceOutside.bind(this));
        this.on('mouseup', this.onSpriteClick.bind(this));
        this.on('rightdown', this.placeMark.bind(this));
    }

    // Changes what flag you can place when you press space
    static toggleMode() {
        CoveredTile.currentFlag++;

        if (CoveredTile.currentFlag >= CoveredTile.flagList.length) {
            CoveredTile.currentFlag = 0;
        }

        CoveredTile.globalMode = CoveredTile.flagList[CoveredTile.currentFlag];
        //console.log("Mode is now: " + CoveredTile.globalMode);
    }

    // Changes the Smiley Face to shocked when you hold down the mouse on a Covered Tile
    changeFace() {
        CoveredTile.face.texture = PIXI.Texture.from('images/ScaredFace.png');
    }

    // Changes the Smiley Face to happy if you hold down the mouse and release it outside of a Tile
    changeFaceOutside() {
        CoveredTile.face.texture = PIXI.Texture.from('images/HappyFace.png');
    }

    // This function handles all of the flag placing. There are a total of six unique flags that can
    // be placed: Five for each type of mine, and the Question Mark, which is available in every gamemode
    // Flags cannot be placed on Night Tiles. 
    placeMark() {
        if(this.parent && this.tileData != "night") {

            switch (CoveredTile.globalMode) {
                case "Flag": //Flag for Normal Mines
                    if (this.texture == PIXI.Texture.from('images/FlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/FlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Double Flag": //Flags for Double Mines
                    if (this.texture == PIXI.Texture.from('images/DoubleFlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/DoubleFlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Radioactive Flag": //Flags for Radioactive Mines
                    if (this.texture == PIXI.Texture.from('images/RadioactiveFlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/RadioactiveFlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Anti Flag": //Flags for Anti Mines
                    if (this.texture == PIXI.Texture.from('images/NegFlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/NegFlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Night Flag": //Flags for Night Mines
                    if (this.texture == PIXI.Texture.from('images/NightFlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/NightFlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Question": //Question tile
                    if (this.texture == PIXI.Texture.from('images/QuestionTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/QuestionTile.png');
                    }
                break;
            }
        }
    }
    

    // This function handles removing the Covered Tile when it is clicked. It handles checking if 
    // you clicked on a mine. It also handles revealing surrounding tiles when you're in Night Mode
    onSpriteClick(event) {
        CoveredTile.face.texture = PIXI.Texture.from('images/HappyFace.png');
        if(this.parent && this.containsPoint(event.data.global)) {
                //console.log(CoveredTile.board[this.yIndex][this.xIndex]);
                if (CoveredTile.board[this.yIndex][this.xIndex] == "e" &&
                    CoveredTile.nightMode == false) {
                    CoveredTile.dig.play();
                    this.revealAdjacent();
                }
                else {
                    if(CoveredTile.board[this.yIndex][this.xIndex] == "m" ||
                       CoveredTile.board[this.yIndex][this.xIndex] == "d" ||
                       CoveredTile.board[this.yIndex][this.xIndex] == "r" ||
                       CoveredTile.board[this.yIndex][this.xIndex] == "a" ||
                       CoveredTile.board[this.yIndex][this.xIndex] == "k") {
                            CoveredTile.mineTileClicked = this;
                       }
                    else {
                        CoveredTile.dig.play();
                    }

                    //Makes sure that if you remove a tile with a flag on it, the flag counter is properly incremented
                    if (this.texture != PIXI.Texture.from('images/CoveredTile.png') &&
                        this.texture != PIXI.Texture.from('images/NightCoveredTile.png')) {
                            CoveredTile.flagsLeft++;
                        }
                    
                    this.parent.removeChild(this);
                    CoveredTile.numUncovered++;
                }

            CoveredTile.firstClick++;

            //If Night Mode is active, this changes the tiles around the one clicked from night to covered
            if (CoveredTile.nightMode == true) {
                const directions = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1],           [0, 1],
                    [1, -1],  [1, 0],  [1, 1]
                ];
            
                for (const [rowOffset, colOffset] of directions) {
                    const newRow = this.xIndex + rowOffset;
                    const newCol = this.yIndex + colOffset;
            
                    if (newRow >= 0 && newRow < CoveredTile.board[0].length &&
                        newCol >= 0 && newCol < CoveredTile.board.length) 
                        {
        
                        let adjacentTile = CoveredTile.coveredBoard[newCol][newRow];
                        if (adjacentTile.texture == PIXI.Texture.from('images/NightCoveredTile.png')) {
                            adjacentTile.texture = PIXI.Texture.from('images/CoveredTile.png');
                            adjacentTile.tileData = "cover";
                        }
                    }
                }
            }    
        }
    }

    // This recursive function was by far the thing that gave me the most difficulty. It correctly will reveal all surrounding
    // empty tiles, plus the parameter of number tiles, if you click on an empty space. I had to modify it so it wouldn't reveal
    // mines, since Night Mines are often surrounded by empty tiles. 
    revealAdjacent() {
        if (!this.parent) {return;}
    
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
    
        //Makes sure that if you remove a tile with a flag on it, the flag counter is properly incremented
        if (this.texture != PIXI.Texture.from('images/CoveredTile.png') &&
            this.texture != PIXI.Texture.from('images/NightCoveredTile.png')) {
                CoveredTile.flagsLeft++;
        }

        // Reveal this tile if it is empty
        this.parent.removeChild(this);
        CoveredTile.numUncovered++;
        CoveredTile.coveredBoard[this.yIndex][this.xIndex] = null;
    
        // This uses the algorithm I wrote for placing numbers, but instead modified to look for empty tiles
        for (const [rowOffset, colOffset] of directions) {
            const newRow = this.xIndex + rowOffset;
            const newCol = this.yIndex + colOffset;
    
            if (newRow >= 0 && newRow < CoveredTile.board[0].length &&
                newCol >= 0 && newCol < CoveredTile.board.length) 
                {

                let adjacentTile = CoveredTile.coveredBoard[newCol][newRow];
    
                //If the surrounding tile is empty, call this function on that tile
                if (adjacentTile !== null && adjacentTile.parent !== null && CoveredTile.board[newCol][newRow] == "e") {
                    adjacentTile.revealAdjacent();

                //If the surrounding tile is a number, reveal it and end this recursive nightmare
                } else if (adjacentTile !== null && adjacentTile.parent !== null && CoveredTile.board[newCol][newRow] != "e" &&
                           CoveredTile.board[newCol][newRow] != "m" && CoveredTile.board[newCol][newRow] != "d" &&
                           CoveredTile.board[newCol][newRow] != "r" && CoveredTile.board[newCol][newRow] != "a" &&
                           CoveredTile.board[newCol][newRow] != "k") {
                    //console.log("removing adjacent: " + (adjacentTile.parent == null));
                    
                    //Makes sure that if you remove a tile with a flag on it, the flag counter is properly incremented
                    if (adjacentTile.texture != PIXI.Texture.from('images/CoveredTile.png') &&
                        adjacentTile.texture != PIXI.Texture.from('images/NightCoveredTile.png')) {
                            CoveredTile.flagsLeft++;
                    }
                    adjacentTile.parent.removeChild(adjacentTile);
                    CoveredTile.numUncovered++;
                    CoveredTile.coveredBoard[newCol][newRow] = null;
                }
            }
        }
    }    
}
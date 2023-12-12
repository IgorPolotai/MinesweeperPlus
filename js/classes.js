class Tile extends PIXI.Sprite {
    constructor(x, y, xIndex, yIndex, tileImage, tileData) {
        super(app.loader.resources[tileImage].texture);
        //this.anchor.set(.5,.5);
        this.x = x;
        this.y = y;
        this.xIndex = xIndex;
        this.yIndex = yIndex;
        this.tileData = tileData;
    }
}

class MineTile extends Tile {
    constructor(x, y, xIndex, yIndex) {
        super(x, y, xIndex, yIndex, "images/MineTile.png", "m");

        this.interactive = true;
        this.buttomMode = true;
        this.on('pointerup', this.onSpriteClick.bind(this));
        this.clicked = false;
    }

    //Ends the game if a Mine Tile is clicked
    onSpriteClick() {
        console.log("get ready for the");
        if(this.parent) {
            this.clicked = true;
            console.log("boom!!!!");
        }
    }
}

class CoveredTile extends Tile {
    constructor(x, y, xIndex, yIndex) {
        super(x, y, xIndex, yIndex, "images/CoveredTile.png", "cover");

        this.interactive = true;
        this.buttomMode = true;
        this.hasFlag = false;
        this.hasQuestion = false;
        this.on('mousedown', this.onSpriteClick.bind(this));
        this.on('rightdown', this.placeMark.bind(this));
    }

    static toggleMode() {
        switch(CoveredTile.globalMode) {
            case "flag": CoveredTile.globalMode = "question"; break;
            case "question": CoveredTile.globalMode = "flag"; break;
            default: CoveredTile.globalMode = "flag"; break;
        }
        console.log("Mode is now: " + CoveredTile.globalMode);
    }

    placeMark() {
        if(this.parent) {
            if (CoveredTile.globalMode === "flag") {
                if (this.hasFlag == false) {
                    this.hasFlag = true;
                    this.texture = PIXI.Texture.from('images/FlagTile.png');
                }
                else {
                    this.hasFlag = false;
                    this.texture = PIXI.Texture.from('images/CoveredTile.png');
                }
            }
            else if (CoveredTile.globalMode === "question") {
                if (this.hasQuestion == false) {
                    this.hasQuestion = true;
                    this.texture = PIXI.Texture.from('images/QuestionTile.png');
                }
                else {
                    this.hasQuestion = false;
                    this.texture = PIXI.Texture.from('images/CoveredTile.png');
                }
            }
        }
    }

    //Removes the Covered Tile when it is clicked, but only in the Game Scene
    onSpriteClick() {
        if(this.parent) {
                console.log(CoveredTile.board[this.yIndex][this.xIndex]);
                if (CoveredTile.board[this.yIndex][this.xIndex] == "0") {
                    this.revealAdjacent();
                }
                else {
                    this.parent.removeChild(this);
                    CoveredTile.numUncovered++;
                }
        }
    }

    revealAdjacent() {
        //LOGIC

        //If empty, call revealAdjacent on all surrounding tiles
        //If number, don't
        //Remove and set current to null

        // Reveal this tile
        
        //console.log("adj called: " + CoveredTile.board[this.yIndex][this.xIndex] != "0");

        if (CoveredTile.board[this.yIndex][this.xIndex] != "0" && this != null) {
            console.log("got here?" + this != null);
            this.parent.removeChild(this);
            CoveredTile.numUncovered++;
        }
        else {
            const directions = 
            [[-1, -1], [-1, 0], [-1, 1], 
            [0, -1],           [0, 1], 
            [1, -1],  [1, 0],  [1, 1]];

            for (const [rowOffset, colOffset] of directions) {
                 const newRow = this.yIndex + rowOffset;
                 const newCol = this.xIndex + colOffset;

                if (newRow >= 0 && newRow < CoveredTile.board[0].length &&
                    newCol >= 0 && newCol < CoveredTile.board.length) {
                    
                    let adjacentTile = CoveredTile.coveredBoard[newRow][newCol];
                    console.log(adjacentTile);

                    if (adjacentTile != null) {
                        this.parent.removeChild(this);
                        CoveredTile.numUncovered++;
                        adjacentTile.revealAdjacent();
                    }
                }
            }
        }
    }
}


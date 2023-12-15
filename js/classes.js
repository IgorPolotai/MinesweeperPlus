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

class MineTile extends Tile {
    constructor(x, y, xIndex, yIndex, tileImage, tileData) {
        super(x, y, xIndex, yIndex, tileImage, tileData);
    }
}

class CoveredTile extends Tile {
    constructor(x, y, xIndex, yIndex, tileImage, tileData) {
        super(x, y, xIndex, yIndex, tileImage, tileData);

        this.interactive = true;
        this.buttomMode = true;
        this.on('mouseup', this.onSpriteClick.bind(this));
        this.on('rightdown', this.placeMark.bind(this));
    }

    static toggleMode() {
        CoveredTile.currentFlag++;

        if (CoveredTile.currentFlag >= CoveredTile.flagList.length) {
            CoveredTile.currentFlag = 0;
        }

        CoveredTile.globalMode = CoveredTile.flagList[CoveredTile.currentFlag];
        console.log("Mode is now: " + CoveredTile.globalMode);
    }

    placeMark() {
        if(this.parent && this.tileData != "night") {

            switch (CoveredTile.globalMode) {
                case "Flag":
                    if (this.texture == PIXI.Texture.from('images/FlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/FlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Double Flag":
                    if (this.texture == PIXI.Texture.from('images/DoubleFlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/DoubleFlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Radioactive Flag":
                    if (this.texture == PIXI.Texture.from('images/RadioactiveFlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/RadioactiveFlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Anti Flag":
                    if (this.texture == PIXI.Texture.from('images/NegFlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/NegFlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Night Flag":
                    if (this.texture == PIXI.Texture.from('images/NightFlagTile.png')) {
                        this.texture = PIXI.Texture.from('images/CoveredTile.png');
                        CoveredTile.flagsLeft++;
                    }
                    else {
                        this.texture = PIXI.Texture.from('images/NightFlagTile.png');
                        CoveredTile.flagsLeft--;
                    }
                break;
                case "Question":
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
    

    //Removes the Covered Tile when it is clicked, but only in the Game Scene
    onSpriteClick(event) {
        if(this.parent && this.containsPoint(event.data.global)) {
                console.log(CoveredTile.board[this.yIndex][this.xIndex]);
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

                    this.parent.removeChild(this);
                    CoveredTile.numUncovered++;
                }

            CoveredTile.firstClick++;

            //This changes the tiles around the one clicked from night to covered
            if (CoveredTile.nightMode == true) {
                const directions = [
                    [-1, -1], [-1, 0], [-1, 1],
                    [0, -1],           [0, 1],
                    [1, -1],  [1, 0],  [1, 1]
                ];
            
                for (const [rowOffset, colOffset] of directions) {
                    const newRow = this.yIndex + rowOffset;
                    const newCol = this.xIndex + colOffset;
            
                    if (newRow >= 0 && newRow < CoveredTile.board[0].length &&
                        newCol >= 0 && newCol < CoveredTile.board.length) 
                        {
        
                        let adjacentTile = CoveredTile.coveredBoard[newRow][newCol];
                        adjacentTile.texture = PIXI.Texture.from('images/CoveredTile.png');
                        adjacentTile.tileData = "cover";
                    }
                }
            }    
        }
    }


    revealAdjacent() {
        if (!this.parent) {return;}
    
        const directions = [
            [-1, -1], [-1, 0], [-1, 1],
            [0, -1],           [0, 1],
            [1, -1],  [1, 0],  [1, 1]
        ];
    
        // Reveal this tile if it is empty
        this.parent.removeChild(this);
        CoveredTile.numUncovered++;
        CoveredTile.coveredBoard[this.yIndex][this.xIndex] = null;
    
        for (const [rowOffset, colOffset] of directions) {
            const newRow = this.yIndex + rowOffset;
            const newCol = this.xIndex + colOffset;
    
            if (newRow >= 0 && newRow < CoveredTile.board[0].length &&
                newCol >= 0 && newCol < CoveredTile.board.length) 
                {

                let adjacentTile = CoveredTile.coveredBoard[newRow][newCol];
    
                if (adjacentTile !== null && adjacentTile.parent !== null && CoveredTile.board[newRow][newCol] == "e") {
                    adjacentTile.revealAdjacent();
                } else if (adjacentTile !== null && adjacentTile.parent !== null && CoveredTile.board[newRow][newCol] != "e" &&
                           CoveredTile.board[newRow][newCol] != "m" && CoveredTile.board[newRow][newCol] != "d" &&
                           CoveredTile.board[newRow][newCol] != "r" && CoveredTile.board[newRow][newCol] != "a" &&
                           CoveredTile.board[newRow][newCol] != "k") {
                    console.log("removing adjacent: " + (adjacentTile.parent == null));
                    adjacentTile.parent.removeChild(adjacentTile);
                    CoveredTile.numUncovered++;
                    CoveredTile.coveredBoard[newRow][newCol] = null;
                }
            }
        }
    }    
}
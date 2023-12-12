WebFont.load({
    google: {
        families: ['Press Start 2P']
    },
    active: e => {
        console.log("font loaded!");
        // pre-load the images
        app.loader.
            add([
                "images/CoveredTile.png",
                "images/ZeroTile.png",
                "images/OneTile.png",
                "images/TwoTile.png",
                "images/ThreeTile.png",
                "images/FourTile.png",
                "images/FiveTile.png",
                "images/SixTile.png",
                "images/SevenTile.png",
                "images/EightTile.png",
                "images/MineTile.png",
                "images/QuestionTile.png",
                "images/explosions.png"
            ]);
        app.loader.onProgress.add(e => { console.log(`progress=${e.progress}`) });
        app.loader.onComplete.add(setup);
        app.loader.load();
    }
});
function onKeyPress(key) {
    const player = document.querySelector('.player-controls')
    if (player) { // new deezer style (2018)
        const getParentButton = className => {
            const el = player.querySelector(`.${className}`)
            return el ? el.parentElement : el
        }
        handleKeyEvents(key, {
            isPlaying: player.querySelector('.svg-icon-pause') !== null,
            playButton: getParentButton('svg-icon-play'),
            pauseButton: getParentButton('svg-icon-pause'),
            prevButton: getParentButton('svg-icon-prev'),
            nextButton: getParentButton('svg-icon-next')
        })
    } else { // old deezer style
        handleKeyEvents(key)
    }
}

function handleKeyEvents(key, config = {
    isPlaying: document.querySelector('.control-play') !== null,
    playButton: document.querySelector('.control-play'),
    pauseButton: document.querySelector('.control-pause'),
    prevButton: document.querySelector('.control-prev'),
    nextButton: document.querySelector('.control-next')
}) {
    if (key === NEXT) {
        simulateClick(config.nextButton);
    } else if (key === PLAY) {
        if (config.isPlaying) {
            simulateClick(config.pauseButton)
        } else {
            simulateClick(config.playButton)
        }
    } else if (key === PREV) {
        simulateClick(config.prevButton);
    }
}

pluginLoaded('deezer');

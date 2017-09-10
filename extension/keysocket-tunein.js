function onKeyPress(key) {
    if (key === PLAY) {
	    var playPauseButton = document.querySelector('.play-button');
	    simulateClick(playPauseButton);
    }
}

pluginLoaded('tunein');
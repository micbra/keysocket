function onKeyPress(key) {
    if (key === PLAY) {
        simulateClick(document.querySelector('#audiomute'));
    }
}

pluginLoaded('Music Choice');
function onKeyPress(key) {

    var skipButtonSelector = '#player_skip_button';
    var playButtonSelector = '#player_play_button';
    var pauseButtonSelector = '#player_pause_button';
    var nextMixButtonSelector = '#next_mix_button';

    if (key === NEXT) {
        pressOneButtonOrAnother(skipButtonSelector, nextMixButtonSelector)
    } else if (key === PLAY) {
        pressOneButtonOrAnother(playButtonSelector, pauseButtonSelector)
    }
}

function pressOneButtonOrAnother(oneButtonSelector,anotherButtonSelector) {
    var oneButton = document.querySelector(oneButtonSelector);
    if(window.getComputedStyle(oneButton).display == "none"){
        var anotherButton = document.querySelector(anotherButtonSelector);
        simulateClick(anotherButton);
    }
    else{
        simulateClick(oneButton);
    }
}

console.log('keysocket: Loading 8tracks\' extension keysocket');

const ipc = require('electron').ipcRenderer;
const results = document.querySelector('#Results');

ipc.on('url', (event, message) => {
    console.log("url: " + message);
    results.innerHTML += message;
});

ipc.on('matchedWord', (event, message) => {
    console.log("Matched word: " + message);
    results.innerHTML += message;
});
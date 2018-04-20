const results = document.querySelector('.results');
const ipc = require('electron').ipcRenderer;
const opn = require('opn');

var keywordContainer;
var resultContainer;
var urlContainer;
var keywords = [];

var nameReceived = false;
var depthReceived = false;

ipc.on('url', (event, message) => {
  console.log(message);

  resultContainer = document.createElement('div');
  resultContainer.className = 'resultContainer';

  urlContainer = document.createElement('div');
  urlContainer.className = 'urlContainer';
  urlContainer.innerHTML = message;

  urlContainer.addEventListener('click', function() {
    opn(message, { app: 'safari' }); // change to whatever browser you want.
  });
});

ipc.on('matchedWord', (event, message) => {
    console.log(message);
    
    if (haveAdded(message)) {
      var section = document.querySelector('#' + message.trim());
      resultContainer.append(urlContainer);
      section.append(resultContainer);
    }
    else {
      createSection(message);
    }
});

ipc.on('crawlName', (event, message) => {
  if (!nameReceived) {
    document.querySelector('.reportName').innerHTML = 'Crawl Report: ' + message;
    nameReceived = true;
  }
});

ipc.on('depth', (event, message) => {
  if (!depthReceived) {
    document.querySelector('.depthLevel').innerHTML = 'Crawl Depth: ' + message;
    depthReceived = true;
  }
});

function createSection(keyword) {
  var titleContainer = document.createElement('div');
  titleContainer.className = 'sectionTitle';
  titleContainer.innerHTML = keyword.trim();

  keywordContainer = document.createElement('div');
  keywordContainer.className = 'keywordContainer';
  keywordContainer.id = keyword.trim();

  resultContainer.append(urlContainer);
  keywordContainer.append(titleContainer);
  keywordContainer.append(resultContainer);
  results.append(keywordContainer);

  keywords.push(keyword);
}

function haveAdded(keyword) {
  var result = false;
  if (keywords.includes(keyword)) {
    result = true;
  }
  return result;
}

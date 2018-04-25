// module for making http/https requests
const request = require('request');
// module for easily parsing html
const cheerio = require('cheerio');
// module for accessing the file system
const fs = require('fs');
// module for database connection
const sqlite3 = require('sqlite3');
//module to allow direct paths to fileSize
const path = require('path');
//module to allow electron functionality
const electron = require('electron');

const BrowserWindow = electron.remote.BrowserWindow;


//Variables for searches
var maxDepth;
var startingSite;
var keywords;

//Variables for html objects
const crawlNameInput = document.querySelector('.crawlNameInput');
const startUrlInput = document.querySelector('.startUrlInput');
const crawlDepthInput = document.querySelector('.crawlDepthInput');
const keywordInput = document.querySelector('.keywordInput');
const notification = document.querySelector('#message');
const status = document.querySelector('#status');
const runButton = document.querySelector('#run');
const clearButton = document.querySelector('#clear');
const toggleSwitch = document.querySelector('.theme');
const reportBtn = document.querySelector('#reportBtn');
const dbPath = path.resolve('C:\\Users\\Ansari\\Documents\\GitHub\\BrandNinja\\Searches.db');
const saveButton = document.querySelector('#history');
const loadButton = document.querySelector('#file');

/*
Recursive function for crawling
 */
let visited = new Set();
function crawl(startingSite, depth) {
    if (depth < maxDepth) {
        getLinks(startingSite, function (sites) { //pulls all the links from a specific page and returns them as an array of strings
            for (var i = 0; i < sites.length; i++) { //for each string we got from the page
                findTarget(sites[i], depth); //find any of the keywords we want on the page, print out if so
                crawl(sites[i], depth + 1); //crawl all the pages on that page, and increase the depth
            }
        });
    }
}

/*
Runs through a list of sites and tries to find any of the keywords
 */
function findTarget(site, depth) {
    findInPage(keywords, site, function (containsATarget, target, url) {
        if (containsATarget) {
            //TODO: PRINT TO FILE
            //writeToFile("Matched a keyword: " + target + " at: " + url + " with a depth of: " + (depth + 1));
            //console.log("Matched a keyword: " + target + " at: " + url + " with a depth of: " + (depth + 1));
            addToWindow(url, target);
        }
    });
}
/*
Returns a list of urls found on a parent url page
 */
function getLinks(parentURL, callback) {
    let url = parentURL;
    let set = new Set();
    if (url != undefined) {
        request(url, function (error, response, body) {
            if (!error) {
                var $ = cheerio.load(body);
                $('a').each(function (i, elem) {
                    if (!visited.has(elem.attribs.href)) {
                        console.log("added");
                        set.add(elem.attribs.href);
                        visited.add(elem.attribs.href);
                    }
                });
            }
            callback(Array.from(set));
        });
    }
    else {

    }
}


/*
Returns true if a page contains one of the target keywords, as well as the URL it was found at, and the target itself;
 */
function findInPage(target, url, callback) {
    if (url != undefined) {
        request(url, function (error, response, body) {
            if (!error) {
                var $ = cheerio.load(body);
                var bodyText = $('html > body').text().toLowerCase();
                let htmlBodySet = new Set(bodyText.split(' '));
                var htmlBody = Array.from(htmlBodySet);
                var targets = target.split(',');
                for (var i = 0; i < targets.length; i++) {
                    targets[i].trim();
                    console.log("SEARCHING: " + targets[i]);
                    if(htmlBody.includes(target[i]))
                    {
                        console.log("MATCH: " + targets[i]  + " at: " + url);
                        return callback(true, targets[i], url);
                    }
                }
            }
        });
    }
    else {
        return callback(false, null, url);
    }
}


runButton.addEventListener('click', function () {
	if(validateInputs()) {
		visited.clear();
		maxDepth = parseInt(crawlDepthInput.value);
		crawlName = crawlNameInput.value; //TODO: do something with the name
		startingSite = startUrlInput.value;
		keywords = keywordInput.value;
		reportBtn.style.opacity = 0;
		run();
	}
});

function run() {
    crawl(startingSite, 0);
    resultsWindow();
}
let win = null;
function resultsWindow()
{
	win = new BrowserWindow({width: 800, height: 600})
	win.on('closed', () => {
		win = null
	});
	win.loadURL(`file://${__dirname}/../results.html`);
}

/*
Adds a result to the results window
*/
function addToWindow(url, matchedWord)
{
        win.webContents.send('url', url + '');
        win.webContents.send('matchedWord', matchedWord + '');
}

/*
Clears the input fields
 */
clearButton.addEventListener('click', function () {
    startingSite = '';
    startUrlInput.value = '';
    maxDepth = '';
    crawlNameInput.value = '';
    keywordInput.value = '';
    crawlDepthInput.value = '';
});

/*
Toggles between themes
*/
toggleSwitch.addEventListener('click', function () {
    if (toggleSwitch.checked == false) {
        changeTheme('#4b4b4b', '#ecf0f1');
    }
    else {
        changeTheme('#ffffff', '#4b4b4b');
    }
});

/*
Changes the theme
 */
function changeTheme(background, foreground) {
    console.log('Changing theme');
    document.querySelector('body').style.backgroundColor = background;
    document.querySelector('span').style.color = foreground;
    document.querySelector('h1').style.color = foreground;
    document.querySelector('h3').style.color = foreground;
    document.querySelector('#run').style.color = foreground;
    document.querySelector('#history').style.color = foreground;
    document.querySelector('#file').style.color = foreground;
    document.querySelector('#clear').style.color = foreground;
}

/*
Saves searches to the database
 */
saveButton.addEventListener('click', function () {
	//Checks for valid inputs
	if(validateInputs()) {
		//Gets values from the input fields
		var savedName = crawlNameInput.value;
		var savedStartingPages = startUrlInput.value;
		var savedKeywords = keywordInput.value;
		var savedDepth = crawlDepthInput.value;

		//Logs the inputs in the console
		console.log(savedName + savedStartingPages + savedKeywords + savedDepth);
		
		//Checks if database is present
		var exists = fs.existsSync(dbPath);
		
		//Logs if the database is present or not
		console.log("exists: " + exists);

		//Creates the connection to the database
		let db = new sqlite3.Database('dbPath', (err) => {
			if (err) {
				console.error(err.message);
			}
			console.log('Connected to the Searches database.');
		});

		//Adds the saved inputs to the database
		db.serialize(function () {

			//Creates the table if it is not present
			db.run("CREATE TABLE if not exists saved_searches(name TEXT, links LONGTEXT, keywords LONGTEXT, depth INT)");

			//Prepares the statement to prevent SQL injection and inserts values into the table
			var stmt = db.prepare("INSERT INTO saved_searches VALUES (?,?,?,?)");
			stmt.run(savedName, savedStartingPages, savedKeywords, savedDepth);
			stmt.finalize();
		});

		db.close();

		notification.innerHTML = 'Search saved.';
	}
});

/*
Opens a new menu to load searches
 */
loadButton.addEventListener('click', function () {
    window.location.href = path.resolve(__dirname, 'searchSelection.html')
});

/*
Validates the inputs to limit errors
*/
function validateInputs() {
	var inputsValid = true;
	
	//Regex for each input field
	//Allows any letters or numbers for search name
	var nameRegEx = new RegExp('[0-9a-zA-Z ]');
	
	//Allows any website in the format 'http(s)://www.(letters or numbers or '-').(letters)/(letters or numbers)
	var siteRegEx = new RegExp('(https|http):\/\/www.[a-zA-Z0-9-]+\.[^\s]{2,}(\/[a-zA-Z0-9-]+)?');
	
	//Allows comma seperated keywords made of numbers and letters
	var keyRegEx = new RegExp('[0-9a-zA-Z]+(,[0-9a-zA-Z]+)*');
	
	//Allows any number for depth
	var depthRegEx = new RegExp('^[0-9]+$');
	
	//Gets the values from the input fields
	var nameInput = crawlNameInput.value;
    var startInput = startUrlInput.value;
    var keyInput = keywordInput.value;
    var depthInput = crawlDepthInput.value;
	
	if(!nameRegEx.exec(nameInput)) {
		inputsValid = false;
		notification.innerHTML = 'Invalid name';
	}
	
	if(!siteRegEx.exec(startInput)) {
		inputsValid = false;
		notification.innerHTML += '\n Invalid url';
	}
	
	if(!keyRegEx.exec(keyInput)) {
		inputsValid = false;
		notification.innerHTML += '\n Invalid keys';
	}
	
	if(!depthRegEx.exec(depthInput)) {
		inputsValid = false;
		notification.innerHTML += '\n Invalid depth';
	}
	
	return inputsValid;
}



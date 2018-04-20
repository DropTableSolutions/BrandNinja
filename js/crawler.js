// module for making http/https requests
const request = require('request');
// module for easily parsing html
const cheerio = require('cheerio');
// module for accessing the file system
const fs = require('fs');
//module for database connection
const sqlite3 = require('sqlite3');
//module to allow direct paths to fileSize
const path = require('path');
const electron = require('electron');
const BrowserWindow = electron.remote.BrowserWindow;

var maxDepth;
var startingSite;
var keywords;
var savedName;
var savedStartingPages;
var savedKeywords;
var savedDepth;

const crawlNameInput = document.querySelector('.crawlNameInput');
const startUrlInput = document.querySelector('.startUrlInput');
const crawlDepthInput = document.querySelector('.crawlDepthInput');
const keywordInput = document.querySelector('.keywordInput');
const notification = document.querySelector('#message');
const status = document.querySelector('#status');
const runButton = document.querySelector('#run');
const clearButton = document.querySelector('#clear');
const reportBtn = document.querySelector('#reportBtn');
const dbPath = path.resolve('C:\\Users\\Ansari\\Documents\\GitHub\\BrandNinja\\Searches.db');
const saveButton = document.querySelector('#history');
const loadButton = document.querySelector('#file');
/*
recursive function for crawling
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
runs through a list of sites and tries to find any of the keywords
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
clears the output file on launch of the program
 */
function clearFile() {
    fs.truncate('testfile.txt', 0, function () {
        console.log('done')
    });
}

/*
writes a line to the output file
 */
function writeToFile(line) {
    fs.appendFile("testfile.txt", line + "\r\n", function (err) {
        if (err) {
            return console.log(err);
        }
    });
}

/*
returns a list of urls found on a parent url page
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
                        // console.log("added");
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
returns true if a page contains one of the target keywords, as well as the URL it was found at, and the target itself;
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
                    // console.log("SEARCHING: " + targets[i]);
                    if(htmlBody.includes(target[i]))
                    {
                        // console.log("MATCH: " + targets[i]  + " at: " + url);
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
    visited.clear();
    maxDepth = parseInt(crawlDepthInput.value);
    crawlName = crawlNameInput.value; //TODO: do something with the name
    startingSite = startUrlInput.value;
    keywords = keywordInput.value;
    reportBtn.style.opacity = 0;
    run();
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

function addToWindow(url, matchedWord)
{
    win.webContents.send('url', url + '');
    win.webContents.send('matchedWord', matchedWord + '');
    sendData();
}

function sendData() {
  win.webContents.send('crawlName', crawlName);
  win.webContents.send('depth', maxDepth);
}

/*
clears the input fields
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
Saves to database?
//TODO: documentation, possibly split up into multiple functions
 */

saveButton.addEventListener('click', function () {
    savedName = crawlNameInput.value;
    savedStartingPages = startUrlInput.value;
    savedKeywords = keywordInput.value;
    savedDepth = crawlDepthInput.value;

    console.log(savedName + savedStartingPages + savedKeywords + savedDepth);
    var exists = fs.existsSync(dbPath);
    console.log("exists: " + exists);

    let db = new sqlite3.Database('dbPath', (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the Searches database.');
    });

    db.serialize(function () {

        db.run("CREATE TABLE if not exists saved_searches(name TEXT, links LONGTEXT, keywords LONGTEXT, depth INT)");

        var stmt = db.prepare("INSERT INTO saved_searches VALUES (?,?,?,?)");
        stmt.run(savedName, savedStartingPages, savedKeywords, savedDepth);
        stmt.finalize();

        db.each("SELECT * FROM saved_searches", function (err, row) {
            console.log(row.name + ", " + row.links + ", " + row.keywords + ", " + row.depth);
        });
    });

    db.close();

    notification.innerHTML = 'Search saved.';
});

/*
TODO: flesh this out
*/

loadButton.addEventListener('click', function () {
    window.location.href = path.resolve(__dirname, 'searchSelection.html')
});

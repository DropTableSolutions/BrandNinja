// module for making http/https requests
const request = require('request');
// module for easily parsing html
const cheerio = require('cheerio');
// module for accessing the file system
<<<<<<< HEAD
const fs = require('fs')
// module for openning files
const opn = require('opn')
// module for database connection
const sqlite3 = require('sqlite3')
// module to allow direct paths to fileSize
const path = require('path')

// the crawl report string to be written
// to the txt file
var reportString = ''

// the keywords parsed and seperated
// an array of strings
var targets

// the urls where keywords were found
// an array of strings
var crawlReport

// name of the crawl configuration
var crawlName

// the web page the crawler will start at
var startingPage

// the keyword or we are searching for as
// text from the html input field
var keywords

// the maximum number of web pages to visit
var maxPages = 0

// the pages we have already been to
var pagesVisited = {}

// current number of pages visited
var numPagesVisited = 0

// pages that have yet to be visited
var pagesToVisit = []

//Inputs to be saved
var savedName
var savedStartingPages
var savedKeywords
var savedDepth

const crawlNameInput = document.querySelector('.crawlNameInput')
const startUrlInput = document.querySelector('.startUrlInput')
const crawlDepthInput = document.querySelector('.crawlDepthInput')
const keywordInput = document.querySelector('.keywordInput')
const notification = document.querySelector('#message')
const status = document.querySelector('#status')
const runButton = document.querySelector('#run')
const saveButton = document.querySelector('#history')
const loadButton = document.querySelector('#file')
const clearButton = document.querySelector('#clear')
const toggleSwitch = document.querySelector('.theme')
const reportBtn = document.querySelector('#reportBtn')

//Path to the searches database
const dbPath = path.resolve(__dirname, 'Searches.db');

toggleSwitch.addEventListener('click', function() {
  if (toggleSwitch.checked == false) {
      changeTheme('#4b4b4b', '#ecf0f1')
  }
  else {
      changeTheme('#ffffff', '#4b4b4b')
  }
})

// starts the crawl when the play triangle is clicked
runButton.addEventListener('click', function() {
  reportBtn.style.opacity = 0

  /* todo later: validate all inputs */

  maxPages = parseInt(crawlDepthInput.value)
  crawlName = crawlNameInput.value
  startingPage = startUrlInput.value
  keywords = keywordInput.value
  pagesToVisit.push(startingPage)
  crawl()
})

clearButton.addEventListener('click', function() {
  startUrlInput.value = ''
  crawlDepthInput.value = ''
  crawlNameInput.value = ''
  keywordInput.value = ''
})

saveButton.addEventListener('click', function() {
	savedName = crawlNameInput.value;
	savedStartingPages = startUrlInput.value;
	savedKeywords = keywordInput.value;
	savedDepth = crawlDepthInput.value;
	
	console.log(savedName + savedStartingPages + savedKeywords + savedDepth);
	
	let db = new sqlite3.Database('dbPath', sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Connected to the Searches database.');
	});
	
	db.serialize(function() {
		
		db.run("CREATE TABLE if not exists saved_searches(name TEXT, links LONGTEXT, keywords LONGTEXT, depth INT)");
		
		var stmt = db.prepare("INSERT INTO saved_searches VALUES (?,?,?,?)");
		stmt.run(savedName, savedStartingPages, savedKeywords, savedDepth);
		stmt.finalize();
		
		db.each("SELECT * FROM saved_searches", function(err, row) {
			console.log(row.name + ", " + row.links + ", " + row.keywords + ", " + row.depth);
		});
	});
	
	db.close();
	
	notification.innerHTML = 'Search saved.';
});

loadButton.addEventListener('click', function() {
	window.location.href=path.resolve(__dirname, 'searchSelection.html')
});

function crawl() {
  if (numPagesVisited >= maxPages) {
      notification.innerHTML = 'at max limit'
      status.innerHTML = 'finished'
      status.className = ''

      reportBtn.style.opacity = 1
      crawlReport = reportString.split('-break-')
      reportString = ''

      // format the reportString to be written to the txt file
      for (var i = 0; i < targets.length; i++) {
          reportString += '\n' + 'Keyword: ' + targets[i] + '\n\n'
          for (var j = 0; j < crawlReport.length; j++) {
              if (crawlReport[j].indexOf(targets[i]) != -1) {
                var s = crawlReport[j].indexOf('http')
                var e = crawlReport[j].length
                reportString += crawlReport[j].substring(s, e) + '\n'
              }
          }
      }

      // generate the report when the button is clicked
      // and then opens the file
      reportBtn.addEventListener('click', function() {
        var fileName = crawlName + 'CrawlReport.txt'
        fs.writeFile(fileName, reportString, function (err) {
            if (err) {
              notification.innerHTML = 'failed'
=======
const fs = require('fs');
// module for database connection
const sqlite3 = require('sqlite3');
//module to allow direct paths to fileSize
const path = require('path');
clearFile();

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
const toggleSwitch = document.querySelector('.theme');
const reportBtn = document.querySelector('#reportBtn');
const dbPath = path.resolve(__dirname, 'Searches.db');
const saveButton = document.querySelector('#history');
const loadButton = document.querySelector('#file');

/*
recursive function for crawling
 */

function crawl(startingSite, depth) {
    if (depth < maxDepth) {
        getLinks(startingSite, function (inSites) { //pulls all the links from a specific page and returns them as an array of strings
            for (var i = 0; i < inSites.length; i++) { //for each string we got from the page
                //console.log(inSites[i] + " , " + depth); //print out the string, and the depth it was found at
                findTarget(inSites[i], depth); //find any of the keywords we want on the page, print out if so
                crawl(inSites[i], depth + 1); //crawl all the pages on that page, and increase the depth
                status.innerHTML = "Running";
>>>>>>> Quinn
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
            writeToFile("Matched a keyword: " + target + " at: " + url + " with a depth of: " + (depth + 1));
            console.log("Matched a keyword: " + target + " at: " + url + " with a depth of: " + (depth + 1));
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
    var url = parentURL;
    var sites = [];
    if (url != undefined) {
        request(url, function (error, response, body) {
            if (!error) {
                var $ = cheerio.load(body);
                $('a').each(function (i, elem) {
                    sites.push(elem.attribs.href);
                });
            }
            callback(sites);
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
                var htmlBody = bodyText.split(' ');
                var targets = target.split(',');
                for (var i = 0; i < targets.length; i++) {
                    targets[i].trim();
                    for (var j = 0; j < htmlBody.length; j++) {
                        if (htmlBody[i] !== undefined) {
                            htmlBody[i].trim();
                            if (targets[i].localeCompare(htmlBody[j]) === 0) {
                                console.log("MATCH: " + targets[i] + " == " + htmlBody[j] + " at: " + url);
                                return callback(true, targets[i], url);
                            }
                        }
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
    maxDepth = parseInt(crawlDepthInput.value);
    crawlName = crawlNameInput.value; //TODO: do something with the name
    startingSite = startUrlInput.value;
    keywords = keywordInput.value;
    reportBtn.style.opacity = 0;
    run();
});

async function run() {
    await crawl(startingSite, 0);
    console.log("Finished");
}

/*
clears the input fields
 */
clearButton.addEventListener('click', function () {
    startingSite.value = '';
    startUrlInput.value = '';
    maxDepth.value = '';
    crawlNameInput.value = '';
    keywordInput.value = '';
});


toggleSwitch.addEventListener('click', function () {
    if (toggleSwitch.checked == false) {
        changeTheme('#4b4b4b', '#ecf0f1');
    }
    else {
        changeTheme('#ffffff', '#4b4b4b');
    }
});

/*
changes the theme
//TODO: remove this, it's not needed
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
Saves to database?
//TODO: documentation, possibly split up into multiple functions
 */
saveButton.addEventListener('click', function () {
    savedName = crawlNameInput.value;
    savedStartingPages = startUrlInput.value;
    savedKeywords = keywordInput.value;
    savedDepth = crawlDepthInput.value;

    console.log(savedName + savedStartingPages + savedKeywords + savedDepth);

    let db = new sqlite3.Database('dbPath', sqlite3.OPEN_READWRITE, (err) => {
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



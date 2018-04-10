// module for making http/https requests
const request = require('request')
// module for easily parsing html
const cheerio = require('cheerio')
// module for creating url objects in node
const URL = require('url-parse')
// module for accessing the file system
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
const dbPath = path.resolve(__dirname, 'Searches.db')

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
	savedName = crawlNameInput.value
	savedStartingPages = startUrlInput.value
	savedKeywords = keywordInput.value
	savedDepth = crawlDepthInput.value
	
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
            }
            notification.innerHTML = 'success'
            reportString = ''
            opn(fileName).then(() => {})
            reportBtn.style.opacity = 0
        })
      })

      // reset all the variables for another crawl
      numPagesVisited = 0
      targets = []
      crawlReport = []
      pagesToVisit = []
      pagesVisited = {}
      return
  }
  status.innerHTML = 'running...'
  status.className = 'statusRunning'

  // remove the first page from the pagesToVisit array so that we are
  // only searching the most relevant pages first
  var nextPage = pagesToVisit.shift()

  // if we've already visted that page, then recurse and try the next one
  // else visit the page
  if (nextPage in pagesVisited) {
      crawl()
  }
  else {
      visitPage(nextPage, crawl)
  }
}

function visitPage(url, callback) {
  pagesVisited[url] = true
  numPagesVisited++

  if (url === undefined) {
      notification.innerHTML = 'something went wrong'
      return
  }

  var startIndex = url.indexOf('.') + 1
  // the url with the http/https and www parts removed
  var modifiedUrl = url.substring(startIndex, url.length)

  // make a node request to the host server for the html
  request(url, function (error, response, html) {
    // use cheerio to retrieve the html and prepare for parsing
    $ = cheerio.load(html)

    notification.innerHTML = 'crawling page #' + numPagesVisited

    var pageReport = searchForTargets($)
    for (var i = 0; i < pageReport[0].length; i++) {
        if (pageReport[1][i] > 0) {
            reportString += pageReport[0][i] + ' ' + url + '-break-'
        }
    }

    // collect all internal links on current page
    links = $('a')
    $(links).each(function(i, link) {
        var page = $(link).attr('href')
        if (page != undefined) {
            // only add links that begin with http or https
            if (page.substring(0, 4) === 'http') {
                pagesToVisit.push(page)
            }
        }
    })
    callback()
  })
}

function searchForTargets($) {
  var bodyText = $('html > body').text().toLowerCase()
  var htmlBody = bodyText.split(' ')
  targets = keywords.split(',')
  var results = []

  for (var i = 0; i < targets.length; i++) {
      targets[i] = targets[i].trim()
      results.push(0)
  }

  for (var i = 0; i < targets.length; i++) {
      htmlBody.map(function(index) {
        var lcIndex = index.toLowerCase()
        var lcTarget = targets[i].toLowerCase()
        if (lcIndex.indexOf(lcTarget) != -1) {
            results[i]++
        }
      })
  }
  return [targets, results]
}

function changeTheme(background, foreground) {
  document.querySelector('body').style.backgroundColor = background

  document.querySelector('span').style.color = foreground
  document.querySelector('h1').style.color = foreground
  document.querySelector('h3').style.color = foreground

  document.querySelector('#run').style.color = foreground
  document.querySelector('#history').style.color = foreground
  document.querySelector('#file').style.color = foreground
  document.querySelector('#clear').style.color = foreground
}

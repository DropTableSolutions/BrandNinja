// module for making http/https requests
const request = require('request')
// module for easily parsing html
const cheerio = require('cheerio')
// module for creating url objects in node
const URL = require('url-parse')
// module for accessing the file system
const fs = require('fs')
// module for opening files in node
const opn = require('opn')

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

// all of the html elements from index.html
const crawlNameInput = document.querySelector('.crawlNameInput')
const startUrlInput = document.querySelector('.startUrlInput')
const crawlDepthInput = document.querySelector('.crawlDepthInput')
const keywordInput = document.querySelector('.keywordInput')
const notification = document.querySelector('#message')
const status = document.querySelector('#status')
const runButton = document.querySelector('#run')
const clearButton = document.querySelector('#clear')
const toggleSwitch = document.querySelector('.theme')
const reportBtn = document.querySelector('#reportBtn')

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
  // hide the generate report button if it
  // is not hidden already
  reportBtn.style.opacity = 0

  /* todo later: validate all inputs */

  // get the inputed depth as a string and parse it as an int
  maxPages = parseInt(crawlDepthInput.value)

  // get the inputed name of the crawl
  crawlName = crawlNameInput.value

  // get the inputed url starting page
  startingPage = startUrlInput.value

  // get the comma delimited keywords
  keywords = keywordInput.value

  pagesToVisit.push(startingPage)

  crawl()
})

// clear all the input fields for another search
clearButton.addEventListener('click', function() {
  startUrlInput.value = ''
  crawlDepthInput.value = ''
  crawlNameInput.value = ''
  keywordInput.value = ''
})

// most of this will be changed now since we have
// to redo our crawling algorithm
function crawl() {

  // I know this if statement is outrageously large and should
  // have been broken up into seperate functions but for the sake
  // of time I just wanted to get it done. I apologize.
  if (numPagesVisited >= maxPages) {
      notification.innerHTML = 'at max limit'
      status.innerHTML = 'finished'
      status.className = ''

      // reveal the hidden button by making its opacity 1
      reportBtn.style.opacity = 1

      // the reportString is one large string of links
      // down in the visitPage function, I inserted -break-
      // substrings after each link as a way to seperate them
      // later here. crawlReport is an array of links tokenized
      // from the reportString
      crawlReport = reportString.split('-break-')

      // after the reportString has been split up into
      // crawlReport, reset reportString
      reportString = ''


      // format the reportString to be written to the txt file
      // this block of code should probably be saved and put into
      // it own function. formatting for Windows will need to be
      // changed, along with anything else in the interactive report
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
      // and then opens the file automatically with opn
      reportBtn.addEventListener('click', function() {
        // creates the file based of the name of the crawl
        // that the user inputed
        var fileName = crawlName + 'CrawlReport.txt'
        fs.writeFile(fileName, reportString, function (err) {
            if (err) {
              notification.innerHTML = 'failed'
            }
            notification.innerHTML = 'success'
            reportString = ''

            // open the txt file
            opn(fileName).then(() => {})

            // hide the button again by setting its opacity to 0
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

  // make a node request to the host server for the html
  request(url, function (error, response, html) {
    // use cheerio to retrieve the html and prepare for parsing
    $ = cheerio.load(html)

    notification.innerHTML = 'crawling page #' + numPagesVisited

    // the 2D array returned from searchForTargets
    var pageReport = searchForTargets($)

    for (var i = 0; i < pageReport[0].length; i++) {

        // if the current index of the second row of the results
        // array is greater than 0, then add that url to the report
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

  // the full text body from the webpage stored in a string
  var bodyText = $('html > body').text().toLowerCase()

  // this is where we split up the html body text by spaces
  // the split function stores each token into an array
  // however we can just search the whole bodyText string
  // for any keywords or phrases we are looking for
  var htmlBody = bodyText.split(' ')

  // the target keywords are split up by the commas
  // inputed by the user in the keywords field
  targets = keywords.split(',')

  // the search results of each keyword
  // an array of integers
  var results = []

  // loop through all the keywords or phrases that the user'
  // inputed and remove any whitespace from the front or
  // back of the string
  for (var i = 0; i < targets.length; i++) {
      targets[i] = targets[i].trim()
      results.push(0)
  }

  // lc stands for LowerCase. everything is set
  // to LowerCase so we can search and compare
  // without worrying about if two words are the
  // same but one has upper case letters and the
  // other has lower case letters
  for (var i = 0; i < targets.length; i++) {

      htmlBody.map(function(index) {
        var lcIndex = index.toLowerCase()
        var lcTarget = targets[i].toLowerCase()

        // if the current string in the tokenized htmlBody
        // contains the current inputed keyword we are
        // searching for then increment that index in the
        // results array of integers. I know we don't care
        // how many times a keyword was found on the page,
        // I just needed a quick way to know if it was found or not
        if (lcIndex.indexOf(lcTarget) != -1) {
            results[i]++
        }
      })

  }

  // returns a 2D array with the inputed keywords
  // on top and if the keyword was found or not
  // on the bottom
  //
  // example:
  // [[thanos, avenger, solo, skywalker],
  //  [0,        1,      1,       0]]
  return [targets, results]
}


// just changes the theme to light or dark
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

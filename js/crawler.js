// import the necessary node modules

// module for making http/https requests
const request = require('request')
// module for easily parsing html
const cheerio = require('cheerio')
// module for creating url objects in node
const URL = require('url-parse')

// the web page the crawler will start at
var startingPage

// the keyword or phrase we are searching for
var targetWord

// the maximum number of web pages to visit
var maxPages = 25

// the pages we have already been to
var pagesVisited = {}

// current number of pages visited
var numPagesVisited = 0

// pages that have yet to be visited
var pagesToVisit = []

// the current page being searched
var currentPage

// create URL object
var url = new URL(startingPage);
var baseUrl = url.protocol + "//" + url.hostname;

// retrieve the <h1> element from index.html to display the current page being searched
const currentPageDisplay = document.querySelector('.currentPage')

// retrieve the <input> element for the start url from index.html
const startUrlInput = document.querySelector('.startUrlInput')

// retrieve the <input> element for the target word from index.html
const targetInput = document.querySelector('.targetInput')

// retrieve the search icon button from index.html
const searchBtn = document.querySelector('#searchBtn')

// retrieve the <div> element from index.html
// the search results will be added to this element
const resultsList = document.querySelector('.container')

// add click event listener to the search icon button
searchBtn.addEventListener('click', function() {
  clearList()
  // get the starting url that the user typed in
  startingPage = startUrlInput.value
  // get the target word that the user typed in
  targetWord = targetInput.value
  // add the starting url to the pagesToVisit array
  pagesToVisit.push(startingPage)
  // start crawling
  crawl()
})

// main crawling function
function crawl() {
  if (numPagesVisited >= maxPages) {
      // display to the user that we have reached the specified number of pages to visit
      currentPageDisplay.innerHTML = 'Reached max limit of pages to visit'
      numPagesVisited = 0
      pagesToVisit = []
      pagesVisited = {}
      return
  }

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
      currentPageDisplay.innerHTML = 'page is undefined'
      return
  }

  var startIndex = url.indexOf('.') + 1
  // the url with the http/https and www parts removed
  var modifiedUrl = url.substring(startIndex, url.length)
  // display the current page being searched
  currentPageDisplay.innerHTML = 'searching ' + modifiedUrl

  // make a node request to the host server for the html
  request(url, function (error, response, html) {
    // use cheerio to retrieve the html and prepare for parsing
    $ = cheerio.load(html)

    // integer indicating how many times the target was found on this page
    var timesFound = searchForTarget($, targetWord)

    if (timesFound > 0) {
      // dynamically create a new <div> and append to the list
      var listNode = document.createElement('div')
      listNode.innerHTML = "'" + targetWord + "'" + ' found ' + timesFound + ' times at ' + modifiedUrl + '<br><br>'
      resultsList.append(listNode)
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

function searchForTarget($, target) {
  var bodyText = $('html > body').text().toLowerCase()
  var words = bodyText.split(' ')
  var count = 0

  words.map(function(index) {
    var lcIndex = index.toLowerCase()
    var lcTarget = target.toLowerCase()
    if (lcIndex.indexOf(lcTarget) != -1) {
      count++
    }
  })
  return count
}

function clearList() {
  while (resultsList.hasChildNodes()) {
      resultsList.removeChild(resultsList.lastChild)
  }
}

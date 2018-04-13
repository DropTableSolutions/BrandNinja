// module for making http/https requests
const request = require('request');
// module for easily parsing html
const cheerio = require('cheerio');
// module for creating url objects in node
const URL = require('url-parse');
// module for accessing the file system
const fs = require('fs');
// module for opening files in node
const opn = require('opn');

console.log("running");
clearFile();
//temp;

var maxDepth;
var startingSite;
var keywords;
/*
recursive function for crawling
 */
 function crawl(startingSite, depth)
{
        if(depth < maxDepth) {
            getLinks(startingSite, function (inSites) { //pulls all the links from a specific page and returns them as an array of strings
                for (var i = 0; i < inSites.length; i++) { //for each string we got from the page
                    //console.log(inSites[i] + " , " + depth); //print out the string, and the depth it was found at
                    findTarget(inSites[i], depth); //find any of the keywords we want on the page, print out if so
                    crawl(inSites[i], depth + 1); //crawl all the pages on that page, and increase the depth
                }
            });
        }
}

/*
runs through a list of sites and tries to find any of the keywords
 */
function findTarget(site, depth)
{
        findInPage(keywords, site, function(containsATarget, target, url){
        if(containsATarget)
        {
            //TODO: PRINT TO FILE
            writeToFile("Matched a keyword: " +  target + " at: " + url +" with a depth of: " + (depth+1));
            console.log("Matched a keyword: " +  target + " at: " + url +" with a depth of: " + (depth+1));
        }
    });
}

function clearFile()
{
    fs.truncate('testfile.txt', 0, function(){console.log('done')});
}
function writeToFile(line)
{
    fs.appendFile("testfile.txt", line + "\r\n", function(err) {
        if(err) {
            return console.log(err);
        }
    });
}

/*
returns a list of urls found on a parent url page
 */
function getLinks(parentURL, callback)
{
    var url = parentURL;
    var sites = [];
    if(url != undefined)
    {
        request(url, function (error, response, body) {
            if(!error)
            {
                var $  = cheerio.load(body);
                $('a').each(function(i, elem){
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
function findInPage(target, url, callback)
{
    if(url != undefined)
    {
        request(url, function (error, response, body) {
            if(!error)
            {
                var $  = cheerio.load(body);
                var bodyText = $('html > body').text().toLowerCase();
                var htmlBody = bodyText.split(' ');
                var targets = target.split(',');
                for( var i = 0; i < targets.length; i++)
                {
                    targets[i].trim();
                    for(var j = 0; j < htmlBody.length; j++)
                    {
                        if(htmlBody[i] !== undefined)
                        {
                            htmlBody[i].trim();
                            if(targets[i].localeCompare(htmlBody[j]) === 0)
                            {
                                console.log("MATCH: " + targets[i] + " == " + htmlBody[j] + " at: " + url);
                                return callback(true, targets[i], url);
                            }
                        }
                    }
                }
            }
        });
    }
    else
    {
        return callback(false, null, url);
    }
}

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

runButton.addEventListener('click', function() {
    maxDepth = parseInt(crawlDepthInput.value);
    crawlName = crawlNameInput.value;
    startingSite = startUrlInput.value;
    keywords = keywordInput.value;
    reportBtn.style.opacity = 0;
    run();
});
async function run()
{
    await crawl(startingSite, 0);
    console.log("Finished");
}

clearButton.addEventListener('click', function() {
    startingSite.value = '';
    maxDepth.value = '';
    crawlNameInput.value = '';
    keywordInput.value = '';
});

toggleSwitch.addEventListener('click', function() {
    if (toggleSwitch.checked == false) {
        changeTheme('#4b4b4b', '#ecf0f1');
    }
    else {
        changeTheme('#ffffff', '#4b4b4b');
    }
});

function changeTheme(background, foreground) {
    console.log('Changing theme');

    document.querySelector('body').style.backgroundColor = background;

    document.querySelector('span').style.color = foreground;
    document.querySelector('h1').style.color = foreground;
    document.querySelector('h3').style.color = foreground;

    document.querySelector('#run').style.color = foreground;
    document.querySelector('#history').style.color = foreground;
    document.querySelector('#file').style.color = foreground;
    document.querySelector('#clear').style.color = foreground
}


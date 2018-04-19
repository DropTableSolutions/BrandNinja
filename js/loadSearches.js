// module for database connection
const sqlite3 = require('sqlite3');
// module to allow direct paths to fileSize
const path = require('path');
// module for accessing the file system
const fs = require('fs');

const searches = document.querySelector('#Searches');

//Path to the searches database
const dbPath = path.resolve('C:\\Users\Ansari\\Documents\\GitHub\\BrandNinja\\Searches.db');

function loadSearches() {
	
	searches.innerHTML = ("<div style=\"color:#444; border:1px solid #CCC; background:#DDD; box-shadow: 0 0 5px -1px rgba(0,0,0,0.2);" +
				"cursor:pointer; vertical-align:middle;\" onclick=\"loadSearchInfo('','','','')\">" +
				"<p style=\"text-align:center; color:Red\">" + "< Back" + "</p>" +
				"</div>");
	
	let db = new sqlite3.Database('dbPath', sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Connected to the Searches database.');
	});

	db.serialize(function() {
		db.each("SELECT * FROM saved_searches", function(err, row) {
			searches.innerHTML += ("<div style=\"color:#444; border:1px solid #CCC; background:#DDD; box-shadow: 0 0 5px -1px rgba(0,0,0,0.2);" +
				"cursor:pointer; vertical-align:middle;\" onclick=\"loadSearchInfo('" + row.name + "','" + row.links + "','" + row.keywords + "','" + row.depth + "')\">" +
				"<p style=\"text-align:center;\">" + row.name + "</p>" +
				"</div>");
		});
	});

	db.close();
};

function loadSearchInfo(searchName, searchURL, searchKeys, searchDepth) {
	window.location.href=(path.resolve(__dirname, '../index.html') + "#name=" + searchName + "&URL=" + searchURL + "&keys=" + searchKeys + "&depth=" + searchDepth);
}
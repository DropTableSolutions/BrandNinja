// module for database connection
const sqlite3 = require('sqlite3');
// module to allow direct paths to fileSize
const path = require('path');
// module for accessing the file system
const fs = require('fs');

const searches = document.querySelector('#searches');

//Path to the searches database
const dbPath = path.resolve(__dirname, 'Searches.db');

function loadSearches() {
	let db = new sqlite3.Database('dbPath', sqlite3.OPEN_READWRITE, (err) => {
		if (err) {
			console.error(err.message);
		}
		console.log('Connected to the Searches database.');
	});

	db.serialize(function() {
		db.each("SELECT * FROM saved_searches", function(err, row) {
			document.write("<p onclick=\"loadSearchInfo('" + row.name + "','" + row.links + "','" + row.keywords + "','" + row.depth + "')\">" + row.name + "</p>");
		});
	});

	db.close();
};

function loadSearchInfo(searchName, searchURL, searchKeys, searchDepth) {
	window.location.href=(path.resolve(__dirname, '../index.html') + "#name=" + searchName + "&URL=" + searchURL + "&keys=" + searchKeys + "&depth=" + searchDepth);
}
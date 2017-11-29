import mysql from 'mysql';

var db_config = {
	host: "localhost",
	user: "root",
	password: "",
	database: "lapar",
	port : "3306"
};

const connection = mysql.createConnection(db_config);

connection.connect(function(err) { 
	if(err) {    
		console.log('error when connecting to db:', err);
	}
	else {
		console.log("connection variable created ");
	}
});
connection.on('error', function(err) {
	console.log('db error', err);
	if (err.code === 'PROTOCOL_CONNECTION_LOST') {                         
	} else if (err.code === 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR') {
	} else {
		throw err;                            
	}
});

module.exports = { connection };
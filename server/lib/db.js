var mysql = require('mysql');
 var connection = mysql.createConnection({
   host:process.env.DBHOST,
   user:process.env.DBUSER,
   password:process.env.DBPASSWORD,
   database:process.env.DATABASE
 });
connection.connect(function(error){
   if(!!error){
     console.log(error);
   }else{
     console.log('Connected!:)');
   }
 });  
module.exports = connection;
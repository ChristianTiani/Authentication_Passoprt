const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const mysql = require("mysql");

// Connect to the database
require("dotenv").config()
const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

const db = mysql.createPool({
    connectionLimit: 100,
    host: DB_HOST,       //This is your localhost IP
    user: DB_USER,         // "newuser" created in Step 1(e)
    password: DB_PASSWORD,  // password for the new user
    database: DB_DATABASE,      // Database name
    port: DB_PORT             // port name, "3306" by default
 })
 
 
 db.getConnection( (err, connection)=> {
    if (err) throw (err)
    console.log ("DB connected successful: " + connection.threadId)
 })

module.exports = function(passport) {
    passport.use(
      new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
        // Match user       
        db.getConnection( async (err, connection) => {
            if (err) throw (err)
            const sqlSearch = "SELECT * FROM userschema WHERE email = ?"
            const search_query = mysql.format(sqlSearch,[email])            
            // ? will be replaced by values            

            await connection.query (search_query, async (err, result) => {
                if (err) throw (err)
                console.log("------> Search Results")
                console.log(result.length)
               
                if (result.length == 0) {
                    connection.release()
                    return done(null, false, { message: 'That email is not registered' });                 
                } 
                
                // Match password
                console.log('result from the database' + result + ' result[0] ' + result[0]);

                user={id:result[0].iduserschema,name:result[0].name,email:result[0].email,password:result[0].password};
                console.log('user: ' + user);
                
                bcrypt.compare(password, result[0].password, (err, isMatch) => {
                    if (err) throw err;
                    if (isMatch) {
                        console.log('Password match here is the user ID: ' + result[0].iduserschema)
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Password incorrect' });
                    }
                });                

            }) //end of connection.query()          

        }) //end of db.getConnection()              
      })
    );
    
    passport.serializeUser(function(user, done) {
        console.log("inside serialize");
        done(null, user.id)
    });
    
    passport.deserializeUser(function(userId, done){
        console.log('deserializeUser:  '+ userId);
        db.getConnection(async (err, connection) => {
            if (err) throw (err)
            const sqlSearch = "SELECT * FROM userschema WHERE iduserschema = ?"
            const search_query = mysql.format(sqlSearch,[userId])
            // ? will be replaced by values

            await connection.query (search_query, async (err, result) => {
                done(null, result[0]);

            }) //end of connection.query() deserializer

        }) //end of db.getConnection() deserializer
        // connection.query('SELECT * FROM users where iduserschema = ?',[userId], function(error, results) {
        //         done(null, results[0]);    
        // });
    });

  };
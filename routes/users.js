const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const mysql = require("mysql");

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


// Login Page
router.get('/login', (req, res) => res.render('login'));

// Register Page
router.get('/register', (req, res) => res.render('register'));

// Register handle
router.post('/register', (req, res) => {
    const {name, email, password, password2} = req.body;

    let errors = [];

    // Check require fields
    if(!name || !email || !password || !password2) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    // Check password match
    if(password !== password2) {
        errors.push({ msg: 'Passwords do not match' });
    }

    // Check password length
    if(password.length < 6) {
        errors.push({ msg: 'Passwords should be at least 6 characters' });
    }

    if(errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2
        });
    } else {
        // User validation passed
        //res.send('pass');        

        //const hashedPassword = await bcrypt.hash(password,10); //NOTE Need to Check how to use with bcryptjs
        // hash the password
        //const hashedPassword = bcrypt.hash(password,10); //NOTE Need to Check how to use with bcryptjs        
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(password, salt, (err, hash) => {
                if(err) throw err;
                hashedPassword = hash;

                db.getConnection( async (err, connection) => {
                    if (err) throw (err)
                    const sqlSearch = "SELECT * FROM userschema WHERE email = ?"
                    const search_query = mysql.format(sqlSearch,[email])
                    const sqlInsert = "INSERT INTO userschema VALUES (0,?,?,?)"
                    const insert_query = mysql.format(sqlInsert,[name, email, hashedPassword])
                    // ? will be replaced by values
                    // ?? will be replaced by string
                    
                    await connection.query (search_query, async (err, result) => {
               
                     if (err) throw (err)
                     console.log("------> Search Results")
                     console.log(result.length)
               
                     if (result.length != 0) {
                      connection.release()
                      errors.push({ msg: 'Email is already registered' });
                      res.render('register', {
                        errors,
                        name,
                        email,
                        password,
                        password2
                        });
                      console.log("------> User already exists")
                      res.sendStatus(409) 
                     } 
                     else {
                      console.log(insert_query)                      
                      
                    //   await connection.query (insert_query, (err, result)=> {
               
                    //   connection.release()
               
                    //   if (err) throw (err)
                    //   console.log ("--------> Created new User")
                    //   console.log(result.insertId)
                    //   res.sendStatus(201)
                    //  })
                      req.flash(
                        'success_msg',
                        'You are now registered and can log in'
                      );
                      res.redirect('/users/login')
                    }
                   }) //end of connection.query()
                }) //end of db.getConnection()
            });
        }
        )
        
        
    }
});

module.exports = router;
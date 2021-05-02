const express = require('express')
const fs = require('fs')
const path = require('path')

//var sessions = require('../../sessions')



var con = require('../../connection')
var connection = new con()

var router = express.Router()



router.post('/getPosts', (req, res) => {

    //console.log(req.body)

    var user = req.body['ID']
    var following = req.body['following']
    var start = req.body['start']
    var amount = req.body['amount']

    console.log(following.join(','))

    var query = `
        SELECT p.ID, p.user, p.date, p.description
        FROM posts AS p
        WHERE FIND_IN_SET(p.user, ?)
        ORDER BY date DESC
        LIMIT ? OFFSET ?
    `
    var complexQuery = `
        SELECT p.ID, p.user, p.date, p.description
        FROM 
        (
            SELECT * FROM posts
            ORDER BY date DESC
        ) p
        WHERE FIND_IN_SET(p.user, ?)
        ORDER BY date DESC
        LIMIT ? OFFSET ?
    `
    //ORDER BY date ASC
    /*
    var query2 = `
        SELECT p.ID, p.user, p.date, p.description, JSON_OBJECT("source", c.source, "width", c.width, "height", c.height) AS content
        FROM posts AS p
        LEFT JOIN posts_content AS c
            ON p.ID = c.post
        WHERE FIND_IN_SET(p.user, ?)
        LIMIT ? OFFSET ?
    `
    var query3 = `
        SELECT p.ID, p.user, p.date, p.description, JSON_OBJECT("source", c.source, "width", c.width, "height", c.height) AS content
        FROM posts AS p
        LEFT JOIN posts_content AS c
            ON c.post = p.ID
        WHERE FIND_IN_SET(p.user, ?)
        LIMIT ? OFFSET ?
        GROUP BY c.post
    `
    */

    connection.pool.query(complexQuery, [following.join(','), amount, start], async function (error, result){

        //console.log(result)

        if (error){

            console.log(error)
            res.sendStatus(500)

        } else {

            for (const post of result) {
                
                var query2 = `SELECT * FROM posts_content WHERE post = ?`
                
                var content = await connection.promisePool.query(query2, [post.ID])
                post.content = content[0]
                //console.log(post.content)

            }

            //console.log(result)

            res.status(200).json(result)
        }
        

    })

    /*
    SELECT u.ID, u.username, GROUP_CONCAT(f.following) as following
        FROM users AS u 
        LEFT JOIN follow AS f
            ON u.ID = f.follower
        WHERE u.username = ? and u.password = ?
    */
})

module.exports = router
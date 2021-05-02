const express = require('express')
const router = express.Router()

var Connection = require('../../connection')
var connection = new Connection()

const fs = require('fs')

const crypto = require('crypto')
var uuidv4 = require('uuid/v4');

router.get('/', async (req, res) => {

    //console.log(req.query)

    const start = parseInt(req.query.start)
    const amount = parseInt(req.query.amount)

    const users = req.query.users.split(',').map(ID => parseInt(ID))
    if(req.query.showSelf) users.push(parseInt(req.userID))

    var query = `
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

    const [posts] = await Connection.getPool().query(query, [users.join(','), amount, start])
    
    // Get content for each post
    const contentQuery = `SELECT * FROM posts_content WHERE post = ?`
    for (const post of posts) {
        
        const [content] = await Connection.getPool().query(contentQuery, [post.ID])
        post.content = content
    }
    
    res.status(200).json(posts)

})



router.post('/', async (req, res) => {

    console.log(req.body)

    var post = JSON.parse(req.body['post'])
    //var post = req.body
    console.log(post)

    console.log(req.files)


    var query = `
        INSERT INTO posts (user, date, description) VALUES (?, ?, ?); 
    `
    
    var [newPost] = await connection.promisePool.query(query, [post.user, new Date(), post.information.description])
    var postId = newPost.insertId
    console.log(newPost.insertId)

    if (!newPost.insertId) return

    for (let i = 0; i < post.content.length; i++) {
        const content = post.content[i];
        console.log(content)

        var ext = req.files[`content${i}`].mimetype.split('/')[1]

        var name = `${crypto.createHash('md5').update(i.toString()).digest('hex')}_${uuidv4()}.jpg`
        req.files[`content${i}`].mv(`../Files/Content/${name}`, function(err){console.log(err)})
        
        var insert = await connection.promisePool.query(`
            INSERT INTO posts_content (post, source, width, height)
            VALUES (?, ?, ?, ?)`, [postId, name, content.width, content.height])
    }
    
    console.log(`[${new Date().toLocaleString()}] User: ${req.user}. New post submitted`)

    res.sendStatus(200)
})

module.exports = router
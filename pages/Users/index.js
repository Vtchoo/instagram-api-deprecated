const express = require('express')

var Connection = require('../../connection')
var connection = new Connection()

const crypto = require('crypto')

const router = express.Router({ mergeParams: true })

router.get('/', async (req, res) => {

    

})

router.get('/:ID_user', async (req, res) => {

    const ID_user = req.params.ID_user

    var query = `
        SELECT 
            u.ID, 
            u.username, 
            u.profilepic, 
            (
                SELECT COUNT(p.ID) FROM posts p
                WHERE p.user = u.ID
            ) as postCount, 
            (
                SELECT COUNT(f1.ID) FROM follow f1
                WHERE f1.following = u.ID
            ) as followerCount, 
            (
                SELECT COUNT(f2.ID) FROM follow f2
                WHERE f2.follower = u.ID
            ) as followingCount
        FROM users u
        WHERE u.ID = ?
    `

    const [[user]] = await Connection.getPool().query(query, [ID_user])

    console.log(user)

    res.status(200).json(user)

})

router.post('/', async (req, res) => {

    var user = req.body.user
    user.password = crypto.createHash('sha256').update(user.password).digest('hex')

    const [usernameCheck] = await connection.promisePool.query(`SELECT COUNT(username) AS count FROM users WHERE username = ?`, [user.username])
    const [emailCheck] = await connection.promisePool.query(`SELECT COUNT(email) AS count FROM users WHERE email = ?`, [user.email])
    
    if( usernameCheck[0].count > 0 || emailCheck[0].count > 0 ){
        
        res.status(403)
        res.json({ message: 'An user with these credentials already exists. Check email or username again' })
    
    } else {

        const [result] = await connection.promisePool.query(`
            INSERT INTO users (username, password, email)
            VALUES (?, ?, ?)
        `, [user.username, user.password, user.email])

        res.status(200)
        res.json(result)
        
    }

})


router.get('/verify/username/:username', async (req, res) => {

    //console.log(req.params.username)
    const username = req.params.username

    var [count] = await connection.promisePool.query(`SELECT COUNT(username) AS count FROM users WHERE username = ?`, [username])
    //console.log(count)

    res.status(200).json(count[0].count > 0)
})

router.get('/verify/email/:email', async (req, res) => {

    //console.log(req.params.email)
    const email = req.params.email

    var [count] = await connection.promisePool.query(`SELECT COUNT(email) AS count FROM users WHERE email = ?`, [email])
    //console.log(count)

    res.status(200).json(count[0].count > 0)
})

router.get('/:username', async (req, res) => {

})

module.exports = router
const Connection = require('../connection')
const uuidv4 = require('uuid/v4');

class Sessions {

    constructor() {
        
    }

    static async add(ID, user) {
        
        const startDate = new Date()
        const expireDate = new Date()
        expireDate.setHours(startDate.getHours() + 3)
        
        const session = {
            ID_user: ID,
            user: user,
            startDate,
            expireDate,
            token: uuidv4(),
        }

        const query = `
            INSERT INTO sessions (${Object.keys(session)})
            VALUES ?
        `

        const [result] = await Connection.getPool().query(query, [[Object.values(session)]])
        //console.log(result)

        return session.token
    }

    static verify = async (req, res, next)=>{
        
        const token = req.headers.token

        const query = `
            SELECT *
            FROM sessions
            WHERE token = ? AND expireDate > ?
        `

        const [verify] = await Connection.getPool().query(query, [token, new Date()])
        
        if(verify.length > 0){
            req.user = verify[0].user
            req.userID = verify[0].ID_user
            next()
        } else {
            res.status(403)
            res.end("Unauthorized")
        }
    }

    static async clearExpired() {
        
        const query = `
            DELETE
            FROM sessions
            WHERE expireDate < ?
        `

        const [result] = await Connection.getPool().query(query, [new Date()])

        if(result.affectedRows > 0)
            console.log(`[Server] ${result.affectedRows} expired sessions eliminated`)

    }
}

module.exports = Sessions

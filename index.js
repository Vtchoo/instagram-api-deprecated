var express = require('express');

//var mysql = require('mysql');
var mysql = require("mysql2")
var bodyParser = require('body-parser')
var fileUpload = require('express-fileupload')

var pbkdf2 = require('pbkdf2');
var crypto = require('crypto');

//var sessionManager = require('./pages/Sessions')
//var Sessions = new sessionManager()
var Sessions = require('./sessions')

// Conexão com o MySQL
var conn = require('./connection')
var connection = new conn()

// Leitor de arquivos
const fs = require('fs')

// RESTful API
var app = express();
var publicDir = (__dirname + '/public/');
app.use('/public', express.static(publicDir));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(fileUpload())

var api = express.Router()

api.post("/login", async (req, res, next) => {
    
    console.log(publicDir)

    var login = req.body["user"];
    var password = crypto.createHash('sha256').update(req.body["password"]).digest('hex');
    //console.log([login, password])

    const query = `
        SELECT u.ID, u.username, GROUP_CONCAT(f.following) as following
        FROM users AS u 
        LEFT JOIN follow AS f
            ON u.ID = f.follower
        WHERE u.username = ? and u.password = ?`

    const query2 = `
        SELECT u.ID, u.username, JSON_ARRAY(f.following) as following
        FROM users AS u 
        LEFT JOIN follow AS f 
            ON u.ID = f.follower
        WHERE u.username = ? and u.password = ?
        `

    const query3 = `
        SELECT ID, username
        FROM users
        WHERE username = ? and password = ?
    `

    var [users] = await connection.promisePool.query(query3, [login, password])

    if (users.length != 0){

        var user = users[0]

        const [following] = await connection.promisePool.query(`SELECT following FROM follow WHERE follower = ?`, [user.ID])
        user.following = following.map(f => f.following)

        const token = await Sessions.add(user.ID, user.username)
        res.setHeader("token", token)

        //console.log(user)

        res.status(200).json(user)

    } else {

        console.log(`[${new Date().toLocaleString()}] Ação: Tentativa de login. Informações: -Usuário utilizado: ${req.body["user"]}`)
        res.sendStatus(403); // Forbidden (para login incorreto)
    }

    // connection.pool.query(query3, [login, password], async function(error, result){

    //     console.log(result)

    //     connection.pool.on("error", function(err){
    //         console.log("erro: " + err);
    //     });
        
    //     //if (result && result.length){
    //     if (result.length == 1 && result[0].ID != null){
    //         console.log(`[${new Date().toLocaleString()}] Usuário: ${result[0].username}. Ação: Login bem sucedido`)

    //         var token = Sessions.add(result[0].ID, result[0].username)

    //         res.setHeader("token", token);

    //         // Transform results
    //         result[0].following = result[0].following.split(',').map(str => parseInt(str))
    //         console.log(result[0])
            
    //         res.end(JSON.stringify(result[0]))

    //     } else {

    //         console.log(error)
    //         console.log(`[${new Date().toLocaleString()}] Ação: Tentativa de login. Informações: -Usuário utilizado: ${req.body["user"]}`)
    //         res.sendStatus(403); // Forbidden (para login incorreto)

    //     }
    // })
})



api.get("/", (req, res)=>{
    console.log(`[${new Date().toLocaleString()}] Endereço conectado: ${req.connection.remoteAddress}:${req.connection.remotePort}`)
    res.end("voce foi rakeado com sucesso");
})

const users = require('./pages/Users')
api.use('/users', users)

api.use(Sessions.verify)

/*
 * Pages
 */

const home = require('./pages/Home')
api.use('/home', home)

const newPost = require('./pages/Posts')
api.use('/posts', newPost)


/*
 * Content provider
 */

const contentRouter = express.Router({ mergeParams: true })

contentRouter.get('/:name', async (req, res) => {

    var img = req.params.name
    console.log(img)

    if ( img.includes('/') ) {
        res.sendStatus(403)
    }

    var options = {
        //root: path.join(__dirname, 'public'),
        root: `${__dirname}/..`
    }

    fs.access(`../Files/Content/${img}`, fs.constants.F_OK, (error) =>{
        
        if(error){
            console.log(`[${new Date().toLocaleString()}] Usuário: ${req.user}. Erro: imagem não encontrada. (${img})`)
            res.sendStatus(404)
        } else {
            console.log(`[${new Date().toLocaleString()}] Usuário: ${req.user}. Ação: Carregar imagem (${img})`)
            res.status(200)
            res.setHeader('name', img)
            res.sendFile(`./Files/Content/${img}`, options)
            //res.download(`./files/diarios/${img}`, img, options)
        }
    })
})

api.use('/getcontent', contentRouter)

app.use('/api', api)

// Ligar servidor
app.listen(3000, ()=>{
    console.log("Servidor online. Porta: 3000");
})



// Apertar CTRL + C para desligar o servidor
process.on( 'SIGINT', function() {
    console.log( "Desligando servidor com comando SIGINT (Ctrl-C)" );
    // Inserir outros possíveis procedimentos de finalização do servidor aqui
    process.exit();
})
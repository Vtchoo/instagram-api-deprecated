var mysql = require('mysql2')

class Connection{

    static con = new Connection()

    constructor(){ // Se dev for verdadeiro, usar a database l7dev para testes
        
        var config = {
            connectionLimit: 100,
            //host: 'localhost',
            host: "192.168.0.15",
            port: 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME,
            multipleStatements: true,
        }

        this.pool = mysql.createPool(config)
        this.promisePool = this.pool.promise();
    }

    static getConnection = () => this.con
    static getPool = () => this.con.promisePool
}

module.exports = Connection
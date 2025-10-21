const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false, // true nếu dùng Azure
    trustServerCertificate: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

const getConnection = async () => {
  try {
    if (pool) {
      return pool;
    }
    
    pool = await sql.connect(config);
    console.log('✅ Kết nối SQL Server thành công!');
    return pool;
  } catch (error) {
    console.error('❌ Lỗi kết nối SQL Server:', error);
    throw error;
  }
};

const query = async (queryString, params = {}) => {
  try {
    const pool = await getConnection();
    const request = pool.request();
    
    // Add parameters
    Object.keys(params).forEach(key => {
      request.input(key, params[key]);
    });
    
    const result = await request.query(queryString);
    return result;
  } catch (error) {
    console.error('❌ Lỗi thực thi query:', error);
    throw error;
  }
};

module.exports = {
  sql,
  getConnection,
  query
};

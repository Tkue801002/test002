require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

// 加入中間件
app.use(cors());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(helmet());
app.use(compression());

// 設定資料庫連線
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// 測試資料庫連線
connection.connect(error => {
  if (error) {
    console.error('資料庫連線失敗:', error);
    return;
  }
  console.log('成功連接到資料庫！');
});

// Express 設定
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

// 顯示所有留言
app.get('/', (req, res) => {
  connection.query('SELECT * FROM messages ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('查詢錯誤:', err);
      return res.status(500).send('資料庫錯誤');
    }
    res.render('index', { messages: results });
  });
});

// 新增留言
app.post('/messages', (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).send('內容不能為空');
  }
  
  connection.query('INSERT INTO messages (content) VALUES (?)', [content], (err) => {
    if (err) {
      console.error('新增留言錯誤:', err);
      return res.status(500).send('資料庫錯誤');
    }
    res.redirect('/');
  });
});

// 刪除留言
app.post('/messages/delete/:id', (req, res) => {
  const { id } = req.params;
  if (!id || isNaN(id)) {
    return res.status(400).send('無效的ID');
  }

  connection.query('DELETE FROM messages WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('刪除留言錯誤:', err);
      return res.status(500).send('資料庫錯誤');
    }
    res.redirect('/');
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('應用程式錯誤:', err);
  res.status(500).send('伺服器發生錯誤');
});

// 啟動伺服器
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`伺服器運行在 port ${PORT}`);
});
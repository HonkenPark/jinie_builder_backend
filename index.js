const path = require('path');
const fs = require('fs');
const cron = require('node-cron');
const { exec } = require('child_process');

const express = require('express');
const cors = require('cors');
const app = express();

let corsOptions = {
  origin: '*',
  credential: true
}

const { spawn } = require('child_process');

function runPythonFile(fileName, params) {
  return new Promise((resolve, reject) => {
    const process = spawn('python', [fileName].concat(params), {
      env: { PYTHONIOENCODING: 'utf-8' }
    });

    let result = '';
    process.stdout.on('data', (data) => {
      result += data.toString();
    });

    process.stderr.on('data', (err) => {
      reject(err.toString());
    });

    process.on('close', (code) => {
      if (code !== 0) {
        reject(`Failed with code ${code}`);
      }
      resolve(result);
    });
  });
}

app.use('/images', express.static(__dirname + '/images'));

app.get('/', function(req, res) {
  res.set({'access-control-allow-origin':'*'});
  res.send('<html>\
  <head>\
      <title>MZLP</title>\
      <style>\
          body {\
              margin: 0;\
              padding: 0;\
              background-\color: #3F3F3F;\
              display: flex;\
              justify-content: center;\
              align-items: center;\
              height: 100vh;\
              font-family: Arial, sans-serif;\
          }\
          \
          .content {\
              text-align: center;\
              color: #fff; /* 흰색 텍스트 색상 */\
          }\
          \
          .image {\
              max-width: 300px;\
              margin-bottom: 20px;\
          }\
      </style>\
  </head>\
  <body>\
      <div class="content">\
          <img class="image" src="/images/group_logo.png" alt="MZLP 로고">\
          <h1>PD R&D Backend Server Page</h1>\
          <p>안녕하세요! MZLP의 백엔드 페이지입니다. (임시)</p>\
      </div>\
  </body>\
  </html>');
})

app.use(express.json());

app.post('/login', async(req, res) => {
  try {
    let user_id = req.body.user_id;
    let user_pw = req.body.user_pw;
    const data = JSON.parse(fs.readFileSync('./json/lpmembers.json'));

    let userData;
    for (const member of data.LP_Members) {
      if (Object.keys(member)[0] === user_id) {
        userData = member;
        break;
      }
    }
    if (userData) {
      if (userData[user_id]['passwd'] == user_pw) {
        res.send(userData);
      }
      else {
        res.status(403).send('패스워드가 일치하지 않습니다.');
      }
    }
    else {
      res.status(404).send('ID가 DB에 존재하지 않습니다.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
})

app.post('/update', async(req, res) => {
  try {
    let user_info = req.body;

    const data = JSON.parse(fs.readFileSync('./json/lpmembers.json'));

    let userData;
    for (const member of data.LP_Members) {
      if (Object.keys(member)[0] === user_info.id) {
        userData = member;
        break;
      }
    }
    if (userData) {
      userData[user_info.id] = { ...userData[user_info.id], ...user_info };
      fs.writeFileSync('./json/lpmembers.json', JSON.stringify(data));
      // res.send(userData);
    }
    else {
      res.status(404).send('ID가 DB에 존재하지 않습니다.');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
})

app.use(cors(corsOptions));
app.listen(30001);

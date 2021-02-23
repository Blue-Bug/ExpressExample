//Express 기본 모듈
const express = require('express');
const http = require('http');
const path = require('path');

//사용할 미들웨어 모듈
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const static = require('serve-static');

//오류 핸들러 모듈
//const errorHandler = require('errorhandler');
const expressErrorHandler = require('express-error-handler');

//Express 객체 생성
const app = express();

const config = require('./config');

//포트 설정
app.set('port', process.env.PORT || config.server_port);

//body-parser 사용 application/x-www-form-urlencoded, json 파싱
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//public 폴더를 static으로 오픈
app.use('/public', static(path.join(__dirname, 'public')));

//cookie-parser 사용
app.use(cookieParser());

//세션 사용 설정
app.use(expressSession({
  secret: 'my key',
  resave: true,
  saveUninitialized: true
}));

//데이터베이스 모듈
const database = require('./database/database');

const route_loader = require('./routes/route_loader');
const router = express.Router();

//라우팅 정보를 읽어 들여 라우팅 설정
route_loader.init(app, router, config);

//404 오류 페이지 처리
const errorHandler = expressErrorHandler({
  static: {
    '404': './public/404.html'
  }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

http.createServer(app).listen(app.get('port'), function () {
  console.log('서버가 시작되었습니다. 포트 : ' + app.get('port'));

  //서버 시작 후 데이터베이스 연결
  database.init(app,config);
});
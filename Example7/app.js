//Express 기본 모듈
const express = require('express');
const http = require('http');
const path = require('path');

//사용할 미들웨어 모듈
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const static = require('serve-static');

//오류 핸들러 모듈
//const errorHandler = require('errorhandler');
const expressErrorHandler = require('express-error-handler');

//Express 객체 생성
const app = express();

//db 정보, 서버 포트, 라우팅 정보 불러오기
const config = require('./config');

//passport 모듈 사용
const passport = require('passport');
const flash = require('connect-flash');


//포트 설정
app.set('port', process.env.PORT || config.server_port);

//application/x-www-form-urlencoded, json 파싱
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//public 폴더를 static으로 오픈
app.use('/public', static(path.join(__dirname, 'public')));

//뷰 엔진 설정
app.set('views',__dirname + '/views');
app.set('view engine','ejs');
console.log('뷰 엔진이 ejs로 설정되었습니다.');

//cookie-parser 사용
app.use(cookieParser());

//세션 사용 설정
app.use(expressSession({
  secret: 'keyborad cat',
  resave: true,
  saveUninitialized: true
}));

//passport 설정 & 사용
const configPassport = require('./config/passport');
configPassport(app,passport);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//데이터베이스 모듈
const database = require('./database/database');

const route_loader = require('./routes/route_loader');
const router = express.Router();

//라우팅 정보를 읽어 들여 라우팅 설정
route_loader.init(app, router, config);

//패스포트 관련 함수 라우팅
const userPassport = require('./routes/user_passport');
userPassport(app,passport);

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
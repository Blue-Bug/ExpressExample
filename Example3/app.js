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

//포트 설정
app.set('port', process.env.PORT || 3000);

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

//라우터 객체 참조
const router = express.Router();

router.route('/process/login').post(function (req, res) {
    console.log('/process/login 호출됨');
});

//라우터 객체 등록
app.use('/', router);


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
});
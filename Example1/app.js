const express = require('express');
const http = require('http');
const static = require('serve-static');
const bodyParser = require('body-parser');
const path = require('path');
const router = express.Router();
const expressErrorHandler = require('express-error-handler');

const app = express();


//Body 영역 요청 파라미터 파싱
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

//public 폴더 파일을 서버의 루트 패스로 접근 (요청패스, 특정폴더)
app.use('/', static(path.join(__dirname, 'public')));

//라우터 미들웨어에 요청패스 등록
router.route('/process/login/:name').post(function (req, res) {
    let paramId = req.body.id || req.query.id;
    let paramPassword = req.body.password || req.query.password;
    let paramName = req.params.name;//URL 파라미터 (토큰)

    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
    res.write('<div><p>' + paramId + '</p></div>');
    res.write('<div><p>' + paramPassword + '</p></div>');
    res.write('<div><p>' + paramName + '</p></div>');
    res.write("<br><a href='/login.html'>돌아가기</a>");
    res.end();
});

router.route('/process/users/:id').get(function(req,res){
    //사용자 리스트 중에서 특정 사용자 정보를 id값으로 조회할때 편리
    let paramId = req.params.id;

    res.writeHead('200', { 'Content-Type': 'text/html; charset=utf8' });
    res.write('<div><p>' + paramId + '</p></div>');
    res.end();
});

//라우터 객체를 app에 등록
app.use('/', router);

//라우터 처리 끝난 후 오류 페이지 처리
const errorHandler = expressErrorHandler({
    static: {
        '404': './public/404.html'
    }
});

app.use(expressErrorHandler.httpError(404));
app.use(errorHandler);

//3000번 포트 혹은 process.env 객체에 정의된 속성 값(환경변수)으로 서버 포트 설정
app.set('port', process.env.PORT || 3000);

http.createServer(app).listen(app.get('port'), function () {
    console.log('익스프레스 서버 시작 : ' + app.get('port'));
});
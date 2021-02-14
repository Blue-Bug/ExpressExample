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

//mongoDB 모듈 사용
const MongoClient = require('mongodb').MongoClient;

//데이터베이스 객체를 위한 변수 선언
let database;

//데이터베이스에 연결
function connectDB() {
    //데이터베이스 연결 정보
    let databaseUrl = 'mongodb://localhost:27017';

    //데이터베이스 연결
    MongoClient.connect(databaseUrl, function (err, db) {
        if (err) throw err;

        console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl);

        //database 변수에 할당
        //mongoDB 3.0 버전 이상부터 데이터베이스 명을 명시해야 한다. => db.db('local');
        //이전 버전은 databaseUrl에 사용할 데이터베이스 명을 명시한다. => databaseUrl = 'mongodb://localhost:27017/local'; database = db;
        database = db.db('local');
    });
}

const authUser = (database, id, password, callback) => {
    console.log('authUser 호출됨');

    //users 컬렉션 참조
    const users = database.collection('users');

    //아이디,비밀번호를 사용하여 검색
    users.find({ 'id': id, 'password': password }).toArray(function (err, docs) {
        //조회된 문서 객체를 toArray()메소드를 사용해 배열 객체로 변환
        if (err) {
            callback(err, null);
            return;
        }

        //배열 객체로 변환된 결과를 콜백 함수로 전달
        if (docs.length > 0) {
            console.log('아이디 [%s], 비밀번호 [%s]가 일치하는 사용자 찾음.', id, password);
            callback(null, docs);
        }
        else {
            console.log('일치하는 사용자를 찾지 못함.');
            callback(null, null);
        }
    });
}

const addUser = (database, id,password,name,callback) =>{
    console.log('addUser 호출됨 : '+ id + ', ' + password + ', ' + name);

    //users 컬렉션 참조
    const users = database.collection('users');

    //id, password, name을 사용하여 사용자 추가
    users.insertMany([{'id':id, 'password':password, 'name':name}],function(err,result){
        if(err){
            callback(err, null);
            return;
        }

        if(result.insertedCount > 0){
            console.log('사용자 레코드 추가됨 : '+ result.insertedCount);
        }
        else{
            console.log('추가된 레코드 없음.');
        }
        callback(null,result);
    });
}


//라우터 객체 참조
const router = express.Router();

router.route('/process/login').post(function (req, res) {
    console.log('/process/login 호출됨');

    //파라미터 확인
    let paramId = req.body.id;
    let paramPassword = req.body.password;

    //데이터베이스 연결 확인
    if(database){
        //로그인 처리 요청
        authUser(database,paramId,paramPassword,function(err,docs){
            if(err) throw err;

            //사용자가 조회되면 docs 객체의 첫번째 배열요소 참조
            if(docs){
                console.dir(docs);
                let username = docs[0].name;
                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h1>로그인 성공</h1>');
                res.write('<div><p>사용자 아이디 : '+paramId+'</p></div>');
                res.write('<div><p>사용자 이름 : '+username+'</p></div>');
                res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
                res.end();
            }
        });
    }
    else{
        res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>')
        res.end();
    }
});

router.route('/process/adduser').post(function(req,res){
    console.log('/process/adduser 호출됨.');

    let paramId = req.body.id || req.query.id;
    let paramPassword = req.body.password || req.query.password;
    let paramName = req.body.name || req.query.name;

    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName);

    //데이터베이스 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
    if(database){
        addUser(database,paramId,paramPassword,paramName,function(err,result){
            if(err) throw err;

            //결과 객체 확인하여 추가된 데이터가 있으면 성공 응답 전송
            if(result && result.insertedCount > 0){
                console.dir(result);

                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 추가 성공</h2>');
                res.end();
            }
            else{//없을 경우 실패 응답
                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 추가 실패</h2>');
                res.end();
            }
        });
    }
    else{
        res.writeHead('200', {'Content-Type':'text/html;charset=utf8'});
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }
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

    //서버 시작 후 데이터베이스 연결
    connectDB();
});
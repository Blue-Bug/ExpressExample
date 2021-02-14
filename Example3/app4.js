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

//crypto 암호화 모듈
const crypto = require('crypto');

//mongoose 모듈 사용
const mongoose = require('mongoose');

//데이터베이스 객체를 위한 변수 선언
let database;

//데이터베이스 스키마 객체
let UserSchema;

//데이터베이스 모델 객체
let UserModel;

//데이터베이스에 연결
function connectDB() {
    //데이터베이스 연결 정보
    let databaseUrl = 'mongodb://localhost:27017/local';

    //데이터베이스 연결
    console.log('데이터베이스 연결을 시도합니다.');
    //Node.js의 native Promise 사용
    mongoose.Promise = global.Promise;

    //Warning 메시지 제거
    mongoose.set('useCreateIndex', true);
    mongoose.connect(databaseUrl, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => console.log('데이터베이스에 연결되었습니다. : ' + databaseUrl))
        .catch(e => console.error(e));
    database = mongoose.connection;

    database.on('error', console.error.bind(console, 'mongoose connection error.'));
    database.on('open', function () {
        //데이터베이스가 연결되었을 때 이벤트 발생

        //스키마 정의
        createUserSchema();

        console.log('UserSchema 정의함.');

        //스키마에 static 메소드 추가, 모델 객체에서 사용가능(모델 인스턴스에서 사용하려면 method()로 정의)
        //ID로 조회, 전부 조회
        UserSchema.static('findById', function (id, callback) {
            return this.find({ id: id }, callback);
        });

        UserSchema.static('findAll',function(callback){
            return this.find({},callback);
        });

        //UserSchema로 모델 정의(model메소드와 Model메소드의 파라미터가 다르니 주의)
        //users2 컬렉션과 매칭
        UserModel = mongoose.model('users2', UserSchema);

        console.log('UserModel 정의함.');
    });

    database.on('disconnected', function () {
        //데이터베이스 연결이 끊어졌을때 이벤트 발생
        console.log('연결이 끊어졌습니다. 3초 후 다시 연결합니다.');
        setInterval(connectDB, 3000);
    })
}

//user 스키마 및 모델 객체생성
function createUserSchema(){
    //스키마 정의
    UserSchema = mongoose.Schema({
        //unique 속성을 사용하면 자동으로 index 생성
        //password대신 암호화 된 hashed_password 사용, 암호화 키값인 salt 사용
        id: { type: String, required: true, unique: true, 'default':' ' },
        hashed_password:{type:String, required:true,'default':' '},
        salt : {type:String, required:true},
        name: { type: String, index: 'hashed', 'default':' ' },
        age: { type: Number, 'default': -1 },
        created_at: { type: Date, index: { unique: false }, 'default': Date.now },
        updated_at: { type: Date, index: { unique: false }, 'default': Date.now }
    });

    //password를 virtual 메소드로 정의 : MongoDB에 저장되지 않는 속성
    UserSchema.virtual('password')
    .set(function(password){
        this._password = password;
        this.salt = this.makeSalt();
        this.hashed_password = this.encryptPassword(password);
        console.log('virtual password 호출됨. : '+this.hashed_password);
    })
    .get(function(){return this._password});

    //모델 인스턴스에서 사용할 수 메소드 추가
    //비밀번호와 salt값을 전달받은 후 sha256으로 단방향 암호화하는 메소드
    UserSchema.method('encryptPassword',function(plainText,inSalt){
        if(inSalt){
            return crypto.createHmac('sha256',inSalt).update(plainText).digest('hex');
        }
        else{
            return crypto.createHmac('sha256',this.salt).update(plainText).digest('hex');
        }
    });

    //salt값 생성 메소드
    UserSchema.method('makeSalt',function(){
        return Math.round((new Date().valueOf()*Math.random())) + '';
    });

    //인증 메소드
    UserSchema.method('authenticate',function(plainText,inSalt,hashed_password){
        if(inSalt){
            console.log('authenticate 호출됨. : %s -> %s : %s',plainText,
            this.encryptPassword(plainText,inSalt), hashed_password);
            return this.encryptPassword(plainText,inSalt) == hashed_password;
        }
        else{
            console.log('authenticate 호출됨. : %s -> %s : %s',plainText,
            this.encryptPassword(plainText), hashed_password);
            return this.encryptPassword(plainText) == hashed_password;
        }
    });

    //필수 속성에 대한 유효성 확인
    UserSchema.path('id').validate(function(id){
        return id.length;
    }, 'id 칼럼 값이 없습니다.');

    UserSchema.path('name').validate(function(name){
        return name.length;
    },'name 칼럼 값이 없습니다.');
}

//사용자 인증 함수: 아이디로 먼저 찾고 비밀번호를 그다음에 비교
const authUser = (id, password, callback) => {
    console.log('authUser 호출됨');

    //1. 아이디로 검색
    UserModel.findById(id,function (err, results) {
        if (err) {
            callback(err, null);
            return;
        }

        console.log('아이디 [%s]로 사용자 검색 결과', id);
        console.dir(results);

        if (results.length > 0) {
            console.log('아이디와 일치하는 사용자 찾음.');
            
            //2. 비밀번호 확인
            let user = new UserModel({id:id});
            let authenticated = user.authenticate(password,results[0]._doc.salt,
                results[0]._doc.hashed_password);

            if(authenticated){
                console.log('비밀번호 일치함.');
                callback(null,results);
            }
            else{
                console.log('비밀번호 일치하지 않음.');
                callback(null,null);
            }
        }
        else {
            console.log('아이디와 일치하는 사용자를 찾지 못함.');
            callback(null, null);
        }
    });
}

//사용자 추가 함수
const addUser = (id, password, name, callback) => {
    console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + name);

    //UserModel의 인스턴스 생성
    let user = new UserModel({ 'id': id, 'password': password, 'name': name });

    //save메소드로 저장
    user.save(function (err) {
        if (err) {
            callback(err, null);
            return;
        }
        console.log('사용자 데이터 추가함.');
        callback(null, user);
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
    if (database) {
        //로그인 처리 요청
        authUser(paramId, paramPassword, function (err, docs) {
            if (err) throw err;

            //사용자가 조회되면 docs 객체의 첫번째 배열요소 참조
            if (docs) {
                console.dir(docs);
                let username = docs[0].name;
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h1>로그인 성공</h1>');
                res.write('<div><p>사용자 아이디 : ' + paramId + '</p></div>');
                res.write('<div><p>사용자 이름 : ' + username + '</p></div>');
                res.write("<br><br><a href='/public/login.html'>다시 로그인하기</a>");
                res.end();
            }
        });
    }
    else {
        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.write('<div><p>데이터베이스에 연결하지 못했습니다.</p></div>')
        res.end();
    }
});

router.route('/process/adduser').post(function (req, res) {
    console.log('/process/adduser 호출됨.');

    let paramId = req.body.id || req.query.id;
    let paramPassword = req.body.password || req.query.password;
    let paramName = req.body.name || req.query.name;

    console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName);

    //데이터베이스 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
    if (database) {
        addUser(paramId, paramPassword, paramName, function (err, result) {
            if (err) {
                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>사용자 추가 실패</h2>');
                res.end();
                throw err;
            }
            //오류가 없다면 성공 응답 전송
            else {
                console.dir(result._doc);

                res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
                res.write('<h2>사용자 추가 성공</h2>');
                res.end();
            }
        });
    }
    else {
        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h2>데이터베이스 연결 실패</h2>');
        res.end();
    }
});

router.route('/process/listuser').post(function(req,res){
    console.log('/process/listuser 호출됨.');

    //데이터베이스 객체가 초기화된 경우, 모델 객체의 findAll 메소드 호출
    if(database){
        //모든 사용자 검색
        UserModel.findAll(function(err,results){
            //오류가 발생하면 클라이언트로 전송
            if(err){
                console.log('사용자 리스트 조회 중 오류 발생 : ' + err.stack);

                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 리스트 조회 중 오류 발생</h2>');
                res.write('<p>'+ err.stack + '</p>');
                res.end();

                return;
            }

            //결과 객체가 있다면 리스트를 전송
            if(results){
                console.dir(results);

                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 리스트</h2>');
                res.write('<div><ul>');

                for(let i = 0; i <results.length; i++){
                    let curId = results[i]._doc.id;
                    let curName = results[i]._doc.name;
                    res.write('    <li>#'+ i +' : ' + curId + ', ' + curName + '</li>');
                }

                res.write('</ul></div>');
                res.end();
            }
            else{
                res.writeHead('200',{'Content-Type':'text/html;charset=utf8'});
                res.write('<h2>사용자 리스트 조회 실패</h2>');
                res.end();
            }
        });
    }
    else{
        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
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
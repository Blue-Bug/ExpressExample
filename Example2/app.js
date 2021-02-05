const express = require('express');
const http = require('http');
const static = require('serve-static');
const bodyParser = require('body-parser');
const path = require('path');
const multer = require('multer');
const expressErrorHandler = require('express-error-handler');
const fs = require('fs');
const cors = require('cors');

const app = express();

//=============== body-parser -> multer -> router 순으로 사용해야 오류 없음

//Body 영역 요청 파라미터 파싱
app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

//각 폴더 파일을 요청 패스로 접근 (요청패스, 특정폴더)
app.use('/public', static(path.join(__dirname, 'public')));
app.use('/uploads', static(path.join(__dirname, 'uploads')));

//cors(다중 서버 접속) 지원
app.use(cors());

//multer 미들웨어 사용 
const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, 'uploads')
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname + Date.now())
    }
});

//파일 제한 - 10개 , 1Gbyte
const upload = multer({
    storage: storage,
    limits: {
        files: 10,
        fileSize: 1024 * 1024 * 1024
    }
});

const router = express.Router();

router.route('/process/photo').post(upload.array('photo', 1), function (req, res) {
    console.log('/process/photo 실행');

    try {
        let files = req.files;

        console.dir('#=======업로드된 첫번째 파일 정보');
        console.dir(req.files[0]);
        console.dir('#=======#');

        // 현재의 파일 정보를 저장할 변수 선언
        let originalname = '',
            filename = '',
            mimetype = '',
            size = 0;

        if (Array.isArray(files)) { // 배열에 들어가 있는 경우
            console.log("배열에 들어있는 파일의 수 : %d", files.length);

            //클라이언트에 응답 전송
            res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });

            files.forEach((index) => {
                originalname = index.originalname;
                filename = index.filename;
                mimetype = index.mimetype;
                size = index.size;

                console.log('현재 파일 정보 : ' + originalname + ', ' + filename + ', '
                    + mimetype + ', ' + size);

                res.write('<h3>파일 업로드 성공</h3>');
                res.write('<hr/>');
                res.write('<p>원본 파일 이름 : ' + originalname + ' -> 저장 파일명 : ' + filename + '</p>');
                res.write('<p>MIME TYPE : ' + mimetype + '</p>');
                res.write('<p>파일 크기 : ' + size + '</p><br>');
            });
        } else { // 배열에 들어가 있지 않은 경우
            console.log("파일 수 : 1");

            originalname = files.originalname;
            filename = files.filename;
            mimetype = files.mimetype;
            size = files.size;
        }

        res.end();
        
    } catch (err) {
        //에러 출력
        console.dir(err.stack);
    }
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
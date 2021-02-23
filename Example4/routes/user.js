let database;
let UserSchema;
let UserModel;

const init = function(db,schema,model){
  console.log('init 호출됨.');

  database = db;
  UserSchema = schema;
  UserModel = model;
}

const login = function (req, res) {
  console.log('user 모듈 안에 있는 login 호출됨.');

  //파라미터 확인
  let paramId = req.body.id;
  let paramPassword = req.body.password;

  // 데이터베이스 객체 참조
	const database = req.app.get('database');

  //데이터베이스 연결 확인
  if (database.db) {
    //로그인 처리 요청
    authUser(database, paramId, paramPassword, function (err, docs) {
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
}

const adduser = function (req, res) {
  console.log('user 모듈 안에 있는 adduser 호출됨.');

  let paramId = req.body.id || req.query.id;
  let paramPassword = req.body.password || req.query.password;
  let paramName = req.body.name || req.query.name;

  console.log('요청 파라미터 : ' + paramId + ', ' + paramPassword + ', ' + paramName);

  // 데이터베이스 객체 참조
	const database = req.app.get('database');

  //데이터베이스 객체가 초기화된 경우, addUser 함수 호출하여 사용자 추가
  if (database.db) {
    addUser(database, paramId, paramPassword, paramName, function (err, result) {
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
}

const listuser = function (req, res) {
  console.log('user 모듈 안에 있는 listuser 호출됨.');

  // 데이터베이스 객체 참조
	const database = req.app.get('database');

  //데이터베이스 객체가 초기화된 경우, 모델 객체의 findAll 메소드 호출
  if (database.db) {
    //모든 사용자 검색
    database.UserModel.findAll(function (err, results) {
      //오류가 발생하면 클라이언트로 전송
      if (err) {
        console.log('사용자 리스트 조회 중 오류 발생 : ' + err.stack);

        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h2>사용자 리스트 조회 중 오류 발생</h2>');
        res.write('<p>' + err.stack + '</p>');
        res.end();

        return;
      }

      //결과 객체가 있다면 리스트를 전송
      if (results) {
        console.dir(results);

        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h2>사용자 리스트</h2>');
        res.write('<div><ul>');

        for (let i = 0; i < results.length; i++) {
          let curId = results[i]._doc.id;
          let curName = results[i]._doc.name;
          res.write('    <li>#' + i + ' : ' + curId + ', ' + curName + '</li>');
        }

        res.write('</ul></div>');
        res.end();
      }
      else {
        res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
        res.write('<h2>사용자 리스트 조회 실패</h2>');
        res.end();
      }
    });
  }
  else {
    res.writeHead('200', { 'Content-Type': 'text/html;charset=utf8' });
    res.write('<h2>데이터베이스 연결 실패</h2>');
    res.end();
  }
}

//사용자 인증 함수: 아이디로 먼저 찾고 비밀번호를 그다음에 비교
const authUser = (database, id, password, callback) => {
  console.log('authUser 호출됨');

  //1. 아이디로 검색
  database.UserModel.findById(id, function (err, results) {
    if (err) {
      callback(err, null);
      return;
    }

    console.log('아이디 [%s]로 사용자 검색 결과', id);
    console.dir(results);

    if (results.length > 0) {
      console.log('아이디와 일치하는 사용자 찾음.');

      //2. 비밀번호 확인
      let user = new database.UserModel({ id: id });
      let authenticated = user.authenticate(password, results[0]._doc.salt,
        results[0]._doc.hashed_password);

      if (authenticated) {
        console.log('비밀번호 일치함.');
        callback(null, results);
      }
      else {
        console.log('비밀번호 일치하지 않음.');
        callback(null, null);
      }
    }
    else {
      console.log('아이디와 일치하는 사용자를 찾지 못함.');
      callback(null, null);
    }
  });
}

//사용자 추가 함수
const addUser = (database, id, password, name, callback) => {
  console.log('addUser 호출됨 : ' + id + ', ' + password + ', ' + name);

  //UserModel의 인스턴스 생성
  let user = new database.UserModel({ 'id': id, 'password': password, 'name': name });

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

module.exports = {
  init: init,
  login: login,
  adduser: adduser,
  listuser: listuser,
}
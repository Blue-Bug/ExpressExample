//로컬 스트래티지 설정
const LocalStrategy = require('passport-local').Strategy;

//passport 회원가입 설정
module.exports = function (app) {
  return new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, function (req, email, password, done) {
    //요청 파라미터 중 name 파라미터 확인
    let paramName = req.body.name || req.query.name;
    console.log('passport의 local-signup 호출됨 : ' + email + ', ' + password + ', ' + paramName);

    //User.findOne이 blocking되므로 async 방식으로 변경할 수도 있음
    process.nextTick(function () {
      let database = app.get('database');
      database.UserModel.findOne({ 'email': email }, function (err, user) {
        //오류 발생 시
        if (err) {
          return done(err);
        }

        //동일한 이메일이 있다면
        if (user) {
          console.log('해당 이메일 계정이 존재합니다.');

          return done(null, false, req.flash('signupMessage', '계정이 이미 있습니다.'));
        }
        else {
          //모델 인스턴스 객체 만들어 저장
          let user = new database.UserModel({ 'email': email, 'password': password, 'name': paramName });
          user.save(function (err) {
            if (err) { throw err; }
            console.log('사용자 데이터 추가함.');
            return done(null, user);
          });
        }//end if

      });//end findOne
    });//end nextTick
  });
}
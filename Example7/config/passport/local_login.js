//로컬 스트래티지 설정
const LocalStrategy = require('passport-local').Strategy;

//passport 로그인 설정
module.exports = function(app) {
  return new LocalStrategy({
    usernameField : 'email',
    passwordField : 'password',
    passReqToCallback : true
  }, function(req,email,password,done){
    //검증 콜백
    console.log('passport의 local-login 호출됨 : ' + email +', ' + password);
  
    let database = app.get('database');
    database.UserModel.findOne({'email': email}, function(err,user){
      //1. 데이터베이스 연결 오류
      if(err) { return done(err);}
  
      //2. 등록된 사용자가 없는 경우
      if(!user){
        console.log('계정이 일치하지 않음');
        return done(null,false,req.flash('loginMessage','등록된 계정이 없습니다.'));
      }
      
      let authenticated = user.authenticate(password,user._doc.salt, user._doc.hashed_password);
      
      //3. 비밀번호를 비교하여 맞지 않는 경우
      if(!authenticated){
        console.log('비밀번호가 일치하지 않음');
        return done(null,false,req.flash('loginMessage','비밀번호가 일치하지 않습니다.'));
      }
  
      //4. 정상인 경우
      console.log('계정과 비밀번호가 일치함.');
      return done(null,user);
    });//end findone
  });
}


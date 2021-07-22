const local_login = require('./passport/local_login');
const local_signup = require('./passport/local_signup');
const facebook = require('./passport/facebook');
const google = require('./passport/google');

module.exports = function(app,passport){
  console.log('config/passport 호출됨.');

  //사용자 인증 성공시 호출
  passport.serializeUser(function(user,done){
    console.log('serializeUser() 호출됨.');
    console.dir(user);

    done(null,user);
  });

  //사용자 인증 이후 사용자 요청이 있을 때마다 호출
  passport.deserializeUser(function(user,done){
    console.log('deserializeUser() 호출됨.');
    console.dir(user);

    done(null,user);
  });

  //인증 방식 설정
  passport.use('local-login',local_login(app));
  passport.use('local-signup',local_signup(app));
  passport.use('facebook',facebook(app));
  passport.use('google',google(app));
};

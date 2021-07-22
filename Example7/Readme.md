## 패스포트 모듈 사용
1. passport와 passport-local 전부 설치해야 로컬 스트래티지 사용가능
2. express-session 미들웨어 사용 선언 후에 passport 미들웨어 사용선언 해야함 
    - app.use(passport.initialize());  
    - app.use(passport.session());  
    - app.use(flash());  
3. 모듈화 시킬때 local_login.js와 local_signup.js에서 database에 접근할 수  있게 app 객체 넘겨주기
4. 페이스북은 https가 아니면 소셜 로그인 불가능
5. 구글은 id 대신 sub을 사용하여 저장(둘은 같은 값)
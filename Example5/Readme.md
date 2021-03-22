## 1.semantic-ui를 node 버전 10 이상에서 설치 시 오류 발생

### 해결 방법(2가지)
1. node 버전을 10 아래로 내려야됨 -> gulp 설치에 오류가 있기때문
    - 윈도우용 nvm<a>https://docs.microsoft.com/ko-kr/windows/nodejs/setup-on-windows</a>

2. npm install natives --save 실행 후 sematic-ui 설치

## 2.반응형 웹으로 웹문서를 구별해서 보여준다

### * 하나의 파일에 미디어 쿼리 사용
- @media screen and (min-width : px) and (max-width : px)

### * 요청한 단말에 따라 다른 파일을 사용
- ex) login.html, login_mobile.html
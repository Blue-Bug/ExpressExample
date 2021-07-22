//mongoose 모듈 사용
const mongoose = require('mongoose');

//database 객체에 db,schema,model 모두 추가
let database = {};

database.init = function (app, config) {
  console.log('database.init() 호출됨.');

  connect(app, config);
}

//데이터베이스에 연결하고 응답 객체의 속성으로 db 객체 추가
function connect(app, config) {
  console.log('connect() 호출됨.');

  //데이터베이스 연결
  console.log('데이터베이스 연결을 시도합니다.');
  //Node.js의 native Promise 사용
  mongoose.Promise = global.Promise;

  //Warning 메시지 제거
  mongoose.set('useCreateIndex', true);
  mongoose.connect(config.db_url, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('데이터베이스에 연결되었습니다. : ' + config.db_url))
    .catch(e => console.error(e));
  database.db = mongoose.connection;

  database.db.on('error', console.error.bind(console, 'mongoose connection error.'));
  database.db.on('open', function () {
    //데이터베이스가 연결되었을 때 이벤트 발생

    //스키마 정의
    createSchema(app, config);
  });

  database.db.on('disconnected', function () {
    //데이터베이스 연결이 끊어졌을때 이벤트 발생
    console.log('연결이 끊어졌습니다. 3초 후 다시 연결합니다.');
    setInterval(connectDB, 3000);
  });
}

//config에 정의한 스키마 및 모델 객체 생성
function createSchema(app, config) {
  let schemaLen = config.db_schemas.length;
  console.log('설정에 정의된 스키마의 수 : %d', schemaLen);

  config.db_schemas.forEach((curItem) => {
    //모듈 파일에서 모듈 불러운 후 createSchema() 함수 호출하기
    let curSchema = require(curItem.file).createSchema(mongoose);
    console.log('%s 모듈을 불러들인 후 스키마 정의함.', curItem.file);

    //UserModel 정의
    let curModel = mongoose.model(curItem.collection, curSchema);
    console.log('%s 컬렉션을 위해 모델 정의함.', curItem.collection);

    //database 객체에 속성으로 추가
    database[curItem.schemaName] = curSchema;
    database[curItem.modelName] = curModel;
    console.log('스키마 이름 [%s], 모델 이름 [%s]이 database 객체의 속성으로 추가됨.', curItem.schemaName, curItem.modelName);
  });

  app.set('database', database);
  console.log('database 객체가 app 객체의 속성으로 추가됨.');
}

//database 객체를 module.exports에 할당
module.exports = database;
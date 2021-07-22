let route_loader = {};

route_loader.init = function (app, router, config) {
  console.log('route_loader.init 호출됨.');
  initRoutes(app, router, config);
}

const initRoutes = function (app, router, config) {
  console.log('initRoutes() 호출됨.');

  let routeLen = config.route_info.length;
  console.log('설정에 정의된 요청패스 수 : %d', routeLen);

  config.route_info.forEach((curItem) => {
    // 모듈 파일에서 모듈 불러옴
    let curModule = require(curItem.file);
    if (curItem.type == 'post') {
      router.route(curItem.path).post(curModule[curItem.method]);
    }
    else if (curItem.type == 'get') {
      router.route(curItem.path).get(curModule[curItem.method]);
    }
  });

  //라우터 객체 등록
  app.use('/', router);
}

module.exports = route_loader;
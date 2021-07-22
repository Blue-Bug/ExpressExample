const FacebookStrategy = require('passport-facebook').Strategy;
const config = require('../../config');

module.exports = function(app){
  return new FacebookStrategy({
    clientID : config.facebook.clientID,
    clientSecret : config.facebook.clientSecret,
    callbackURL : config.facebook.callbackURL
  }, function(accessToken,refreshToken,profile,done){
    console.log('passport의 facebook 호출됨.');
    console.dir(profile);

    let options = {'facebook.id':profile.id};
    const database = app.get('database');
    database.UserModel.findOne(options,function(err,user){
      if(err) return done(err);

      if(!user){
        let user = new database.UserModel({
          name : profile.displayName,
          email :profile.emails[0].value,
          provider : 'facebook',
          authToken : accessToken,
          facebook : profile._json
        });

        user.save(function(err){
          if(err) console.log(err);
          return done(err,user);
        });
      }
      else{
        return done(err,user);
      }
    });
  });
};
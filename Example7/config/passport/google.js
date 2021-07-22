const GoogleStrategy   = require('passport-google-oauth2').Strategy;
const config = require('../../config');

module.exports = function(app){
  return new GoogleStrategy({
    clientID : config.google.clientID,
    clientSecret : config.google.clientSecret,
    callbackURL : config.google.callbackURL
  },function(accessToken,refreshToken,profile,done){
    console.log('passport의 google 호출됨.');
    console.dir(profile);

    let options = {'google.sub' : profile.id};
    const database = app.get('database');
    database.UserModel.findOne(options,function(err,user){
      if(err) return done(err);

      if(!user){
        let user = new database.UserModel({
          name : profile.displayName,
          email :profile.emails[0].value,
          provider : 'google',
          authToken : accessToken,
          google : profile._json
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
}
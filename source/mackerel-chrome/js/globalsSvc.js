// Generated by CoffeeScript 1.6.2
(function() {
  var that;

  that = this;

  this.appModule.factory('globalsSvc', function($log, $rootScope, $location, userPrefs) {
    var obj;

    $rootScope.authentication = {
      loginAction: {
        url: '#/login',
        message: 'Login'
      },
      logoutAction: {
        url: '#/logout',
        message: 'Logout'
      },
      setLoggedIn: function() {
        this.loggedIn = true;
        return this.nextAction = this.logoutAction;
      },
      setLoggedOut: function() {
        userPrefs.clear('evernote_authToken');
        this.loggedIn = false;
        return this.nextAction = this.loginAction;
      }
    };
    $rootScope.authentication.loggedIn = false;
    $rootScope.authentication.nextAction = $rootScope.authentication.loginAction;
    return obj = {
      doit: function() {
        userPrefs.apply();
        return obj.update();
      },
      handleError: function(e) {
        $log.error(e);
        $rootScope.msg = "error: " + e;
        $rootScope.error = e;
        $rootScope.resolveError = function(error) {
          return 'http://support.bigbearlabs.com/forums/191718-general/category/68202-tagyeti';
        };
        return $rootScope.$apply();
      },
      update: function() {
        var _ref;

        userPrefs.userDataSource.init();
        $rootScope.authentication.setLoggedIn();
        return (_ref = that.appModule.stickersC) != null ? _ref.update() : void 0;
      }
    };
  });

  this.appModule.factory('userPrefs', function($log, stubDataSvc, evernoteSvc) {
    return that.appModule.userPrefs = {
      stubDataSvc: stubDataSvc,
      evernoteSvc: evernoteSvc,
      env: 'production',
      sticker_prefix_pattern: /^##/,
      sticker_prefix: '##',
      userDataSource: null,
      production: {
        userDataSource: evernoteSvc
      },
      dev: {
        userDataSource: stubDataSvc
      },
      set: function(key, val) {
        if (val === void 0) {
          throw "value for key " + key + " is undefined";
        }
        $log.info("setting " + key);
        this[key] = val;
        return localStorage.setItem(key, JSON.stringify(val));
      },
      get: function(k) {
        var e, parsed, val;

        val = localStorage.getItem(k);
        if (val && val !== 'undefined') {
          this[k] = val;
        } else {
          val = this[k];
        }
        if (val) {
          try {
            return parsed = JSON.parse(val);
          } catch (_error) {
            e = _error;
            return val;
          }
        } else {
          console.log("returning null for '" + k + "'");
          return null;
        }
      },
      clear: function(key) {
        return localStorage.clear(key);
      },
      apply: function(env) {
        env || (env = this.get('env'));
        console.log("applying env '" + env + "'");
        this.userDataSource = this[env].userDataSource;
        return that.appModule.userDataSource = this.userDataSource;
      },
      needsIntro: function() {
        var nextIntroVal;

        nextIntroVal = this.get('nextIntro');
        if (!nextIntroVal) {
          return true;
        } else {
          return new Date(nextIntroVal).isPast();
        }
      },
      setFinishedIntro: function() {
        return this.set('nextIntro', this.nextDate().getTime());
      },
      nextDate: function() {
        if (this.env === 'dev') {
          return Date.tomorrow();
        } else {
          return Date.oneYearLater();
        }
      }
    };
  });

  Date.tomorrow = function() {
    var date;

    date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  };

  Date.oneYearLater = function() {
    var date;

    date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    return date;
  };

  Date.prototype.isPast = function() {
    var now;

    now = new Date();
    return this.getTime() < now.getTime();
  };

}).call(this);

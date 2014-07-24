(function(){
  angular.module('app.controller', ['app.constant', 'app.service', 'ga']).controller('AppCtrl', ['EDIT_URL', 'TableData', 'Spy', 'State', 'ModalManager'].concat(function(EDIT_URL, data, Spy, State, ModalManager){
    var this$ = this;
    this.EDIT_URL = EDIT_URL;
    data.then(function(d){
      return this$.data = d;
    });
    this.State = State;
    this.openEditModal = function(evt){
      evt.preventDefault();
      ModalManager.open('edit');
    };
  })).controller('HeaderCtrl', ['Spy', 'State', '$scope', '$anchorScroll', '$location', 'ModalManager', 'ga', 'HtmlDecoder'].concat(function(Spy, State, $scope, $anchorScroll, $location, ModalManager, ga, HtmlDecoder){
    var this$ = this;
    this.Spy = Spy;
    this.scrollTo = function(e, title){
      e.preventDefault();
      $location.hash(title);
      $anchorScroll();
    };
    $scope.$watch(function(){
      return Spy.current;
    }, function(){
      var title;
      State.titlebar = 'title';
      if (Spy.current !== null) {
        title = HtmlDecoder(Spy.spies[Spy.current]);
        ga('send', 'pageview', {
          title: title
        });
      }
    });
    this.openInfoModal = function(){
      ModalManager.open('info');
    };
    this.openSubscribeModal = function(){
      ModalManager.open('subscribe');
    };
    function writeLabelAction(){
      this$.labelAction = State.labels ? "按一下關閉" : "按一下開啟";
    } writeLabelAction();
    this.toggleLabels = function(){
      State.$cycle('labels');
      return writeLabelAction();
    };
  })).controller('ModalCtrl', ['EDIT_URL', 'RULE_URL', 'DISCUSS_URL'].concat(function(EDIT_URL, RULE_URL, DISCUSS_URL){
    this.EDIT_URL = EDIT_URL;
    this.RULE_URL = RULE_URL;
    this.DISCUSS_URL = DISCUSS_URL;
  })).controller('SubscriptionCtrl', ['UserPreference', '$scope'].concat(function(UserPref, $scope){
    var this$ = this;
    console.log('Subscription control');
    this.email = UserPref.getEmail();
    this.subscribe = function(){
      console.log('SUBSCRIBE', this$.email);
      UserPref.subscribe(this$.email);
      $scope.$close && $scope.$close();
    };
  })).controller('MeetingCtrl', function(){
    this.isDue = function(dateString){
      return new Date > new Date(dateString);
    };
  });
}).call(this);

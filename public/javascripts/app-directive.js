(function(){
  angular.module('app.directive', ['app.service', 'ngAnimate', 'ngSanitize', 'ui.bootstrap.selected', 'ga']).directive('vuSticky', ['WindowScroller'].concat(function(WindowScroller){
    var CLASS_NAME;
    CLASS_NAME = 'is-sticky';
    return function(scope, elem, attrs){
      var isSticky, threshold, unsubscribe;
      isSticky = elem.hasClass(CLASS_NAME);
      threshold = +attrs.vuSticky;
      unsubscribe = WindowScroller.subscribe(function(arg$){
        var scrollTop;
        scrollTop = arg$.scrollTop;
        if (scrollTop > threshold && isSticky !== true) {
          isSticky = true;
          return elem.addClass(CLASS_NAME);
        } else if (scrollTop < threshold && isSticky !== false) {
          isSticky = false;
          return elem.removeClass(CLASS_NAME);
        }
      });
      return scope.$on('$destroy', unsubscribe);
    };
  })).directive('vuSpy', ['$window', 'Spy'].concat(function($window, Spy){
    return function(scope, elem, attrs){
      var spyId, rect, windowHeight, isRequesting;
      spyId = scope.$eval(attrs.vuSpy);
      Spy.add(spyId);
      rect = windowHeight = null;
      function updateCache(){
        rect = elem[0].getBoundingClientRect();
        windowHeight = $window.innerHeight;
      }
      isRequesting = false;
      function doRequest(){
        scope.$apply(function(){
          return Spy.current = Spy.spies.indexOf(spyId);
        });
        isRequesting = false;
      }
      function scrollHandler(){
        updateCache();
        if (!(!isRequesting && rect.top <= 0 && rect.bottom > 0)) {
          return;
        }
        $window.requestAnimationFrame(doRequest);
        isRequesting = true;
      } scrollHandler();
      function unsubscribeScroll(){
        angular.element($window).off('scroll', scrollHandler);
      }
      angular.element($window).on('scroll', scrollHandler);
      return scope.$on('$destory', function(){
        Spy.remove(spyId);
        return unsubscribeScroll();
      });
    };
  })).directive('noAnimate', ['$animate'].concat(function($animate){
    return function(scope, elem){
      return $animate.enabled(false, elem);
    };
  })).directive('vuCompile', ['$compile'].concat(function($compile){
    return {
      restrict: 'EA',
      link: function(scope, elem, attrs){
        var html, dom;
        html = scope.$eval(attrs.tmpl);
        dom = $compile("<div>" + html + "</div>")(scope);
        return elem.html('').append(dom);
      }
    };
  })).config(['$tooltipProvider'].concat(function($tooltipProvider){
    $tooltipProvider.setTriggers({
      '$comment-on': '$comment-off'
    });
  })).directive('commentPopup', ['TableData', 'ModalManager', 'State'].concat(function(TableData, ModalManager, State){
    return {
      restrict: 'EA',
      replace: true,
      scope: {
        content: '@',
        placement: '@',
        animation: '&',
        isOpen: '&'
      },
      templateUrl: 'public/templates/comment-popup.html',
      link: function(scope, elem, attrs){
        TableData.then(function(data){
          var id;
          return scope.comments = (function(){
            var i$, ref$, len$, results$ = [];
            for (i$ = 0, len$ = (ref$ = scope.content.split(',')).length; i$ < len$; ++i$) {
              id = ref$[i$];
              results$.push(data.comments[id]);
            }
            return results$;
          }());
        });
        scope.edit = function(e){
          e.preventDefault();
          State.$reset('comment');
          return ModalManager.open('edit');
        };
        return elem.on('click', function(it){
          return it.stopPropagation();
        });
      }
    };
  })).directive('comment', ['$tooltip', 'State', '$timeout', '$document', '$rootScope', '$window'].concat(function($tooltip, State, $timeout, $document, $rootScope, $window){
    var resetCommentState, config, originalCompile;
    resetCommentState = function(){
      if (State.$isDefault('comment')) {
        return;
      }
      return $rootScope.$apply(function(){
        return State.$reset('comment');
      });
    };
    $document.on('click', resetCommentState);
    $document.on('keyup', function(it){
      if (it.which === 27) {
        return resetCommentState();
      }
    });
    config = $tooltip('comment', 'comment', '$comment-on');
    originalCompile = config.compile;
    config.compile = function(){
      var originalLink;
      originalLink = originalCompile.apply(this, arguments);
      return function(scope, elem, attrs){
        var commentId, triggerComment;
        scope.placement = 'top';
        originalLink.apply(this, arguments);
        commentId = attrs.comment.split(',')[0];
        triggerComment = function(e){
          e.stopPropagation();
          if (elem[0].getBoundingClientRect().top < $window.innerHeight / 2) {
            scope.placement = 'bottom';
          } else {
            scope.placement = 'top';
          }
          return scope.$apply(function(){
            return State.comment = commentId;
          });
        };
        elem.on('mouseenter', triggerComment);
        elem.on('click', triggerComment);
        scope.$watch(function(){
          return State.comment;
        }, function(val){
          if (val === commentId) {
            $timeout(function(){
              return elem.triggerHandler('$comment-on');
            });
          } else {
            $timeout(function(){
              return elem.triggerHandler('$comment-off');
            });
          }
        });
      };
    };
    return config;
  })).directive('vuTrack', ['ga', 'HtmlDecoder', 'DIMENSIONS', '$timeout', '$window'].concat(function(ga, HtmlDecoder, DIM, $timeout, $window){
    return function(scope, elem, attrs){
      var settings, eventOption, ref$, clickOption, hoverOption, copyOption, promise, entered;
      settings = scope.$eval(attrs.vuTrack);
      if (settings.perspective != null) {
        settings.perspective = HtmlDecoder(settings.perspective);
      }
      if (settings.content != null) {
        settings.content = HtmlDecoder(settings.content);
      }
      eventOption = (ref$ = {
        hitType: 'event',
        eventCategory: settings.category || 'button',
        eventLabel: settings.label,
        eventValue: 1
      }, ref$[DIM.PERSPECTIVE + ""] = settings.perspective, ref$[DIM.POSITION + ""] = settings.position, ref$);
      if (settings.content != null) {
        eventOption.eventCategory = 'item';
        eventOption.eventLabel = settings.content;
      }
      clickOption = angular.extend({}, eventOption, {
        eventAction: 'click'
      });
      hoverOption = angular.extend({}, eventOption, {
        eventAction: 'hover'
      });
      copyOption = angular.extend({}, eventOption, {
        eventAction: 'copy'
      });
      elem.on('click', function(){
        return ga('send', clickOption);
      });
      promise = null;
      entered = null;
      elem.on('mouseleave', function(){
        var timingVal;
        if (promise) {
          $timeout.cancel(promise);
        }
        timingVal = Date.now() - entered;
        ga('send', 'timing', eventOption.eventCategory, 'hover', timingVal, eventOption.eventLabel);
        promise = null;
        return entered = null;
      });
      elem.on('mouseenter', function(){
        entered = Date.now();
        return promise = $timeout(function(){
          ga('send', hoverOption);
          promise = null;
        }, 500);
      });
      elem.on('copy', function(){
        copyOption[DIM.ITEM_CONTENT] = $window.getSelection() + '';
        ga('send', copyOption);
      });
    };
  }));
}).call(this);

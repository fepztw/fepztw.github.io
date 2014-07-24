(function(){
  var Spy, State, UserPreference, ModalManager, join$ = [].join;
  angular.module('app.service', ['ngSanitize', 'ga', 'ui.bootstrap.selected']).factory('WindowScroller', ['$window', '$timeout', '$rootScope'].concat(function($window, $timeout, $rootScope){
    var win, values, getValues, callbacks, isRequesting, launchCallbacks;
    win = angular.element($window);
    values = {};
    getValues = function(){
      values.offsetHeight = $window.document.body.offsetHeight;
      values.clientHeight = $window.document.body.clientHeight;
      values.scrollTop = $window.document.body.scrollTop;
      return values;
    };
    callbacks = [];
    isRequesting = false;
    launchCallbacks = function(){
      var isRequesting;
      $rootScope.$apply(function(){
        var i$, ref$, len$, callback, results$ = [];
        for (i$ = 0, len$ = (ref$ = callbacks).length; i$ < len$; ++i$) {
          callback = ref$[i$];
          results$.push(callback(values));
        }
        return results$;
      });
      return isRequesting = false;
    };
    win.on('scroll', function(){
      var isRequesting;
      getValues();
      if (isRequesting) {
        return;
      }
      requestAnimationFrame(launchCallbacks);
      return isRequesting = true;
    });
    return {
      subscribe: function(callback){
        callbacks.push(callback);
        $timeout(function(){
          return callback(getValues());
        });
        return function(){
          return callbacks.splice(callbacks.indexOf(callback), 1);
        };
      }
    };
  })).service('Spy', Spy = (function(){
    Spy.displayName = 'Spy';
    var prototype = Spy.prototype, constructor = Spy;
    function Spy(){
      this.spies = [];
      this.current = null;
    }
    prototype.add = function(spyId){
      return this.spies = this.spies.concat(spyId);
    };
    prototype.remove = function(spyId){
      return this.spies.splice(this.spies.indexOf(spyId), 1);
    };
    return Spy;
  }())).service('State', State = (function(){
    State.displayName = 'State';
    var prototype = State.prototype, constructor = State;
    State['enum'] = {
      titlebar: ['title', 'toolbox'],
      labels: [true, false],
      comment: [null]
    };
    function State(){
      var i$, ref$, own$ = {}.hasOwnProperty;
      for (i$ in ref$ = constructor['enum']) if (own$.call(ref$, i$)) {
        (fn$.call(this, i$, ref$[i$]));
      }
      function fn$(name, values){
        this[name] = values[0];
      }
    }
    prototype.$cycle = function(name){
      var currentIndex, newIndex;
      currentIndex = constructor['enum'][name].indexOf(this[name]);
      newIndex = (currentIndex + 1) % constructor['enum'][name].length;
      console.log(currentIndex, newIndex);
      return this[name] = constructor['enum'][name][newIndex];
    };
    prototype.$reset = function(name){
      return this[name] = constructor['enum'][name][0];
    };
    prototype.$isDefault = function(name){
      return this[name] === constructor['enum'][name][0];
    };
    return State;
  }())).service('UserPreference', UserPreference = (function(){
    UserPreference.displayName = 'UserPreference';
    var storage, prototype = UserPreference.prototype, constructor = UserPreference;
    storage = null;
    UserPreference.$inject = ['$window'];
    function UserPreference($window){
      var uid;
      storage = $window.localStorage;
      if (this.canSendData()) {
        uid = storage.userId = storage.userId || "" + Math.random();
        ga('set', 'dimension1', uid);
      }
    }
    prototype.subscribe = function(email){
      storage.email = email;
    };
    prototype.getEmail = function(){
      return storage.email;
    };
    prototype.backout = function(){
      storage.isBackedout = true;
    };
    prototype.canSendData = function(){
      return !storage.isBackedout;
    };
    return UserPreference;
  }())).factory('HtmlDecoder', function(){
    var textarea;
    textarea = angular.element('<textarea></textarea>')[0];
    return function(encoded){
      textarea.innerHTML = encoded;
      return textarea.value;
    };
  }).factory('HighlightParser', ['$interpolate', 'CommentParser'].concat(function($interpolate, CommentParser){
    var COMMENT, EXTRACT_ID, GARBAGE_LEN, SPAN_START, SPAN_END, SPAN_PLACEHOLDER_STR, SPAN_PLACEHOLDER, CLASS, GENERATE_COMMENT, parser;
    COMMENT = /<span[^>]*>([^<]+)<\/span>((?:<sup>.+?<\/sup>)+)/gim;
    EXTRACT_ID = /#cmnt(\d+)/g;
    GARBAGE_LEN = '#cmnt'.length;
    SPAN_START = /<span[^>]*>/gim;
    SPAN_END = /<\/span>/gim;
    SPAN_PLACEHOLDER_STR = 'xx-span-xx';
    SPAN_PLACEHOLDER = new RegExp(SPAN_PLACEHOLDER_STR, 'gm');
    CLASS = /\s+class="[^"]+"/gim;
    GENERATE_COMMENT = function(options){
      options = clone$(options);
      options.placement = '{{placement}}';
      options.tagName || (options.tagName = 'span');
      options.classes = JSON.stringify(options.classes || {});
      return $interpolate('<{{tagName}} comment="{{id}}" comment-placement="{{placement}}" comment-append-to-body="true" ng-class=\'{{classes}}\'>{{content}}</{{tagName}}>')(options);
    };
    parser = function(doc, comments){
      comments == null && (comments = {});
      return doc.replace(COMMENT, function(m, content, sups){
        var ids, classes, i$, len$, id, cls;
        ids = sups.match(EXTRACT_ID).map(function(it){
          return it.slice(GARBAGE_LEN);
        });
        classes = {};
        for (i$ = 0, len$ = ids.length; i$ < len$; ++i$) {
          id = ids[i$];
          cls = (fn$());
          if (cls) {
            classes[cls] = true;
          }
        }
        return GENERATE_COMMENT({
          id: join$.call(ids, ','),
          content: content,
          tagName: SPAN_PLACEHOLDER_STR,
          classes: classes
        });
        function fn$(){
          var ref$;
          switch ((ref$ = comments[id]) != null && ref$.type) {
          case CommentParser.types.REF_MISSING:
          case CommentParser.types.REF_CONTROVERSIAL:
            return 'is-controversial';
          case CommentParser.types.NOTE:
            return 'is-info';
          }
        }
      }).replace(SPAN_START, '').replace(SPAN_END, '').replace(CLASS, '').trim().replace(SPAN_PLACEHOLDER, 'span');
    };
    parser.GENERATE_COMMENT = GENERATE_COMMENT;
    return parser;
  })).factory('ItemSplitter', function(){
    var SPLITTER, REF_END, EMPTY_SPAN;
    SPLITTER = /\[\s*&#20986;&#34389;\s*(?:&#160;)*/gm;
    REF_END = /]/gim;
    EMPTY_SPAN = /<span\s*[^>]*><\/span>/gim;
    return function(doc){
      var idx;
      idx = doc.search(SPLITTER);
      if (idx === -1) {
        idx = doc.length;
      }
      return {
        content: doc.slice(0, idx),
        ref: doc.slice(idx).replace(SPLITTER, '').replace(REF_END, '').replace(EMPTY_SPAN, '').trim()
      };
    };
  }).factory('TableParser', ['ItemSplitter', 'HighlightParser', '$sanitize', 'CommentParser'].concat(function(ItemSplitter, HighlightParser, $sanitize, CommentParser){
    var TR_EXTRACTOR, TD_EXTRACTOR, TAGS, LI_EXTRACTOR, LI_START, LI_END;
    TR_EXTRACTOR = /<tr[^>]*>(.+?)<\/tr>/gim;
    TD_EXTRACTOR = /<td[^>]*>(.*?)<\/td>/gim;
    TAGS = /<\/?[^>]*>/gim;
    LI_EXTRACTOR = /<li[^>]*>(.+?)<\/li>/gim;
    LI_START = /<li[^>]*>/;
    LI_END = /<\/li>/;
    function cleanupTags(matchedString){
      return matchedString.replace(TAGS, '').trim();
    }
    function cleanupLi(matchedString){
      return matchedString.replace(LI_START, '').replace(LI_END, '').trim();
    }
    return function(doc){
      var comments, trs, tds, ref$, positionTitle, res$, i$, len$, td, perspectives, tr, title, positions, res1$, j$, len1$, lis, debateArguments, res2$, k$, len2$, li, argument;
      comments = CommentParser(doc);
      trs = doc.replace(/\n/gm, '').match(TR_EXTRACTOR) || [''];
      tds = ((ref$ = trs[0].match(TD_EXTRACTOR)) != null ? ref$.slice(1) : void 8) || [];
      res$ = [];
      for (i$ = 0, len$ = tds.length; i$ < len$; ++i$) {
        td = tds[i$];
        res$.push(cleanupTags(td));
      }
      positionTitle = res$;
      trs.shift();
      res$ = [];
      for (i$ = 0, len$ = trs.length; i$ < len$; ++i$) {
        tr = trs[i$];
        tds = tr.match(TD_EXTRACTOR);
        title = cleanupTags(tds[0]);
        tds.shift();
        res1$ = [];
        for (j$ = 0, len1$ = tds.length; j$ < len1$; ++j$) {
          td = tds[j$];
          lis = td.match(LI_EXTRACTOR) || [];
          res2$ = [];
          for (k$ = 0, len2$ = lis.length; k$ < len2$; ++k$) {
            li = lis[k$];
            argument = ItemSplitter(cleanupLi(li));
            argument.content = HighlightParser($sanitize(argument.content), comments);
            argument.ref = HighlightParser($sanitize(argument.ref), comments);
            res2$.push(argument);
          }
          debateArguments = res2$;
          res1$.push(debateArguments);
        }
        positions = res1$;
        res$.push({
          title: title,
          positions: positions
        });
      }
      perspectives = res$;
      return {
        positionTitle: positionTitle,
        perspectives: perspectives,
        comments: comments
      };
    };
  })).factory('TableData', ['TableParser', 'CommentParser', '$http', 'DATA_URL'].concat(function(TableParser, CommentParser, $http, DATA_URL){
    return $http.get(DATA_URL).then(function(resp){
      return TableParser(resp.data);
    });
  })).factory('CommentParser', ['linky'].concat(function(linky){
    var REF_MISSING, REF_CONTROVERSIAL, NOTE, SECOND, OTHER, COMMENT_DIV_EXTRACTOR, TYPE_EXTRACTOR, SECOND_MATCHER, SPAN_START, SPAN_END, CLASS, parser;
    REF_MISSING = 'REF_MISSING';
    REF_CONTROVERSIAL = 'REF_CONTROVERSIAL';
    NOTE = 'NOTE';
    SECOND = 'SECOND';
    OTHER = 'OTHER';
    COMMENT_DIV_EXTRACTOR = /<div[^>]*><p[^>]*><a[^>]+name="cmnt(\d+)">[^>]+<\/a>(.+?)<\/div>/gim;
    TYPE_EXTRACTOR = /^\[([^\]]+)\]\s*/;
    SECOND_MATCHER = /^\+1/;
    SPAN_START = /<span class="[^"]+">/gim;
    SPAN_END = /<\/span>/gim;
    CLASS = /\s+class="[^"]+"/gim;
    parser = function(doc){
      var comments, matched, id, rawContent, rawType, ref$, type, content;
      comments = {};
      while (matched = COMMENT_DIV_EXTRACTOR.exec(doc)) {
        id = matched[1];
        rawContent = matched[2].replace(SPAN_START, '').replace(SPAN_END, '').replace(CLASS, '').trim();
        rawType = (ref$ = rawContent.match(TYPE_EXTRACTOR)) != null ? ref$[1] : void 8;
        type = (fn$());
        content = rawContent.replace(TYPE_EXTRACTOR, '').trim();
        if (content.match(SECOND_MATCHER)) {
          type = SECOND;
        }
        content = linky("<p>" + content);
        comments[id] = {
          type: type,
          content: content
        };
      }
      return comments;
      function fn$(){
        switch (rawType) {
        case "&#35036;&#20805;&#35498;&#26126;":
          return NOTE;
        case "&#38656;&#35201;&#20986;&#34389;":
          return REF_MISSING;
        case "&#20986;&#34389;&#29229;&#35696;":
          return REF_CONTROVERSIAL;
        default:
          return OTHER;
        }
      }
    };
    parser.types = {
      REF_MISSING: REF_MISSING,
      REF_CONTROVERSIAL: REF_CONTROVERSIAL,
      NOTE: NOTE,
      SECOND: SECOND,
      OTHER: OTHER
    };
    return parser;
  })).factory('linky', function(){
    var LINKY_URL_REGEXP, MAILTO_REGEXP;
    LINKY_URL_REGEXP = /((ftp|https?):\/\/|(mailto:)?[A-Za-z0-9._%+-]+@)[^\s<>]*[^\s.;,(){}<>]/;
    MAILTO_REGEXP = /^mailto:/;
    return function(text, target){
      var raw, html, m, url, i;
      if (!text) {
        return text;
      }
      raw = text;
      html = [];
      while (m = raw.match(LINKY_URL_REGEXP)) {
        url = m[0];
        if (m[2] === m[3]) {
          url = "mailto:" + url;
        }
        i = m.index;
        addText(raw.substr(0, i));
        addLink(url, m[0].replace(MAILTO_REGEXP, ''));
        raw = raw.substring(i + m[0].length);
      }
      addText(raw);
      return html.join('');
      function addText(text){
        if (!text) {
          return;
        }
        return html.push(text);
      }
      function addLink(url, text){
        html.push('<a ');
        if (angular.isDefined(target)) {
          html.push('target="');
          html.push(target);
          html.push('" ');
        }
        html.push('href="');
        html.push(url);
        html.push('">');
        addText(text);
        return html.push('</a>');
      }
      return addLink;
    };
  }).service('ModalManager', ModalManager = (function(){
    ModalManager.displayName = 'ModalManager';
    var defaultOptions, prototype = ModalManager.prototype, constructor = ModalManager;
    defaultOptions = {
      edit: {
        templateUrl: 'public/templates/edit.html',
        controller: 'ModalCtrl as Modal'
      },
      subscribe: {
        templateUrl: 'public/templates/subscribe-modal.html',
        controller: 'ModalCtrl as Modal',
        size: 'sm'
      },
      info: {
        templateUrl: 'public/templates/info.html',
        controller: 'ModalCtrl as Modal'
      }
    };
    ModalManager.$inject = ['$modal'];
    function ModalManager($modal){
      this.$modal = $modal;
    }
    prototype.open = function(name){
      return this.$modal.open(defaultOptions[name]);
    };
    return ModalManager;
  }()));
  function clone$(it){
    function fun(){} fun.prototype = it;
    return new fun;
  }
}).call(this);

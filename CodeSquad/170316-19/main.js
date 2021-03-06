var ns = {};

//utility
ns.util = {
  sendAjax: function (url, fn) {
    console.log(".. util > sendAjax");
    const oReq = new XMLHttpRequest();

    oReq.addEventListener("load", function () {
      var jsonObj = JSON.parse(oReq.responseText);
      fn(jsonObj); //json객체를 콜백함수에 인자로 전달
      //controller의 initView 실행
      //fn = function (result) {
      //    ns.dispatcher.emit({
      //    "type": "initView"
      // }, [result]);
    });
    oReq.open("GET", url);
    oReq.send();
  },
  getChildOrder: function (elChild) {
    console.log(".. util > getChildOrder");
    const elParent = elChild.parentNode;
    let nIndex = Array.prototype.indexOf.call(elParent.children, elChild);
    return nIndex;
  },
  $: function (selector) {
    return document.querySelector(selector);
  }
}
/**************************************************************/

/*note
  DISPATCHER
  변화가 발생시 미리 가지고 있는 정보를 토대로, 필요할 일을 실행시킴.
  일종의 Observer pattern을 사용해보자.
*/

/**************************************************************/

ns.dispatcher = {
  register: function (fnlist) {
    this.fnlist = fnlist;
  },
  emit: function (o, data) {
    this.fnlist[o.type].apply(null, data);
  }
}

/**************************************************************/

//model
ns.model = {
  newsList: [],
  currentNewsOrder: 0,
  getAllNewsList: function () {
    console.log(".. model > getAllNewsList");
    return this.newsList;
  },
  getCurrentNewsOrder: function () {
    console.log(".. model > getCurrentNewsOrder");
    return this.currentNewsOrder;
  },
  changeCurrentNews: function (order) {
    console.log(".. model > changeCurrentNews");
    this.currentNewsOrder = order;
    ns.dispatcher.emit({
      "type": "changeCurrentPanel"
    }, [order, this.newsList[order]]);
  },
  saveAllNewsList: function (newsList) {
    console.log(".. model > saveAllNewsList");
    this.newsList = newsList;
    ns.dispatcher.emit({
      "type": "changeNewsList"
    }, [newsList]);
  },
  removeCurrentNewsData: function () {
    console.log(".. model > removeCurrentNewsData");
    this.newsList.splice(this.currentNewsOrder, 1);
    ns.dispatcher.emit({
      "type": "changeNewsList"
    }, [this.newsList]);
  }
}

/**************************************************************/

ns.view = {};
//HEADERVIEW
ns.view.header = {
  init: function () {
    console.log(".. view.header > init");
    this.registerEvents();
  },
  registerEvents: function () {
    console.log(".. view.header > registerEvents");
    function _btnClickHandler(direction) {
      console.log(".. view.header > registerEvents > _btnClickHandler");
      ns.dispatcher.emit({
        'type': "afterMoveButton"
      }, [direction]);
    }

    ns.util.$(".left").addEventListener('click', () => {
      console.log(".. view.header > registerEvents > _btnClickHandler > left click event");
      _btnClickHandler.call(this, "left");
    });
    ns.util.$(".right").addEventListener('click', () => {
      console.log(".. view.header > registerEvents > _btnClickHandler > right click event");
      _btnClickHandler.call(this, "right");
    });
  }
}


//LIST VIEW
ns.view.list = {
  init: function () {
    console.log(".. view.list > init");
    this.selectList();
  },
  renderView: function (result) {
    console.log(".. view.list > renderView");
    const sHTML = result.reduce(function (prev, next) {
      return prev + "<li>" + next.title + "</li>"
    }, "");
    /**reduce? 
      Array.reduce(callback[, initialValue])
      배열의 모든 요소에 대해 지정된 콜백을 호출합니다.
      콜백 함수의 반환 값은 결과에 누적되며 다음에 콜백 함수를 호출할 때 인수로 제공됩니다.
    */
    this.listParent.innerHTML = sHTML;
    // listParent는 ns.view.list 객체를 생성할때 Object.assign을 통해 복사된 프로퍼티
    this.setHighLightTitle(0);
  },
  setHighLightTitle: function (order) {
    console.log(".. view.list > setHighLightTitle");
    const elSelectedNode = this.listParent.querySelector(".selectedList");
    if (elSelectedNode) elSelectedNode.className = "";

    const curNode = this.listParent.querySelector("li:nth-child(" + ++order + ")");
    curNode.className = "selectedList";
  },
  selectList: function () {
    console.log(".. view.list > selectList");
    ns.util.$(".mainArea ul").addEventListener("click", function (evt) {
      const currentOrder = ns.util.getChildOrder(evt.target);
      ns.dispatcher.emit({
        "type": "changeCurrentNews"
      }, [currentOrder]);
    }.bind(this));
  }
}

//CONTENT VIEW
ns.view.content = {
  renderView: function (newsObj) {
    console.log(".. view.content > renderView");
    const sTemplate = ns.util.$("#newsTemplate").innerHTML;
    const sList = newsObj.newslist.reduce(function (prev, next) {
      return prev + "<li>" + next + "</li>"
    }, "");
    let result = sTemplate.replace(/{title}/, newsObj.title).replace(/{imgurl}/, newsObj.imgurl);

    result = result.replace(/{newsList}/, sList);

    this.insertNewsContent(result);
  },
  insertNewsContent: function (result) {
    console.log(".. view.content > insertNewsContent");
    this.base.innerHTML = result;
  },
  init: function (name) {
    console.log(".. view.content > init");
    this.registEvents();
  },
  registEvents: function () {
    console.log(".. view.content > registEvents");
    //remove news
    const parent = ns.util.$(".content");
    parent.addEventListener("click", function (evt) {
      const el = evt.target;
      if (el !== "BUTTON" && el.parentNode.nodeName !== "BUTTON") return;
      ns.dispatcher.emit({
        type: "removeCurrentNewsData"
      }, []);
    }.bind(this))
  }
}

/**************************************************************/

//CONTROLLER
ns.controller = {
  join: function () {
    //ns.dispatcher.register에 인자로 아래 함수들을 넣는 샘...
    ns.dispatcher.register({
      //View Event
      "initView": function (result) {
        console.log(".. controller > join > initView");
        this.model.saveAllNewsList(result);
      }.bind(this),

      "afterMoveButton": function (direction) {
        console.log(".. controller > join > afterMoveButton");
        const nextOrder = this._getNextOrder(direction);
        this.model.changeCurrentNews(nextOrder);
      }.bind(this),

      "changeCurrentNews": function (order) {
        console.log(".. controller > join > changeCurrentNews");
        this.model.changeCurrentNews(order);
      }.bind(this),

      "removeCurrentNewsData": function () {
        console.log(".. controller > join > removeCurrentNewsData");
        this.model.removeCurrentNewsData();
      }.bind(this),

      //Model Event 
      "changeNewsList": function (result) {
        console.log(".. controller > join > changeNewsList");
        this.listView.renderView(result);
        this.contentView.renderView(result[0]);
      }.bind(this),

      "changeCurrentPanel": function (nextOrder, newsObj) {
        console.log(".. controller > join > changeCurrentPanel");
        this.listView.setHighLightTitle(nextOrder);
        this.contentView.renderView(newsObj);
      }.bind(this)
    });
  },
  _getNextOrder: function (direction) {
    console.log(".. controller > _getNextOrder")
    const curOrder = this.model.getCurrentNewsOrder();
    const totalCount = this.model.getAllNewsList().length;
    let nextOrder = curOrder;

    if (direction === "left") {
      if (curOrder === 0) nextOrder = totalCount - 1;
      else nextOrder--;
    } else {
      if (curOrder === totalCount - 1) nextOrder = 0;
      else nextOrder++;
    }
    return nextOrder;
  }
}

/**************************************************************/
/**************************************************************/

//sevice runner
document.addEventListener("DOMContentLoaded", function () {
  console.log("1nd DOMContentLoaded");
  //initialize all Object
  const model = Object.assign(Object.create(ns.model), {});
  /** Object.assign?
    Object.assign(target, ...sources)
    열거할 수 있는 하나 이상의 소스 오브젝트로 부터 타켓 오브젝트로 프로퍼티들을 복사하는데 사용
  */
  const headerView = Object.assign(Object.create(ns.view.header), {});
  const listView = Object.assign(Object.create(ns.view.list), {
    listParent: ns.util.$(".mainArea nav ul"),
  });
  const contentView = Object.assign(Object.create(ns.view.content), {
    base: ns.util.$('.content')
  });

  const controller = Object.assign(Object.create(ns.controller), {
    model: model,
    headerView: headerView,
    listView: listView,
    contentView: contentView
  });

  //start logics
  headerView.init();
  listView.init();
  contentView.init();

  controller.join();
});

document.addEventListener("DOMContentLoaded", function () {
  console.log("2nd DOMContentLoaded");
  ns.util.sendAjax("./data/newslist.json", function (result) {
    ns.dispatcher.emit({
      "type": "initView"
    }, [result]);
  });
});

















/**************************************************************/
/**************************************************************/

/* todo
  dispatcher?
  Object.assign?
*/

/*----------------------------------------------------------
아래 3개는 같은 코드, Object.assign을 사용하기까지의 변화 과정을 살펴보자 

var healthObj = {
  showHealth: function () {
    console.log("오늘은 " + this.lastTime + "까지 " +
      this.name + " 운동을 하셨네요");
  }
}

function Health(name, lastTime) {
  this.name = name;
  this.lastTime = lastTime;
}
Health.prototype = healthObj;

/////////////////////////////////////////////////////////////

var healthObj = {
  showHealth: function () {
    console.log("오늘은 " + this.lastTime +
      "까지 " + this.name + " 운동을 하셨네요");
  }
}
var myHealth = Object.create(healthObj);
myHealth.name = "달리기";
myHealth.lastTime = "23:10";

/////////////////////////////////////////////////////////////

var healthObj = {
  showHealth: function () {
    console.log("오늘은 " + this.lastTime + "까지 " +
      this.name + " 운동을 하셨네요");
  }
}
var myHealth = Object.assign(Object.create(healthObj), {
  name: "달리기",
  lastTime: "23:10"
});
----------------------------------------------------------*/
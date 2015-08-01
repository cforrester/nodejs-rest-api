var server = require("./server");
var router = require("./routes");
var controllers = require("./controllers");
var test = require("./tests/test.js");

var apiRequest = {};
apiRequest["/login"] = controllers.userController.login;
apiRequest["/logout"] = controllers.userController.logout;
apiRequest["/items"] = controllers.dataController.items;
apiRequest["/addItem"] = controllers.dataController.addItem;
apiRequest["/deleteItem"] = controllers.dataController.deleteItem;
apiRequest["/test"] = test.testController.testPage;

server.start(router.route, apiRequest);

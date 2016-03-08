//(function(win, doc){
//    win.onload = function(){
//        var socket = io();
//        socket.on('message', function(msg){
//            var li = doc.createElement('li');
//            li.innerHTML = msg;
//            msg_container.appendChild(li)
//        });
//        socket.on('connected', function(data){
//            var li = doc.createElement('li');
//            li.innerHTML = data;
//            msg_container.appendChild(li)
//        });
//
//        var msg_box = doc.getElementById('msg_box');
//        var send_btn = doc.getElementById('send_btn');
//        var msg_container = doc.getElementById('msg_container');
//
//        send_btn.onclick = function(e){
//            socket.send(msg_box.value);
//            msg_box.value = '';
//        }
//    }
//}(window, document));

var app = angular.module('my_app', ['ngAnimate']);

app.run(['$rootScope', function($rootScope){
    $rootScope.now_chat = {};
}]);

app.factory('sio', ['$rootScope', function($rootScope){
    var native_sio = io('/', {transports: ['polling']});
    return {
        on: function(event, callback){
            var self = this;
            native_sio.on(event, function(){
                callback.apply(self, arguments);
                $rootScope.$apply();
            });
        },
        emit: function(){
            native_sio.emit.apply(native_sio, arguments);
        }
    };
}]);

app.controller('MainController', ['$scope', 'sio', function($scope, sio){
    $scope.app_ready = false;
    sio.on('connect', function(){
        $scope.app_ready = true;
        $scope.$apply();
    });
}]);

app.controller('ChatListController', ['$scope', 'sio', function($scope, sio){
    $scope.get_friends = function(){
        sio.emit('get_friends');
    };

    $scope.get_groups = function(){
        sio.emit('get_groups');
    };

    $scope.get_rct_contacts = function(){
        sio.emit('get_rct_contacts');
    };

    sio.on('message', function(msg){
        console.log(msg)
    });

    sio.on('res_friends', function(res){
        if(res.success == false) return;
        $scope.friends = res.data.list || [];
    });

    sio.on('res_groups', function(res){
        if(res.success == false) return;
        $scope.groups = res.data.list || [];
    });

    sio.on('res_rct_contacts', function(res){
        if(res.success == false) return;
        $scope.rct_contacts = res.data.list || []
    });
}]);
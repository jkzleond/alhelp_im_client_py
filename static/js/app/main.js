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

var app = angular.module('my_app', []);

app.factory('sio', function(){
    return io();
});

app.run(['$rootScope', 'sio', function($rootScope, sio){
    $rootScope.msgs = [];

    $rootScope.send_msg = function(msg){
        sio.send(msg);
    };

    var last_receive_time = 0;
    var digest_throttle = 200;

    sio.on('message', function(msg){
        $rootScope.msgs.push({content:msg});
        var now = Date.now();
        if(now - last_receive_time > digest_throttle){
            $rootScope.$apply();
            last_receive_time = now;
        }
    });
}]);



app.controller('TController', ['$scope', function($scope){

}]);
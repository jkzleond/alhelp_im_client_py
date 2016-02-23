(function(win, doc){
    win.onload = function(){
        var socket = io();
        socket.on('message', function(msg){
            var li = doc.createElement('li');
            li.innerHTML = msg;
            msg_container.appendChild(li)
        });
        socket.on('connected', function(data){
            var li = doc.createElement('li');
            li.innerHTML = data;
            msg_container.appendChild(li)
        });

        var msg_box = doc.getElementById('msg_box');
        var send_btn = doc.getElementById('send_btn');
        var msg_container = doc.getElementById('msg_container');

        send_btn.onclick = function(e){
            socket.send(msg_box.value);
            msg_box.value = '';
        }
    }
}(window, document));
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

app.config(['$interpolateProvider', function($interpolateProvider){
    $interpolateProvider.startSymbol('<{');
    $interpolateProvider.endSymbol('}>');
}]);


app.run(['$rootScope', function($rootScope){
    $rootScope.now_chat = {};
}]);

/* 服务 */
app.factory('sio', ['$rootScope', function($rootScope){
    var native_sio = io('/', {
        transports: ['websocket'],
        pingTimeout: 120
    });
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

app.factory('upload',[function(){

    function make_element(action_url, accept, callback){
        var random_id = Date.now();
        var ele_container = document.createElement('div');
        ele_container.id = 'upload_' + random_id;
        ele_container.style = 'display:none';
        document.body.appendChild(ele_container);

        ele_container.innerHTML = '<iframe id="ifr_' + random_id + '" name="ifr_' + random_id + '" src="about:blank"></iframe>';

        var iframe = document.getElementById('ifr_' + random_id);
        var form = document.createElement('form');
        var input = document.createElement('input');

        form.action = action_url;
        form.method = 'POST';
        form.enctype = 'multipart/form-data';
        form.target = 'ifr_' + random_id;
        ele_container.appendChild(form);

        input.name = '_file';
        input.type = 'file';
        input.accept = accept || '*';

        form.appendChild(input);

        input.onchange = function(){
            //存在文件类验证函数则调用
            if( angular.isObject(callback) && callback.hasOwnProperty('change') ){
                //验证函数返回false则不提交表单
                if(!callback.change(input.files)) return;
            }
            form.submit();
        };

        iframe.onload = function(){
            var ifr_doc = iframe.contentDocument || iframe.contentWindow.document;
            var res = JSON.parse(ifr_doc.body.innerHTML);
            ele_container.remove();
            if( angular.isObject(callback) && callback.hasOwnProperty('success') ){
                callback.success(res);
            }else if( angular.isFunction(callback) ){
                callback(res);
            }
        };

        return {
            form: form,
            input: input,
            iframe: iframe
        }

    }

    return {
        upload: function(url, accept, callback){
            var elements = make_element(url, accept, callback);
            var input = elements['input'];
            angular.element(input).trigger('click');
        }
    }
}]);

app.factory('date', function(){
    return function(){
        var now = new Date();
        return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();
    }
});

/* 指令 */
app.directive('imChat', function(){
    return {
        scope: {
            ngModel: '&'
        },
        controllerAs: 'imChatController',
        controller: ['$scope', function($scope){
            $scope.user = {};
        }],
        link: function(scope, iElement, iAttrs){
            console.log(iElement);
        }
    }
});

app.directive('imChattingBox', function(){
    if(!window.jQuery) throw new Error('directive imMsgEditor require jquery');
    return {
        scope: true,
        controller: ['$scope', 'upload', 'date', function($scope, upload, date){
            //var api_host = 'http://api.alhelp.net';
            var api_host = 'http://localhost:8850';
            var redirect_url = encodeURIComponent('http://127.0.0.1:5000/upload_callback/{data}');

            this.upload_file = function(callback){
                var url = api_host + '/v1/upload/file?uid=' + $scope.user.id + '&redirect_url=' + redirect_url;
                upload.upload(url, '*', callback);
            }

            this.upload_image = function(callback){
                var url = api_host + '/v1/upload/image/new?uid=' + $scope.user.id + '&redirect_url=' + redirect_url;
                upload.upload(url, 'image/*', callback);
            };

            this.upload_audio = function(callback){
                var url = api_host + '/v1/upload/audio?uid=' + $scope.user.id + '&redirect_url=' + redirect_url;
                upload.upload(url, 'audio/*', callback);
            };

            this.date = date;
        }],
        require: 'imChattingBox',
        link: function(scope, element, attr, ctrl){
            var msg_show_box = element.find('.msg-show-box');
            var font_setting_btn = element.find('.font-setting');
            var emo_setting_btn = element.find('.emo-setting');
            var file_send_btn = element.find('.file-send');
            var image_send_btn = element.find('.image-send');
            var emo_layer = element.find('.emo-layer');
            var msg_box = element.find('.msg-box'); //原始消息编辑窗
            var new_msg_box = angular.element('<iframe>'); //实现副文本的消息编辑窗
            new_msg_box.attr('class', msg_box.attr('class'));
            msg_box.replaceWith(new_msg_box);

            //设置iframe编辑模式
            var ifr = new_msg_box[0];
            var ifr_doc = ifr.contentDocument || ifr.contentWindow.document;
            ifr_doc.designMode = 'on';
            ifr_doc.contentEditable = true;
            //打开FF编辑模式需要自建html标签
            //angular.element(ifr_doc).append('<html><head></head><body></body></html>');
            ifr_doc.open();
            var inner_style = '<style>*{margin: 0px; border: 0px; padding: 0px; font-size: 14px;}body{width: 100%; height:100%; word-wrap:break-word; word-break: break-all;}</style>';
            ifr_doc.writeln('<html><head>' + inner_style +'</head><body></body></html>');
            ifr_doc.close();
            ifr_doc.body.innerHTML = ''; //清空iframe中body的默认html

            font_setting_btn.on('click', function(event){
                ifr_doc.execCommand('Bold', false, null);
            });

            file_send_btn.on('click', function(event){
                var tmp_msg = {
                    from_member_id: scope.user.id,
                    avatar: scope.user.avatar,
                    content: '文件正在上传...',
                    add_time: ctrl.date()
                };
                ctrl.upload_file({
                    change: function(files){
                        scope.chatting_user.history.push(tmp_msg);
                        scope.$apply();
                        return true;
                    },
                    success: function(res){
                        if(res.success == false) {
                            tmp_msg.content = res.message; //显示错误信息
                            scope.$apply();
                            return;
                        }
                        var file_data = res.data[0];
                        console.log(file_data);
                        var index = scope.chatting_user.history.indexOf(tmp_msg);
                        scope.chatting_user.history.splice(index, 1);
                        scope.sendFile(file_data);
                        scope.$apply();
                    }
                });
            });

            image_send_btn.on('click', function(event){
                var tmp_msg = {
                    from_member_id: scope.user.id,
                    name: scope.user.nickname,
                    avatar: scope.user.avatar,
                    content: '图片正在上传...',
                    add_time: ctrl.date()
                };
                ctrl.upload_image({
                    change: function(files){
                        scope.chatting_user.history.push(tmp_msg);
                        scope.$apply();
                        return true;
                    },
                    success: function(res){
                        if(res.success == false) {
                            tmp_msg.content = res.message; //显示错误信息
                            scope.$apply();
                            return;
                        }
                        var image_data = res.data[0];
                        var index = scope.chatting_user.history.indexOf(tmp_msg);
                        scope.chatting_user.history.splice(index, 1);
                        scope.sendImage(image_data);
                        scope.$apply();
                    }
                });
            });

            emo_layer.on('click', '.emo-item', function(event){
                var src = angular.element(this).find('img').attr('src');
                ifr_doc.execCommand('insertImage', false, src);
            });

            //表情图票数据
            scope.emos = [];
            for(var i = 1; i <= 49; i++){
                scope.emos.push(10000 + i);
            }

            //监控chatting_user.history的变化,true表示深度监控,为了监控数组元素的变化
            scope.$watch('chatting_user.history', function(value){
                //实时滚动,setTimeout,解决消息渲染和滚动顺序的问题,保证最后才滚动
                setTimeout(function(){
                    //新的内部元素实际高度
                    var scroll_top = msg_show_box.find('.msg-container').height();
                    msg_show_box.scrollTop(scroll_top);
                }, 0);
            }, true);

            var orig_send_msg = scope.sendMsg;
            //发送消息
            scope.sendMsg = function(){
                var msg = ifr_doc.body.innerHTML;
                if(!msg) return;
                ifr_doc.body.innerHTML = '';
                orig_send_msg.call(scope, msg);
            };

        }
    }
});

/* 过滤器 */

//安全filter避免html被转义
app.filter('safe', ['$sce', function($sce){
    return function(text){
        return $sce.trustAsHtml(text);
    };
}]);

/* 控制器 */

app.controller('MainController', ['$scope', 'sio', function($scope, sio){
    $scope.app_ready = false;
    sio.on('connect', function(){
        $scope.app_ready = true;
        $scope.$apply();
    });

    $scope.user = null;
    $scope.chatting = false; //有聊天对象
    $scope.chatting_user = {};

    $scope.setUser = function(user_info){
        $scope.user = user_info;
    };

    /**
     * 设置正在与之聊天的用户
     * @param user_info 用户信息
     * @param type 用户类型 group:群 single:用户
     */
    $scope.setChattingUser = function(user_info, type){
        $scope.chatting = true;
        $scope.chatting_user = $scope.chatting_user || {};
        $scope.chatting_user.id = user_info.contact_id || user_info.member_id || user_info.id;
        $scope.chatting_user.name = user_info.name;
        $scope.chatting_user.avatar = user_info.avatar || user_info.image;
        $scope.chatting_user.type = type;

        var key = type == 'single' ? '0' + '_' + $scope.chatting_user.id : '1' + '_' + $scope.chatting_user.id;

        if($scope.rct_contacts_map[key]){
            $scope.rct_contacts_map[key].no_read_count = 0;
            $scope.rct_contacts_map[key].history =  $scope.rct_contacts_map[key].history || [];
            $scope.chatting_user.history = $scope.rct_contacts_map[key].history;
        }else{
            $scope.chatting_user.history = [];
        }

        if($scope.chatting_user.history.length == 0){
            //获取未读信息
            sio.emit('get_no_read_msg', {type: $scope.chatting_user.type, from_id: $scope.chatting_user.id});
        }

        //读取未读消息成功后,标记消息为已读
        $scope.markReadMsg($scope.chatting_user.type, $scope.chatting_user.id);
    };

    $scope.rct_contacts = null;

    /**
     * 设置最近联系人
     * @param contacts
     */
    $scope.setRctContacts = function(contacts){
        $scope.rct_contacts = [];
        $scope.rct_contacts_map = {};
        angular.forEach(contacts, function(value, key){
            $scope.rct_contacts.push(value);
            $scope.rct_contacts_map[value.is_to_group + '_' +value.contact_id] = value;
        });
    };

    /**
     * 添加最近联系人
     * @param contact
     * @param msg
     */
    $scope.addRctContact = function(contact, msg){
        var key = contact.is_to_group + '_' + contact.id;

        if(!$scope.rct_contacts_map[key]){
            contact.contact_id = contact.id; //与最近联系人列表元素属性一致
            contact.no_read_count = 0; //初始化未读消息
            $scope.rct_contacts.unshift(contact);
            $scope.rct_contacts_map[key] = contact;
        }

        //更改最近联系人未读消息数
        if(msg.from_member_id != $scope.user.id && $scope.chatting_user && contact.id != $scope.chatting_user.id){
            $scope.rct_contacts_map[key].no_read_count = Number($scope.rct_contacts_map[key].no_read_count) + 1;
        }

        $scope.rct_contacts_map[key].msg_content = msg.content.length > 10 ? msg.content.substr(0, 10) + '...' : msg.content;
        $scope.rct_contacts_map[key].msg_time = contact.msg_time;

        if(msg.mime_type == '1'){
            msg.content = '<img src="' + msg.content + '" width="50px" target="_blank" />';
        }else if(msg.mime_type == '3'){
            msg.content = '<a href="' + msg.content + '" target="_blank">' + '[文件]' + msg.filename +'</a>';
        }

        $scope.rct_contacts_map[key].history && $scope.rct_contacts_map[key].history.push(msg);

        //联系人列表重排序
        $scope.rct_contacts.sort(function(a, b){
            if(Date.parse(a.msg_time) > Date.parse(b.msg_time)){
                return -1;
            }else if(Date.parse(a.msg_time) == Date.parse(b.msg_time)){
                return 0;
            }else{
                return 1;
            }
        });
    };

    /**
     * 标记消息为已读
     * @param type
     * @param from_id
     */
    $scope.markReadMsg = function(type, from_id){
        sio.emit('mark_read_msg', {type: type, from_id: from_id});
    };

    //未读消息响应
    sio.on('res_no_read_msg', function(res){
        if(res.success == false) return;
        console.log(res.data);
        angular.forEach(res.data.list, function(msg, key){
            if(msg.mime_type == '1'){
                msg.content = '<img src="' + msg.content + '" width="50px" />';
            }else if(msg.mime_type == '3'){
                msg.content = '<a href="' + msg.content + '" target="_blank">' + msg.content +'</a>';
            }
            $scope.chatting_user.history.unshift(msg);
        });
    });

}]);

/**
 * 用户控制器
 */
app.controller('UserController', ['$scope', 'sio', function($scope, sio){

    sio.on('res_user_info', function(res){
        if(res.success == false) return;
        $scope.setUser(res.data);
    });

    sio.emit('get_user_info');

}]);

/**
 * 聊天列表控制器
 */
app.controller('ChatListController', ['$scope', 'sio', function($scope, sio){
    $scope.getFriends = function(cache){
        if(cache && $scope.friends) return;
        sio.emit('get_friends');
    };

    $scope.getFollows = function(cache){
        if(cache && $scope.follows) return;
        sio.emit('get_follows')
    };

    $scope.getFans = function(cache){
        if(cache && $scope.fans) return;
        sio.emit('get_fans');
    };

    $scope.getGroups = function(cache){
        if(cache && $scope.groups) return;
        sio.emit('get_groups');
    };

    $scope.getRctContacts = function(cache){
        if(cache && $scope.rct_contacts) return;
        sio.emit('get_rct_contacts');
    };

    sio.on('message', function(msg){
        console.log(msg)
    });

    sio.on('json', function(data){
        console.log(data)
    });

    sio.on('res_friends', function(res){
        if(res.success == false) return;
        $scope.friends = res.data.list || [];
    });

    sio.on('res_follows', function(res){
        if(res.success == false) return;
        $scope.follows = res.data.list || [];
    });

    sio.on('res_fans', function(res){
        if(res.success == false) return;
        $scope.fans = res.data.list || [];
    });

    sio.on('res_groups', function(res){
        if(res.success == false) return;
        $scope.groups = res.data.list || [];
    });

    sio.on('res_rct_contacts', function(res){
        if(res.success == false) return;
        $scope.setRctContacts(res.data.list || []);
    });

    //初始获取好友数据
    $scope.getRctContacts();
    //$scope.getFans();
    //$scope.getFollows();
    //$scope.getGroups();
}]);

/**
 * 聊天控制器
 */
app.controller('ChatController', ['$scope', 'sio', 'date', function($scope, sio, date){

    /**
     * 发送消息
     */
    $scope.sendMsg = function(arg_msg){

        var msg = {
            from_member_id: $scope.user.id,
            name: $scope.user.nickname,
            to_id: $scope.chatting_user.id,
            is_to_group: $scope.chatting_user.type == 'single' ? '0' : '1',
            content: arg_msg,
            mime_type: 0
        };

        var from_contact = {
            id: msg.is_to_group == '1' ? msg.to_id : msg.from_member_id,
            name: msg.is_to_group == '1' ? $scope.chatting_user.name : $scope.user.name,
            avatar: msg.is_to_group == '1' ? $scope.chatting_user.avatar : $scope.user.avatar,
            is_to_group: msg.is_to_group,
            msg_content: msg.content
        };

        var data = {
            msg: msg,
            contact: from_contact
        };

        sio.emit('send', data);

        var now = new Date();

        msg.add_time = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate() + ' ' + now.getHours() + ':' + now.getMinutes() + ':' + now.getSeconds();

        var to_contact = {
            id: $scope.chatting_user.id,
            name: $scope.chatting_user.name,
            avatar: $scope.chatting_user.avatar,
            is_to_group: $scope.chatting_user.type == 'single' ? '0' : '1',
            msg_content: msg.content,
            msg_time: msg.add_time,
            history: $scope.chatting_user.history
        };
        //发送聊天后添加最近联系人或更新最近联系人数据(联系人已存在于列表时)
        $scope.addRctContact(to_contact, msg);
    };

    /**
     * 发送文件
     * @param file
     * @param mime_type
     */
    $scope.sendFile = function(file, mime_type){
        var msg = {
            from_member_id: $scope.user.id,
            name: $scope.user.nickname,
            to_id: $scope.chatting_user.id,
            is_to_group: $scope.chatting_user.type == 'single' ? '0' : '1',
            mime_type: mime_type || '3',
            content: file.url,
            filename: file.name
        };

        var from_contact = {
            id: msg.is_to_group == '1' ? msg.to_id : msg.from_member_id,
            name: msg.is_to_group == '1' ? $scope.chatting_user.name : $scope.user.name,
            avatar: msg.is_to_group == '1' ? $scope.chatting_user.avatar : $scope.user.avatar,
            is_to_group: msg.is_to_group
        };

        if(mime_type == '1'){
            from_contact.msg_content = '[图片]';
        }else if(mime_type == '3'){
            from_contact.msg_content = '[文件]';
        }

        var data = {
            msg: msg,
            contact: from_contact
        };

        sio.emit('send', data);

        msg.add_time = date();

        var to_contact = {
            id: $scope.chatting_user.id,
            name: $scope.chatting_user.name,
            avatar: $scope.chatting_user.avatar,
            is_to_group: $scope.chatting_user.type == 'single' ? '0' : '1',
            msg_time: msg.add_time,
            history: $scope.chatting_user.history
        };

        if(mime_type == '1'){
            to_contact.msg_content = '[图片]';
        }else if(mime_type == '3'){
            to_contact.msg_content = '[文件]';
        }
        //发送聊天后添加最近联系人或更新最近联系人数据(联系人已存在于列表时)
        $scope.addRctContact(to_contact, msg);
    };

    /**
     * 发送图片
     * @param image_file
     */
    $scope.sendImage = function(image_file){
        this.sendFile(image_file, '1');
    };

    //接收消息事件
    sio.on('recv', function(data){
        $scope.addRctContact(data.contact, data.msg);
        var type = data.contact.is_to_group == '0' ? 'single' : 'group';
        if (data.contact.id == $scope.chatting_user.id && type == $scope.chatting_user.type) {
            $scope.markReadMsg(type, data.contact.id);
        }
    })
}]);
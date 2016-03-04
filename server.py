#!/usr/bin/python
# -*- coding=utf-8 -*-
import sys

sys.getdefaultencoding()
reload(sys)
sys.setdefaultencoding('UTF-8')

import urllib2
import json
import re
from flask import Flask, g, request, session, render_template, request_finished, template_rendered
from flask_socketio import SocketIO, emit, send
from app import app
import views

sio = SocketIO(app)

online_users = {}

api_host = 'http://api.alhelp.net/'
# api_host = 'http://localhost:8850/'
apis = {
    'get_friends': {
        'need_token': True,
        'url': 'v1/im/friends'
    },
    'add_single_message': {
        'need_token': True,
        'method': 'POST',
        'url': 'v1/im/message/single/516',
        'data': {
                    'mime_type': 0,
                    'content': 'haha'
                }
    },
    'add_group_message': {
        'need_token': True,
        'method': 'POST',
        'url': 'v1/im/message/group/29',
        'data': {
            'mime_type': 0,
            'content': '一条大于十个字的消息会被哈哈'
        }
    },
    'get_no_read_msg': {
        'need_token': True,
        'url': 'v1/im/message/no_read',
        'method': 'GET',
        'data': None
    },
    'get_no_read_msg_total': {
        'need_token': True,
        'url': 'v1/im/message/no_read_total',
        'method': 'GET',
        'data': None
    },
    'mark_read_msg': {
        'need_token': True,
        'url': 'v1/im/message/mark_read/single/516',
        'method': 'PUT',
        'data': None
    },
    'get_single_history': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/im/message/history/single/516',
        'data': None
    },
    'get_group_history': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/im/message/history/group/29',
        'data': None
    },
    'get_rct_contacts': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/im/message/rct_contacts?uid=13653',
        'data': None
    },
    'add_group': {
        'need_token': True,
        'method': 'POST',
        'url': 'v1/im/group',
        'data': {
            'name': '我们的群',
            'image': 'http://api.alhelp.net'
        }
    },
    'delete_group': {
        'need_token': True,
        'method': 'DELETE',
        'url': 'v1/im/group/22',
        'data': None
    },
    'modify_group': {
        'need_token': True,
        'method': 'PUT',
        'url': 'v1/im/group/22',
        'data': {
            'name': '修改过的'
        }
    },
    'get_group': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/im/group/:id',
        'data': None
    },
    'add_group_member': {
        'need_token': False,
        'method': 'POST',
        'url': 'v1/im/group/34/member',
        'data': {
            'member_ids': [130, 131]
        }
    },
    'delete_group_member': {
        'need_token': False,
        'method': 'DELETE',
        'url': 'v1/im/group/22/member',
        'data': {
            'member_ids': [131]
        }
    },
    'get_group_members': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/im/group/34/members',
        'data': None
    },
    'get_groups': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/im/groups?p=1&ps=2',
        'data': {
            'filters': {
                'name': '我们的群'
            }
        }
    },
    'get_demand_collaborate': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/demands/collaborates/4834?page=1',
        'data': None
    },
    'get_talk_by_id': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/talks/50'
    },
    'get_follows': {
        'need_token': True,
        'method': 'GET',
        'url' : 'v1/follow/15034',
        'data': None
    },
    'get_someone_talks_list': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/talks/list/14257',
        'data': None
    },
    'get_master_talks': {
        'need_token': False,
        'method': 'GET',
        'url': 'v1/talks/list/master/page/1',
        'data': None
    },
    'get_follows_talks': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/talks/list/follow',
        'data': None
    },
    'get_all_talks': {
        'need_token': True,
        'method': 'GET',
        'url': 'v1/talks/list',
        'data': {
            'community_id': '2'
        }
    },
    'set_talk_top': {
        'need_token': True,
        'method': 'PUT',
        'url': 'v1/talks/1/top',
        'data': None
    },
    'unset_talk_top': {
        'need_token': True,
        'method': 'PUT',
        'url': 'v1/talks/1/top_off',
        'data': None
    },
    'set_talk_hot': {
        'need_token': True,
        'method': 'PUT',
        'url': 'v1/talks/1/hot',
        'data': None
    },
    'unset_talk_hot': {
        'need_token': True,
        'method': 'PUT',
        'url': 'v1/talks/1/hot_off',
        'data': None
    },
    'set_talk_ann': {
        'need_token': True,
        'method': 'PUT',
        'url': 'v1/talks/1/ann',
        'data': None
    },
    'unset_talk_ann': {
        'need_token': True,
        'method': 'PUT',
        'url': 'v1/talks/1/ann_off',
        'data': None
    },
    'talk_praise': {
        'need_token': True,
        'method': 'PUT',
        'url': 'v1/talks/1/praise',
        'data': None
    },
    'gen_order': {
        'need_token': True,
        'method': 'POST',
        'url': 'v1/order',
        'data': {
            'address_id': '13',
            'items': [
                {
                    'business_id': '5262',
                    'goods': [
                        {
                            'type': 'book',
                            'id': '321',
                            'quantity': 10
                        },
                        {
                            'type': 'book',
                            'id': '322',
                            'quantity': 5
                        }
                    ],
                    'shipping_template_id': '0',
                    'shipping_price': '0.00',
                    'remark': '给卖家的留言'
                },
                {
                    'business_id': '5131',
                    'goods': [
                        {
                            'type': 'book',
                            'id': '151',
                            'quantity': 2
                        }
                    ],
                    'shipping_template_id': '0',
                    'shipping_price': '0.00',
                    'remark': '给卖家的留言'
                }
            ]
        }
    },
    'pay_order': {
        'need_token': True,
        'url': 'v1/order/pay/remain',
        'method': 'PUT',
        'data': {
            'order_ids': [570, 594]
        }
    }
}

token_url = 'http://localhost:8850/v1/tokens'



@app.before_first_request
def before_first_request():
    print 'first_request'


@app.before_request
def before_request():
    print 'before_request'


def request_finished_subscriber(*args, **kwargs):
    # print args, kwargs
    print 'request_finished_signal'

request_finished.connect(request_finished_subscriber, app)


@template_rendered.connect
def template_rendered_subscriber(sender, template, context, **extra):
    # print template
    pass


@sio.on('connect')
def on_connect():
    online_users[session.get('user').get('username')] = request.sid
    send('connect')
    # sio.emit('connected', session.get('user').get('username') + 'is online')


@sio.on('disconnect')
def on_disconnect(*args):
    if hasattr(online_users, session.get('user').get('username')):
        del online_users[session.get('user').get('username')]
        # sio.send(session.get('user').get('username') + 'is offline', include_self=False)


@sio.on('message')
def on_message(msg):
    to_sid = None
    if msg.startswith('@'):
        msg_start = msg.index(':')
        to_nickname = msg[1:msg_start]
        to_sid = online_users.get(to_nickname)
        print online_users
        if not to_sid:
            send(to_nickname + 'is not online')
            return
        else:
            sio.send(session['nickname'] + 'say to your:' + msg[msg_start+1:], room=to_sid)
    else:
        sio.send(session['nickname'] + ':' + msg, room=to_sid)


@sio.on('get_friends')
def get_friends():
    send('get_friends')
    data = api_request('get_friends')
    emit('res_friends', data)


@sio.on('get_groups')
def get_groups():
    send('get_groups')

def api_request(api_name, data=None):
    try:
        api_config = apis.get(api_name)
    except KeyError as e:
        print 'api ' + api_name + ' is not defined\n'

    need_token = api_config['need_token']
    api_url = api_host + api_config['url']

    def repl_callback(match):
        key = match.group(1)
        if data is None: return key
        return str(data.get(key, ''))

    api_url = re.sub(r':([a-zA-Z]+)', repl_callback, api_url)
    print api_url
    api_data = json.dumps(data)
    api_method = api_config.get('method', 'GET')
    api_req = urllib2.Request(api_url, data=api_data)
    api_req.get_method = lambda: api_method
    if need_token is True:
        credential = json.dumps({
            'passwordCredentials': {
                'username': session.get('user').get('username'),
                'password': session.get('user').get('password')
            }
        })
        token_req = urllib2.Request(token_url, data=credential)
        token_res = urllib2.urlopen(token_req)
        token = json.loads(token_res.read())
        api_req.add_header('X-Auth-Token', token['data']['X-Subject-Token'])
    try:
        api_res = urllib2.urlopen(api_req).read()
        res_data = json.loads(api_res)
    except urllib2.URLError as e:
        res_data = {'success': False, 'message': u'请求数据异常'}
    return res_data

if __name__ == '__main__':
    import getopt
    opt, argv = getopt.getopt(sys.argv[1:], 'd')
    from daemon import runner

    if len(opt) > 0 and '-d' in opt[0]:
        sys.argv = [sys.argv[0]] + argv

        app.config['DEBUG'] = False
        class DaemonApp(object):

            def __init__(self):
                self.stdin_path = '/dev/null'
                self.stdout_path = '/var/log/alhelp-im.log'
                self.stderr_path = '/var/log/alhelp-im-err.log'
                self.pidfile_path =  '/var/run/alhelp-im.pid'
                self.pidfile_timeout = 5

            def run(self):
                sio.run(app, host='0.0.0.0')

        daemon_app = DaemonApp()
        daemon_runner = runner.DaemonRunner(daemon_app)
        daemon_runner.do_action()
    else:
        app.config['DEBUG'] = True
        sio.run(app, use_reloader=True, host='0.0.0.0')
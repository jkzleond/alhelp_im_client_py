#!/usr/bin/python
# -*- coding=utf-8 -*-
import sys

sys.getdefaultencoding()
reload(sys)
sys.setdefaultencoding('UTF-8')

import urllib2
import json
import re
from datetime import datetime
from flask import Flask, g, request, session, render_template, request_finished, template_rendered
from flask_socketio import SocketIO, emit, send
from app import app
import views
import im_api

sio = SocketIO(app)

online_users = {}

@app.before_first_request
def before_first_request():
    print 'first_request'


@app.before_request
def before_request():
    print 'before_request'


@app.route('/send_message', methods=['POST'])
def send_message():
    """
    用于客户端发送消息
    :return:
    """
    msg_data = json.loads(request.get_data())
    sid = online_users.get(unicode(msg_data.get('to_id')))
    #print online_users
    #print sid
    if sid is not None:
        sio.send(msg_data, json=True, room=sid)
        return u'消息发送成功'
    else:
        return u'用户不在线'


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
    online_users[session.get('user').get('id')] = request.sid
    send('connect')
    # sio.emit('connected', session.get('user').get('username') + 'is online')


@sio.on('disconnect')
def on_disconnect(*args):
    if hasattr(online_users, session.get('user').get('id')):
        del online_users[session.get('user').get('id')]
        # sio.send(session.get('user').get('username') + 'is offline', include_self=False)

@sio.on_error_default
def error_handler(e):
    print e


@sio.on('auth')
def on_auth():
    pass


@sio.on('message')
def on_message(msg):
    to_sid = None
    if msg.startswith('@'):
        msg_start = msg.index(':')
        to_nickname = msg[1:msg_start]
        to_sid = online_users.get(to_nickname)
        #print online_users
        if not to_sid:
            send(to_nickname + 'is not online')
            return
        else:
            sio.send(session['nickname'] + 'say to your:' + msg[msg_start+1:], room=to_sid)
    else:
        sio.send(session['nickname'] + ':' + msg, room=to_sid)


@sio.on('get_user_info')
def get_user_info():
    send('get_user_info')
    emit('res_user_info', {
        'success': True,
        'data': session.get('user')
    })


@sio.on('get_friends')
def get_friends():
    send('get_friends')
    data = api_request('get_friends')
    emit('res_friends', data)


@sio.on('get_fans')
def get_fans():
    send('get_fans')
    data = api_request('get_fans')
    emit('res_fans', data)


@sio.on('get_follows')
def get_follows():
    send('get_follows')
    data = api_request('get_follows')
    emit('res_follows', data)


@sio.on('get_groups')
def get_groups():
    send('get_groups')
    data = api_request('get_groups', {'uid': session.get('user').get('id')})
    emit('res_groups', data)


@sio.on('get_rct_contacts')
def get_rct_contacts():
    send('get_rct_contacts')
    data = api_request('get_rct_contacts')
    emit('res_rct_contacts', data)


@sio.on('get_no_read_msg')
def get_no_read_msg(req_data):
    send('get_no_read_msg')
    res_data = api_request('get_no_read_msg', req_data)
    emit('res_no_read_msg', res_data)


@sio.on('mark_read_msg')
def mark_read_msg(req_data):
    """
    标记消息为已读
    :param req_data:
    :return:
    """
    res_data = api_request('mark_read_msg', req_data)
    print res_data
    emit('res_mark_read_msg', res_data)


@sio.on('send')
def send_msg(data):
    send('send_msg')
    msg = data.get('msg', {})
    msg_type = 'single' if msg.get('is_to_group', '0') == '0' else 'group'
    mime_type = msg.get('mime_type', '0')
    to_id = msg.get('to_id')
    content = msg.get('content')
    #文件类型消息的文件名
    filename = msg.get('filename')
    res_data = api_request('send_msg', {'msg_type': msg_type, 'to_id': to_id, 'content': content, 'type': 1, 'mime_type': mime_type, 'filename': filename})
    contact = data.get('contact')
    now = datetime.now()
    msg['add_time'] = now.strftime('%Y-%m-%d %H:%M:%S')
    contact['msg_time'] = msg['add_time']
    #发送单人消息
    if contact.get('is_to_group') == '0':
        room = online_users[msg.get('to_id')]
    else:
        room = to_id

    sio.emit('recv', data, room=room)



def api_request(name, data=None):
    token = session.get('token')
    return im_api.api_request(name, data, token)


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
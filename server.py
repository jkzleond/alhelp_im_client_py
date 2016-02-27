import sys

sys.getdefaultencoding()
reload(sys)
sys.setdefaultencoding('UTF-8')

from flask import Flask, g, request, session, render_template, request_finished, template_rendered
from flask_socketio import SocketIO, emit, send
from app import app
import views


sio = SocketIO(app)

online_users = {}


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
    online_users[session['nickname']] = request.sid
    sio.emit('connected', session['nickname'] + 'is online')


@sio.on('disconnect')
def on_disconnect(*args):
    if hasattr(online_users, session['nickname']):
        del online_users[session['nickname']]
        sio.send(session['nickname'] + 'is offline', include_self=False)


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


if __name__ == '__main__':
    sio.run(app, use_reloader=True)

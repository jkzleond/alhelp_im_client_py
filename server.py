from flask import Flask, g, request, render_template, request_finished, template_rendered
from flask_socketio import SocketIO, emit, send
from app import app
import views

sio = SocketIO(app)

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
    send('connected')

if __name__ == '__main__':
    sio.run(app, use_reloader=True)

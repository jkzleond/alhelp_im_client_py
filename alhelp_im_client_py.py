from flask import Flask, g, request
from flask_socketio import SocketIO, emit, send

app = Flask(__name__)
sio = SocketIO(app)


@app.route('/')
def hello_world():
    return 'Hello World!'

@app.route('/user/<name>')
def say_hello(name):
    user_agent = request.headers.get('User-Agent')
    return name + ':' + user_agent + '\n'

@sio.on('connect')
def on_connect():
    send('connected')

if __name__ == '__main__':
    sio.run(app, use_reloader=True)

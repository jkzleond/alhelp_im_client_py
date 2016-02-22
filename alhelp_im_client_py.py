from flask import Flask, g, request, render_template
from flask_socketio import SocketIO, emit, send
from flask.ext.sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['DEBUG'] = True
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://alhelp:tSfquCes5UyxAmnU@120.25.161.67:3306/alhelp'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True
sio = SocketIO(app)
db = SQLAlchemy(app)


class Member(db.Model):
    __tablename__ = 'member'
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String)


@app.route('/')
def hello_world():
#   member = db.engine.execute('select * from member').fetchone()
    member = Member.query.order_by('id').first()
    members = Member.query.all()
    return render_template('index.html', word=member.nickname + 'hello world!ha')


@app.route('/user/<name>')
def say_hello(name):
    # user_agent = request.headers.get('User-Agent')
    return render_template('user.html', name=name)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', error=e)


@sio.on('connect')
def on_connect():
    send('connected')

if __name__ == '__main__':
    sio.run(app, use_reloader=True)

from flask import request, session, render_template
from app import app
from models import db, Member


@app.route('/')
def hello_world():
    username = request.args.get('u')
    password = request.args.get('p')
    session['user'] = {'username':username, 'password': password}

    return render_template('index.html')


@app.route('/user/<name>')
def say_hello(name):
    # user_agent = request.headers.get('User-Agent')
    return render_template('user.html', name=name)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', error=e)
from flask import render_template
from app import app
from models import db, Member

@app.route('/')
def hello_world():
#   member = db.engine.execute('select * from member').fetchone()
    member = Member.query.order_by('id').first()
    members = Member.query.all()
    return render_template('index.html', word=member.nickname + 'hello world!ha', members=members)


@app.route('/user/<name>')
def say_hello(name):
    # user_agent = request.headers.get('User-Agent')
    return render_template('user.html', name=name)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', error=e)
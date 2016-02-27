from flask import request, session, render_template
from app import app
from models import db, Member


@app.route('/')
def hello_world():
#   member = db.engine.execute('select * from member').fetchone()
    member_id = request.args.get('uid')
    member = Member.query.order_by('id').filter(Member.id == member_id).first()
    session['nickname'] = member.nickname
    # members = Member.query.all()

    return render_template('index.html', word=member.nickname)


@app.route('/user/<name>')
def say_hello(name):
    # user_agent = request.headers.get('User-Agent')
    return render_template('user.html', name=name)


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', error=e)
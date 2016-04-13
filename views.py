# -*- coding=utf-8 -*-
from flask import request, session, render_template
from app import app
from models import db, Member
import im_api
import base64


@app.route('/')
def home():
    """
    入口页面
    :return:
    """
    username = request.args.get('u')
    password = request.args.get('p')
    token_info = im_api.get_token(username, password)
    session['user'] = token_info.get('member')
    session['token'] = token_info.get('X-Subject-Token')
    return render_template('index2.html')


@app.route('/upload_callback/<data>')
def upload_callback(data):
    """
    用于跨域上传的回调
    :param data:
    :return:
    """
    res_data = base64.b64decode(data)
    return res_data


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html', error=e)
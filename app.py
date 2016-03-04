from flask import Flask, g, request, render_template, request_finished, template_rendered
from contextlib import contextmanager

app = Flask(__name__)
#app.config['DEBUG'] = True
app.config['SECRET_KEY'] = 'BX_12@bt'
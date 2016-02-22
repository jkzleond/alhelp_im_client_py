from app import app
from flask.ext.sqlalchemy import SQLAlchemy


app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://alhelp:tSfquCes5UyxAmnU@120.25.161.67:3306/alhelp'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = True

db = SQLAlchemy(app)

class Member(db.Model):
    __tablename__ = 'member'
    id = db.Column(db.Integer, primary_key=True)
    nickname = db.Column(db.String)
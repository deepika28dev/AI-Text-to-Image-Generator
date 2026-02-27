import os
from datetime import datetime

from flask_sqlalchemy import SQLAlchemy


# ── Database Setup ─────────────────────────────────────────────────────
basedir = os.path.abspath(os.path.dirname(__file__))


class DBConfig:
    """Database configuration for the Flask application."""

    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(basedir, "generations.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False


db = SQLAlchemy()


# ── Database Model ─────────────────────────────────────────────────────
class Generation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    prompt = db.Column(db.Text, nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "prompt": self.prompt,
            "filename": self.filename,
            "image_url": f"/static/generated/{self.filename}",
            "created_at": self.created_at.strftime("%d %b %Y, %I:%M %p"),
        }


def init_db(app):
    """
    Initialize the database with the given Flask app.

    This function assumes that the app has already been configured with
    DBConfig (or equivalent) and will create all tables.
    """
    db.init_app(app)
    with app.app_context():
        db.create_all()


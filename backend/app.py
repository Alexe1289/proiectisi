from flask import Flask, jsonify
from flask_cors import CORS
from models import db

app = Flask(__name__)
CORS(app)  # allow Angular → Flask calls
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

# creates all tables at first run
with app.app_context():
    db.create_all()

@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello from Flask!"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

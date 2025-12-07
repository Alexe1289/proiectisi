from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # allow Angular → Flask calls

@app.route("/api/hello")
def hello():
    return jsonify({"message": "Hello from Flask!"})

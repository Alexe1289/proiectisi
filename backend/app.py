from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import bcrypt
from models import *

app = Flask(__name__)
CORS(app)  # allow Angular → Flask calls
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JWT_SECRET_KEY"] = "verysecretkey1234"

db.init_app(app)
jwt = JWTManager(app)

# creates all tables at first run
with app.app_context():
    db.create_all()

# extract user details from identity
def get_user():
    identity = get_jwt_identity()
    user_id, role = identity.split(":")
    return int(user_id), role

@app.route("/api/register", methods=["POST"])
def register():
    data = request.json
    role = data.get("role")
    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    # hash password using bcrypt
    password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    if role == "client":
        if Client.query.filter_by(email=email).first():
            return jsonify({"msg": "There is already a client account using this email!"}), 400
        user = Client(name=name, email=email, phone=phone, password_hash=password_hash)
    elif role == "provider":
        if Provider.query.filter_by(email=email).first():
            return jsonify({"msg": "There is already a provider account using this email!"}), 400
        user = Provider(name=name, email=email, phone=phone, password_hash=password_hash)
    else:
        return jsonify({"msg": "Role must be 'client' or 'provider'"}), 400
    
    # save if registration is successful
    db.session.add(user)
    db.session.commit()

    access_token = create_access_token(
        identity=f"{user.client_id if role=='client' else user.provider_id}:{role}",
        expires_delta=False
    )

    return jsonify(access_token=access_token)

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    user = Client.query.filter_by(email=email).first()
    role = "client"

    # check if user is a client
    if not user:
        user = Provider.query.filter_by(email=email).first()
        role = "provider"
    
    if not user:
        return jsonify({"msg": "There isn't an account with these credentials"}), 401

    if not bcrypt.checkpw(password.encode("utf-8"), user.password_hash):
        return jsonify({"msg": "Password is incorrect"}), 401
    
    access_token = create_access_token(
        identity=f"{user.client_id if role=='client' else user.provider_id}:{role}",
        expires_delta=False
    )

    return jsonify(access_token=access_token)

@app.route("/api/provider/locations", methods=["POST"])
@jwt_required()
def add_location():
    user_id, role = get_user()

    if role != "provider":
        return jsonify({"msg": "Only providers can add locations!"}), 403

    data = request.json
    name = data.get("name")
    capacity = data.get("capacity")
    description = data.get("description")
    arcgis_feature_id = data.get("arcgis_feature_id")
    address = data.get("address")
    location_type = data.get("location_type")

    if not name or not capacity or not address or not location_type:
        return jsonify({"msg": "Missing required fields!"}), 400

    loc = Location(
        name=name,
        capacity=capacity,
        description=description,
        arcgis_feature_id=arcgis_feature_id,
        address=address,
        location_type=location_type,
        provider_id=user_id
    )

    db.session.add(loc)
    db.session.commit()

    return jsonify({"msg": "Location added", "location_id": loc.location_id})

@app.route("/api/client/locations", methods=["GET"])
@jwt_required()
def get_locations_for_clients():
    user_id, role = get_user()

    if role != "client":
        return jsonify({"msg": "Only clients can access all locations!"}), 403

    locs = Location.query.all()

    result = [
        {
            "location_id": loc.location_id,
            "name": loc.name
        }
        for loc in locs
    ]

    return jsonify(result)

@app.route("/api/client/locations/<int:loc_id>", methods=["GET"])
@jwt_required()
def get_location_details(loc_id):
    user_id, role = get_user()

    if role != "client":
        return jsonify({"msg": "Only clients can view location details!"}), 403

    loc = Location.query.get(loc_id)
    
    if not loc:
        return jsonify({"msg": "Location not found!"}), 404

    result = {
        "location_id": loc.location_id,
        "name": loc.name,
        "capacity": loc.capacity,
        "description": loc.description,
        "arcgis_feature_id": loc.arcgis_feature_id,
        "address": loc.address,
        "location_type": loc.location_type,
        "provider_id": loc.provider_id
    }

    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

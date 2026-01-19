from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from sqlalchemy import and_, not_, exists
import bcrypt
from models import *
from datetime import datetime
from datetime import timedelta

from datetime import datetime, timezone

def parse_utc_to_naive(value: str) -> datetime:
    dt = datetime.fromisoformat(value.replace("Z", "00:00"))
    return dt.astimezone(timezone.utc).replace(tzinfo=None)


app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:4200"}},
    supports_credentials=True,
    allow_headers=["Authorization", "Content-Type"],
    methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
)  # allow Angular → Flask calls
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

    user_data = {
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": role
    }

    return jsonify(access_token=access_token, user=user_data)

@app.route("/api/user/me", methods=["PUT"])
@jwt_required()
def update_user():
    user_id, role = get_user()
    
    data = request.json or {}

    if role == "client":
        user = Client.query.get(user_id)
    elif role == "provider":
        user = Provider.query.get(user_id)
    else:
        return jsonify({"msg": "Invalid role"}), 403

    allowed_fields = {"name", "email", "phone"}

    for field in allowed_fields:
        if field in data:
            # check email
            if field == "email":
                existing = (
                    Client.query.filter_by(email=data[field]).first() if role == "client"
                    else Provider.query.filter_by(email=data[field]).first()
                )
                if existing:
                    if role == "client" and existing.client_id != user_id:
                        return jsonify({"msg": "Email already in use"}), 409
                    elif role == "provider" and existing.provider_id != user_id:
                        return jsonify({"msg": "Email already in use"}), 409
            setattr(user, field, data[field])

    db.session.commit()
    return jsonify({"msg": "User updated successfully"})

@app.route("/api/profile/change-password", methods=["PUT"])
@jwt_required()
def change_password():
    user_id, role = get_user()
    data = request.json or {}
    
    current_password = data.get("currentPassword")
    new_password = data.get("newPassword")

    if not current_password or not new_password:
        return jsonify({"msg": "Missing password fields"}), 400

    if role == "client":
        user = Client.query.get(user_id)
    else:
        user = Provider.query.get(user_id)

    if not bcrypt.checkpw(current_password.encode("utf-8"), user.password_hash):
        return jsonify({"msg": "Current password is incorrect"}), 401

    new_password_hash = bcrypt.hashpw(new_password.encode("utf-8"), bcrypt.gensalt())
    user.password_hash = new_password_hash
    
    db.session.commit()

    return jsonify({"msg": "Password updated successfully"}), 200

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
    price = data.get("price")

    if not name or not capacity or not address or not location_type or not arcgis_feature_id:
        return jsonify({"msg": "Missing required fields!"}), 400
    
    existing_location = Location.query.filter_by(
        arcgis_feature_id=arcgis_feature_id).first()

    if existing_location:
        return jsonify({
            "msg": "A location with this arcgis_feature_id already exists!"
        }), 409

    loc = Location(
        name=name,
        capacity=capacity,
        description=description,
        arcgis_feature_id=arcgis_feature_id,
        address=address,
        location_type=location_type,
        provider_id=user_id,
        price=price
    )

    db.session.add(loc)
    db.session.commit()

    return jsonify({"msg": "Location added"})

@app.route("/api/provider/locations/<string:arcgis_feature_id>", methods=["PUT"])
@jwt_required()
def update_location(arcgis_feature_id):
    user_id, role = get_user()

    if role != "provider":
        return jsonify({"msg": "Only providers can update locations!"}), 403

    loc = Location.query.filter_by(arcgis_feature_id=arcgis_feature_id).first()

    if not loc:
        return jsonify({"msg": "Location not found!"}), 404

    if loc.provider_id != user_id:
        return jsonify({"msg": "You can update only your own locations!"}), 403

    data = request.json or {}

    columns = Location.__table__.columns.keys()

    forbidden_fields = {"location_id", "provider_id", "arcgis_feature_id"}

    for field in columns:
        if field in forbidden_fields:
            continue
        if field in data:
            setattr(loc, field, data[field])

    db.session.commit()

    return jsonify({"msg": "Location updated"})

@app.route("/api/client/locations/available", methods=["GET"])
@jwt_required()
def get_available_locations():
    user_id, role = get_user()

    if role != "client":
        return jsonify({"msg": "Only clients can access locations!"}), 403

    capacity = request.args.get("capacity", type=int)
    location_type = request.args.get("location_type")
    dt = request.args.get("datetime")
    start_dt = request.args.get("start_datetime")
    end_dt = request.args.get("end_datetime")

    query = Location.query

    if capacity is not None:
        query = query.filter(Location.capacity >= capacity)

    if location_type:
        query = query.filter(Location.location_type == location_type)

    if dt:
        day = datetime.fromisoformat(dt)
        start_dt = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = start_dt + timedelta(days=1)

    elif start_dt and end_dt:
        
        start_dt = datetime.fromisoformat(start_dt.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end_dt.replace("Z", "+00:00"))

    else:
        start_dt = end_dt = None


    if start_dt and end_dt:
        conflicting_reservations = (
            db.session.query(Reservation)
            .filter(
                Reservation.location_id == Location.location_id,
                Reservation.start_datetime < end_dt,
                Reservation.end_datetime > start_dt
            )
        )

        query = query.filter(~conflicting_reservations.exists())

    locations = query.all()

    result = [
        {
            "arcgis_feature_id": loc.arcgis_feature_id,
            "name": loc.name,
            "capacity": loc.capacity,
            "description": loc.description,
            "address": loc.address,
            "location_type": loc.location_type
        }
        for loc in locations
    ]

    return jsonify(result)


@app.route("/api/client/locations/<string:arcgis_feature_id>", methods=["GET"])
@jwt_required()
def get_location_details(arcgis_feature_id):   
    user_id, role = get_user()

    if role != "client":
        return jsonify({"msg": "Only clients can view location details!"}), 403

    loc = Location.query.filter_by(arcgis_feature_id=arcgis_feature_id).first()
    
    if not loc:
        return jsonify({"msg": "Location not found!"}), 404

    result = {
        "name": loc.name,
        "capacity": loc.capacity,
        "description": loc.description,
        "arcgis_feature_id": loc.arcgis_feature_id,
        "address": loc.address,
        "location_type": loc.location_type,
        "provider": {
            "name": loc.provider.name,
            "email": loc.provider.email
        }
    }

    return jsonify(result)

@app.route("/api/provider/locations", methods=["GET"])
@jwt_required()
def get_provider_locations():
    user_id, role = get_user()

    if role != "provider":
        return jsonify({"msg": "Only providers can access their locations!"}), 403

    locs = Location.query.filter_by(provider_id=user_id).all()

    result = [
        {
            "arcgis_feature_id": loc.arcgis_feature_id,
            "name": loc.name
        }
        for loc in locs
    ]

    return jsonify(result)

@app.route("/api/client/locations/<string:arcgis_feature_id>/reservations", methods=["POST"])
@jwt_required()
def add_reservation(arcgis_feature_id):
    user_id, role = get_user()

    if role != "client":
        return jsonify({"msg": "Only clients can make reservations!"}), 403

    loc = Location.query.filter_by(arcgis_feature_id=arcgis_feature_id).first()
    if not loc:
        return jsonify({"msg": "Location not found!"}), 404

    data = request.json
    start_datetime = data.get("start_datetime")
    end_datetime = data.get("end_datetime")

    if not start_datetime or not end_datetime:
        return jsonify({"msg": "Missing date interval!"}), 400

    reservation = Reservation(
        client_id=user_id,
        location_id=loc.location_id,
        start_datetime=datetime.fromisoformat(start_datetime.replace("Z", "+00:00")),
        end_datetime=datetime.fromisoformat(end_datetime.replace("Z", "+00:00")),
        price_offer=data.get("price_offer"),
        guest_count=data.get("guest_count"),
        status='pending',
        created_at=datetime.utcnow()
    )

    db.session.add(reservation)
    db.session.commit()

    return jsonify({"msg": "Reservation created", "reservation_id": reservation.reservation_id})

@app.route("/api/reservations/<int:reservation_id>", methods=["PUT"])
@jwt_required()
def update_reservation_details(reservation_id):
    user_id, role = get_user()
    
    reservation = Reservation.query.get(reservation_id)
    if not reservation:
        return jsonify({"msg": "Reservation not found!"}), 404

    data = request.json

    # Modify details as cliect
    if role == "client":
        if reservation.client_id != user_id:
            return jsonify({"msg": "You can only edit your own reservations!"}), 403
        
        if reservation.status != 'pending':
            return jsonify({"msg": "Cannot edit a reservation that is already accepted or rejected!"}), 400

        if "start_datetime" in data:
            reservation.start_datetime = datetime.fromisoformat(data["start_datetime"].replace("Z", "+00:00"))
        if "end_datetime" in data:
            reservation.end_datetime = datetime.fromisoformat(data["end_datetime"].replace("Z", "+00:00"))
        if "price_offer" in data:
            reservation.price_offer = data["price_offer"]
        if "guest_count" in data:
            reservation.guest_count = data["guest_count"]

    # Accept/reject offer
    elif role == "provider":
        if reservation.location.provider_id != user_id:
            return jsonify({"msg": "Access denied!"}), 403
        
        if "status" in data:
            reservation.status = data["status"]

    else:
        return jsonify({"msg": "Invalid role"}), 403

    db.session.commit()
    return jsonify({"msg": "Reservation updated successfully", "reservation_id": reservation_id})

@app.route("/api/reservations/<int:reservation_id>/delete", methods=["DELETE"])
@jwt_required()
def delete_reservation(reservation_id):
    user_id, role = get_user()

    reservation = Reservation.query.get(reservation_id)
    
    if not reservation:
        return jsonify({"msg": "Reservation not found"}), 404

    if role != "client" or reservation.client_id != user_id:
        return jsonify({"msg": "Unauthorized. You can only delete your own requests."}), 403

    db.session.delete(reservation)
    db.session.commit()
    
    return jsonify({"msg": "Reservation deleted successfully"})

@app.route("/api/reservations", methods=["GET"])
@jwt_required()
def get_reservations():
    user_id, role = get_user()

    if role == "client":
        reservations = Reservation.query.filter_by(client_id=user_id).all()

        result = [
            {
                "reservation_id": r.reservation_id,
                "status": r.status,
                "price_offer": r.price_offer,
                "guest_count": r.guest_count,
                "location": {
                    "arcgis_feature_id": r.location.arcgis_feature_id,
                    "name": r.location.name
                },
                "provider": {
                    "provider_id": r.location.provider.provider_id,
                    "name": r.location.provider.name,
                    "email": r.location.provider.email
                },
                "start_datetime": r.start_datetime.isoformat(),
                "end_datetime": r.end_datetime.isoformat(),
                "created_at": r.created_at.isoformat()
            }
            for r in reservations
        ]

        return jsonify(result)

    elif role == "provider":
        reservations = (
            Reservation.query
            .join(Location)
            .filter(Location.provider_id == user_id)
            .all()
        )

        result = [
            {
                "reservation_id": r.reservation_id,
                "location": {
                    "arcgis_feature_id": r.location.arcgis_feature_id,
                    "name": r.location.name
                },
                "client": {
                    "client_id": r.client.client_id,
                    "name": r.client.name,
                    "email": r.client.email
                },
                "status": r.status,
                "price_offer": r.price_offer,
                "guest_count": r.guest_count,      
                "start_datetime": r.start_datetime.isoformat(),
                "end_datetime": r.end_datetime.isoformat(),
                "created_at": r.created_at.isoformat()
            }
            for r in reservations
        ]

        return jsonify(result)

    return jsonify({"msg": "Invalid role"}), 403

@app.route("/api/provider/locations/<string:arcgis_feature_id>/reservations", methods=["GET"])
@jwt_required()
def get_reservations_for_location(arcgis_feature_id):
    user_id, role = get_user()

    if role != "provider":
        return jsonify({"msg": "Only providers can access this!"}), 403

    loc = Location.query.filter_by(arcgis_feature_id=arcgis_feature_id).first()
    if not loc:
        return jsonify({"msg": "Location not found!"}), 404

    if loc.provider_id != user_id:
        return jsonify({"msg": "You can access only your own locations!"}), 403

    reservations = Reservation.query.filter_by(location_id=loc.location_id).all()

    result = [
        {
            "reservation_id": r.reservation_id,
            "client": {
                "client_id": r.client.client_id,
                "name": r.client.name,
                "email": r.client.email
            },
            "status": r.status,
            "price_offer": r.price_offer,
            "guest_count": r.guest_count,
            "start_datetime": r.start_datetime.isoformat(),
            "end_datetime": r.end_datetime.isoformat(),
            "created_at": r.created_at.isoformat()
        }
        for r in reservations
    ]

    return jsonify(result)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Client(db.Model):
    __tablename__ = "clients"

    client_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(50), nullable=True)
    password_hash = db.Column(db.LargeBinary, nullable=False)

class Provider(db.Model):
    __tablename__ = "providers"

    provider_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    phone = db.Column(db.String(50), nullable=False)
    password_hash = db.Column(db.LargeBinary, nullable=False)

class Location(db.Model):
    __tablename__ = "locations"

    location_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text, nullable=True)
    arcgis_feature_id = db.Column(db.String(255), nullable=True)
    address = db.Column(db.String(255), nullable=False)
    location_type = db.Column(db.String(100), nullable=False)

    provider_id = db.Column(db.Integer, db.ForeignKey('providers.provider_id'), nullable=False)

    # relationship for easy access to provider details
    provider = db.relationship('Provider', backref=db.backref('locations', lazy=True))


class Reservation(db.Model):
    __tablename__ = "reservations"

    reservation_id = db.Column(db.Integer, primary_key=True)
    client_id = db.Column(db.Integer, db.ForeignKey('clients.client_id'), nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.location_id'), nullable=False)

    start_datetime = db.Column(db.DateTime, nullable=False)
    end_datetime = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    client = db.relationship('Client', backref=db.backref('reservations', lazy=True))
    location = db.relationship('Location', backref=db.backref('reservations', lazy=True))

    price_offer = db.Column(db.Float, nullable=True)
    guest_count = db.Column(db.Integer, nullable=True)

    status = db.Column(db.String(20), nullable=False, default='pending')
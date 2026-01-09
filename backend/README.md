# Backend Flask API

This backend provides authentication, location management and reservation handling for clients and providers using Flask, JWT and SQLite.

## Setup

Run the provided script for your OS (the scripts already install dependencies and start the server):

- On Windows: `run_backend.bat`
- On Linux/macOS: `run_backend.sh`

The server listens on `http://localhost:5001`.

---

## Main endpoints

### 1. POST /api/register
- Description: Register a new user (client or provider).
- Request body (JSON):
```json
{
    "role": "client" | "provider",
    "name": "string",
    "email": "string",
    "phone": "string",
    "password": "string"
}
```
- Responses:
    - 200: `{ "access_token": "..." }`
    - 400: error message


### 2. POST /api/login
- Description: Authenticate a user.
- Request body (JSON):
```json
{
    "email": "string",
    "password": "string",
    "role": "client" | "provider"
}
```
- Responses:
    - 200: `{ "access_token": "..." }`
    - 400/401: error message


### 3. POST /api/provider/locations (JWT required)
- Description: Add a new location (provider only).
- Request body (JSON):
```json
{
    "name": "string",
    "capacity": int,
    "description": "string",
    "arcgis_feature_id": "string",
    "address": "string",
    "location_type": "string"
}
```
- Responses:
    - 200: `{ "msg": "Location added"}`
    - 400/403/409: error message


### 4. PUT /api/provider/locations/<arcgis_feature_id> (JWT required)
- Description: Update a location (provider only, own locations only).
- Request body (JSON): any editable location fields (e.g. `name`, `capacity`, `description`, `address`, `location_type`).
- Responses:
    - 200: `{ "msg": "Location updated"}`
    - 403/404: error message


### 5. DELETE /api/provider/locations/<arcgis_feature_id> (JWT required)
- Description: Delete a location (provider only, own locations only).
- Responses:
    - 200: `{ "msg": "Location deleted successfully" }`
    - 403/404: error message


### 6. GET /api/provider/locations (JWT required)
- Description: List locations owned by the authenticated provider.
- Example response (200):
```json
[
    {
        "arcgis_feature_id": "ABC123",
        "name": "Community Hall"
    },
    {
        "arcgis_feature_id": "XYZ789",
        "name": "City Sports Center"
    }
]
```
- 403: error message


### 7. GET /api/client/locations (JWT required)
- Description: List all locations (for clients).
- Example response (200):
```json
[
    {
        "arcgis_feature_id": "ABC123",
        "name": "Community Hall"
    },
    {
        "arcgis_feature_id": "XYZ789",
        "name": "City Sports Center"
    }
]
```
- 403: error message


### 8. GET /api/client/locations/<arcgis_feature_id> (JWT required)
- Description: Return location details (for clients).
- Example response (200):
```json
{
    "name": "Community Hall",
    "capacity": 120,
    "description": "A nice hall for community events.",
    "arcgis_feature_id": "ABC123",
    "address": "123 Main St, City",
    "location_type": "hall",
    "provider": {
        "name": "Provider Name",
        "email": "provider@example.com"
    }
}
```
- 403/404: error message


### 9. POST /api/client/locations/<arcgis_feature_id>/reservations (JWT required)
- Description: Create a reservation for a location (client only).
- Request body (JSON):
```json
{
    "start_datetime": "YYYY-MM-DDTHH:MM:SS",
    "end_datetime": "YYYY-MM-DDTHH:MM:SS"
}
```
- Example response (200):
```json
{
    "msg": "Reservation created",
    "reservation_id": 10
}
```
- 400/403/404: error message


### 10. GET /api/reservations (JWT required)
- Description: List reservations relevant to the authenticated user.
    - For `client`: returns the client's own reservations.
    - For `provider`: returns reservations for the provider's locations.

**Example response for a client (200):**
```json
[
    {
        "reservation_id": 10,
        "location": {
            "arcgis_feature_id": 1,
            "name": "Community Hall"
        },
        "provider": {
            "provider_id": 5,
            "name": "Provider Name",
            "email": "provider@example.com"
        },
        "start_datetime": "2025-12-20T10:00:00",
        "end_datetime": "2025-12-20T12:00:00",
        "created_at": "2025-12-01T08:30:00"
    }
]
```

**Example response for a provider (200):**
```json
[
    {
        "reservation_id": 11,
        "location": {
            "arcgis_feature_id": 2,
            "name": "City Sports Center"
        },
        "client": {
            "client_id": 12,
            "name": "Client Name",
            "email": "client@example.com"
        },
        "start_datetime": "2025-12-22T14:00:00",
        "end_datetime": "2025-12-22T16:00:00",
        "created_at": "2025-12-02T09:15:00"
    }
]
```

### 11. GET /api/provider/locations/<arcgis_feature_id>/reservations (JWT required)
- Description: List reservations for a specific location (provider only, own locations only).
- Example response (200):
```json
[
    {
        "reservation_id": 11,
        "client": {
            "client_id": 12,
            "name": "Client Name",
            "email": "client@example.com"
        },
        "start_datetime": "2025-12-22T14:00:00",
        "end_datetime": "2025-12-22T16:00:00",
        "created_at": "2025-12-02T09:15:00"
    }
]
```

### 11. GET /api/client/locations/available (JWT required)
- Description: Returns locations but filtered, you can filter by: `capacity` (you insert a minimum value), `location_type`, `datetime` (insert a specific day), `start_datetime` and `end_datetime` (insert day and hour for both ends) (client only).
- FYI: <B> datetime has priority over interval </B>
- Example full input:
```
/api/client/locations/available?
capacity=50&
location_type=conference&
datetime=2026-01-10&
start_datetime=2026-01-10T10:00&
end_datetime=2026-01-10T14:00
```
- Response is identitical with `GET /api/client/locations`
---

> All endpoints marked with JWT require an `Authorization: Bearer <token>` header.

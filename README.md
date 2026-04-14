# Profile Classification API

A backend service built with NestJS that integrates multiple external APIs, processes demographic data, stores results in a PostgreSQL database, and exposes a REST API for managing profiles.

---

## 🚀 Features

- Accepts a name and generates profile data using external APIs
- Integrates:
  - [Genderize API](https://genderize.io)
  - [Agify API](https://agify.io)
  - [Nationalize API](https://nationalize.io)
- Stores processed profiles in PostgreSQL
- Prevents duplicate entries (idempotency)
- Supports filtering, retrieval, and deletion
- Strict error handling with standardized responses
- CORS enabled for external access

---

## 🏗️ Tech Stack

| Layer         | Technology      |
| ------------- | --------------- |
| Framework     | NestJS          |
| ORM           | TypeORM         |
| Database      | PostgreSQL      |
| HTTP Client   | Axios           |
| ID Generation | UUID v7         |
| Validation    | Class-validator |

---

## 📡 Base URL

```
https://check-name-gender2.vercel.app/
```

---

## 📌 API Endpoints

### 1. Create Profile

**`POST /api/profiles`**

Creates a profile using external APIs and stores it in the database.

**Request Body**

```json
{
  "name": "ella"
}
```

**Success Response `201`**

```json
{
  "status": "success",
  "data": {
    "id": "uuid-v7",
    "name": "ella",
    "gender": "female",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 46,
    "age_group": "adult",
    "country_id": "US",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

**Duplicate Name Response `200`**

```json
{
  "status": "success",
  "message": "Profile already exists",
  "data": { "...existing profile" }
}
```

**Error Responses**

| Status | Description          | Response                                                                           |
| ------ | -------------------- | ---------------------------------------------------------------------------------- |
| `400`  | Bad Request          | `{ "status": "error", "message": "Name is required" }`                             |
| `422`  | Unprocessable Entity | `{ "status": "error", "message": "Name must contain only alphabetic characters" }` |
| `502`  | External API Failure | `{ "status": "502", "message": "Genderize returned an invalid response" }`         |

---

### 2. Get Single Profile

**`GET /api/profiles/:id`**

**Success Response**

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "name": "emmanuel",
    "gender": "male",
    "gender_probability": 0.99,
    "sample_size": 1234,
    "age": 25,
    "age_group": "adult",
    "country_id": "NG",
    "country_probability": 0.85,
    "created_at": "2026-04-01T12:00:00Z"
  }
}
```

**Error Response**

```json
{ "status": "error", "message": "Profile not found" }
```

---

### 3. Get All Profiles

**`GET /api/profiles`**

**Optional Query Parameters**

| Parameter    | Description         |
| ------------ | ------------------- |
| `gender`     | Filter by gender    |
| `country_id` | Filter by country   |
| `age_group`  | Filter by age group |

> Filtering is case-insensitive.

**Example**

```
GET /api/profiles?gender=male&country_id=NG
```

**Response**

```json
{
  "status": "success",
  "count": 2,
  "data": [
    {
      "id": "id-1",
      "name": "john",
      "gender": "male",
      "age": 30,
      "age_group": "adult",
      "country_id": "NG"
    }
  ]
}
```

---

### 4. Delete Profile

**`DELETE /api/profiles/:id`**

**Success Response**

```
204 No Content
```

**Error Response**

```json
{ "status": "error", "message": "Profile not found" }
```

---

## Business Logic

### Age Group Classification

| Age Range | Group      |
| --------- | ---------- |
| 0 – 12    | `child`    |
| 13 – 19   | `teenager` |
| 20 – 59   | `adult`    |
| 60+       | `senior`   |

### Country Selection

- Uses the Nationalize API
- Selects the country with the highest probability

### Idempotency Rule

If a name already exists in the database:

- A new record is **not** created
- The existing profile is returned

---

## External API Error Handling

If any external API fails or returns invalid data, a `502` response is returned.

| API         | Invalid Condition            |
| ----------- | ---------------------------- |
| Genderize   | `gender: null` or `count: 0` |
| Agify       | `age: null`                  |
| Nationalize | Empty country list           |

**Response**

```json
{
  "status": "502",
  "message": "ExternalApi returned an invalid response"
}
```

---

## CORS

CORS is enabled for all origins:

```
Access-Control-Allow-Origin: *
```

---

## Database

- **Database:** PostgreSQL
- **ORM:** TypeORM
- **Sync:** Auto-synchronization enabled (development)

---

## Running Locally

**1. Install dependencies**

```bash
npm install
```

**2. Set up environment variables**

```env
DATABASE_URL=your_postgres_url
```

**3. Start the development server**

```bash
npm run start:dev
```

---

## Build

```bash
npm run build
```

---

## Deployment

Deployed on vercel

---

## 🧑‍💻 Author

**Name: Hilary Emujede**

**Email: hilaryemujede48@gmail.com**

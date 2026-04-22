# Insighta Labs — Profiles API

A demographic intelligence REST API for querying, filtering, sorting, paginating, and performing natural language searches on user profile data. Built for analytics and segmentation use cases.

---

## Tech Stack

- **Framework**: NestJS
- **ORM**: TypeORM
- **Database**: PostgreSQL
- **HTTP Client**: Axios
- **IDs**: UUID v7

---

## Base URL

```
https://check-name-gender2.vercel.app
```

---

## Features at a Glance

| Feature | Description |
|---|---|
| Profile Creation | Enriches names using genderize.io, agify.io, nationalize.io |
| Advanced Filtering | Multi-criteria AND-logic filtering |
| Sorting | Sort by age, created_at, or gender_probability |
| Pagination | Page/limit controls (max 50 per page) |
| Natural Language Search | Rule-based query parsing (no AI/LLM) |
| Data Seeding | Idempotent seeding of 2026 profile records |

---

## Endpoints

### Get All Profiles

```
GET /api/profiles
```

**Query Parameters**

| Parameter | Type | Description |
|---|---|---|
| `gender` | string | `male` or `female` |
| `country_id` | string | ISO country code (e.g. `NG`) |
| `age_group` | string | `child`, `teenager`, `adult`, `senior` |
| `min_age` | number | Minimum age filter |
| `max_age` | number | Maximum age filter |
| `min_gender_probability` | float | Minimum confidence score for gender |
| `min_country_probability` | float | Minimum confidence score for country |
| `sort_by` | string | `age`, `created_at`, `gender_probability` |
| `order` | string | `asc` or `desc` |
| `page` | number | Page number (default: `1`) |
| `limit` | number | Results per page (default: `10`, max: `50`) |

**Example Request**

```
GET /api/profiles?gender=male&country_id=NG&min_age=25&sort_by=age&order=desc&page=1&limit=10
```

**Success Response**

```json
{
  "status": "success",
  "page": 1,
  "limit": 10,
  "total": 2026,
  "data": [
    {
      "id": "uuid-v7",
      "name": "emmanuel",
      "gender": "male",
      "gender_probability": 0.99,
      "age": 34,
      "age_group": "adult",
      "country_id": "NG",
      "country_name": "Nigeria",
      "country_probability": 0.85,
      "created_at": "2026-04-01T12:00:00Z"
    }
  ]
}
```

---

### Natural Language Search

```
GET /api/profiles/search?q=
```

Parses a plain-English query string into structured filters using rule-based logic — no AI or LLM involved.

**Example Request**

```
GET /api/profiles/search?q=young males from nigeria
```

**Resolved Filters**

```json
{
  "gender": "male",
  "min_age": 16,
  "max_age": 24,
  "country_id": "NG"
}
```

**Supported Query Patterns**

*Gender*

| Phrase | Filter |
|---|---|
| `male` | `gender = male` |
| `female` | `gender = female` |

*Age*

| Phrase | Filter |
|---|---|
| `young` | `min_age = 16, max_age = 24` |
| `teenager` / `teens` | `age_group = teenager` |
| `adult` | `age_group = adult` |
| `senior` | `age_group = senior` |
| `above X` | `min_age = X` |
| `under X` | `max_age = X` |

*Country*

| Phrase | ISO Code |
|---|---|
| `nigeria` | `NG` |
| `kenya` | `KE` |
| `angola` | `AO` |
| `benin` | `BJ` |
| `ghana` | `GH` |

**Error Response** (uninterpretable query)

```json
{
  "status": "error",
  "message": "Unable to interpret query"
}
```

---

### Seed Database

```
POST /api/seed
```

Seeds the database with 2026 profile records from the bundled JSON dataset. Safe to run multiple times — duplicate entries are prevented via name uniqueness checks.

---

## Database Schema

| Field | Type | Description |
|---|---|---|
| `id` | UUID v7 | Primary key |
| `name` | string | Unique full name |
| `gender` | string | `male` or `female` |
| `gender_probability` | float | Gender confidence score |
| `age` | int | Estimated age |
| `age_group` | string | `child`, `teenager`, `adult`, `senior` |
| `country_id` | string | ISO country code |
| `country_name` | string | Full country name |
| `country_probability` | float | Country confidence score |
| `created_at` | timestamp (UTC) | Auto-generated |

---

## Response Format

**Success**

```json
{
  "status": "success",
  ...
}
```

**Error**

```json
{
  "status": "error",
  "message": "description"
}
```

---

## Project Structure

```
src/
 ├── profiles/
 │    ├── profiles.controller.ts
 │    ├── profiles.service.ts
 │    └── profiles.entity.ts
 ├── seed/
 │    ├── seed.controller.ts
 │    ├── seed.service.ts
 │    └── data/
 └── app.module.ts
```

---

## CORS

CORS is enabled globally:

```
Access-Control-Allow-Origin: *
```

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

## Limitations

- Rule-based parsing only — no AI/ML or NLP model
- English-only query support
- Limited country vocabulary (5 predefined mappings)
- Cannot handle ambiguous or conflicting phrases (e.g. `young seniors`)
- Pagination hard-capped at 50 results per page

---

## Notes

- All timestamps are in UTC ISO 8601 format
- UUID v7 is used for all primary keys
- Queries are optimized using TypeORM `QueryBuilder`
- All filters are combinable with AND logic
- Case-insensitive filtering is supported

---

## Deployment

Deployed on vercel

---

## 🧑‍💻 Author

**Name: Hilary Emujede**

**Email: hilaryemujede48@gmail.com**

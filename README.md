# LibroRec

Web app for recommending books. Based on your most enjoyable reads, it suggests what you might like to read next.

## How to run

These commands (in bash/zsh) will run your project locally:

```bash
git clone https://github.com/polemaster/librorec.git
cd librorec
docker compose up --build
```

## Technologies used

#### Backend

- Java Spring Boot
- REST API
- PostgreSQL

#### Frontend

- Angular

#### General

- Docker & Docker Compose
- GitHub Actions (CI / CD)

## Recommendation system

Here are a few options that might be chosen for the underlying recommendation system:

- ML model
- API: e.g. TasteDive API, API League
- Other users like... - Goodreads/Amazon/etc.
- Gemini or other LLM API

# Blog Backend

# BACKEND RÉSZHEZ NE NYÚLJ, MT ADTA 

json-server alapú REST API a Blog Platform projekthez.

## Indítás

```bash
npm install
npm start
```

A szerver a **http://localhost:3001** címen indul el.

## Végpontok

| Metódus | URL             | Jogosultság              |
|---------|-----------------|--------------------------|
| POST    | /api/login      | –                        |
| POST    | /api/logout     | Bearer token             |
| GET     | /api/me         | Bearer token             |
| GET     | /posts          | publikus                 |
| GET     | /posts/:id      | publikus                 |
| POST    | /posts          | adminisztrátor, admin    |
| PUT     | /posts/:id      | adminisztrátor, admin    |
| DELETE  | /posts/:id      | csak admin               |
| GET     | /categories     | publikus                 |

## Felhasználók

| Felhasználónév | Jelszó    | Szerepkör       |
|----------------|-----------|-----------------|
| admin          | admin123  | admin           |
| adminisztrator | jelszo123 | adminisztrator  |

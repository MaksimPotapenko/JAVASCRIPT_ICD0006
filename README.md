# mpotap-javascript

Repository for the JavaScript coursework assignments.

## Public URLs

Assuming the course proxy hostname follows the student id `mpotap`, the deployed apps are available at:

- `https://mpotap.proxy.itcollege.ee/`
- `https://mpotap.proxy.itcollege.ee/a1/`
- `https://mpotap.proxy.itcollege.ee/a2/`
- `https://mpotap.proxy.itcollege.ee/a4/`
- `https://mpotap.proxy.itcollege.ee/a5/`
- `https://mpotap.proxy.itcollege.ee/a6/api/v1/health`
- `https://mpotap.proxy.itcollege.ee/a7/`

If your assigned proxy hostname differs, replace `mpotap` with your actual uni-id/host from `admin.proxy.itcollege.ee`.

## Contents

- `A1/` - Assignment 1, browser task manager in vanilla JavaScript
- `A2/` - Assignment 2, TypeScript migration and feature expansion
- `A4/` - Assignment 4, Vue 3 Todo client with JWT + refresh token auth, router, and Pinia
- `A5/` - Assignment 5, React Todo client with JWT + refresh token auth, Context, and reducers
- `A6/` - Assignment 6, Express.js Todo backend with JWT + refresh token auth
- `A7/` - Assignment 7, Vue Nutikas client implementing both user and organiser flows
- `deploy/` - nginx landing page and server configuration for VPS deployment

## Deployment Setup

This repository is prepared for the course VPS deployment model from the lecture:

- `Dockerfile` builds a single nginx image that serves both assignments
- `docker-compose.yml` exposes the public nginx container on port `80` and runs `A4`, `A5`, `A6`, and `A7` as separate containers behind it
- `.gitlab-ci.yml` deploys on pushes to `main` with `docker compose`
- `deploy/index.html` is the landing page at `/`
- `deploy/nginx.conf` routes `/a1/` and `/a2/` to static folders and reverse-proxies `/a4/`, `/a5/`, `/a6/api/`, and `/a7/` to dedicated containers

## VPS / GitLab Runner Steps

These steps still need to be executed on your VPS because they require your server access:

1. Find your VPS IP in `https://admin.proxy.itcollege.ee/ProxyHosts`.
2. SSH into the VPS: `ssh root@<your_vps_ip>`.
3. Install and register `gitlab-runner` using the course guide: `https://courses.taltech.akaver.com/javascript/lectures/deploy`.
4. Create a project runner in GitLab and use the tag `shared`.
5. Ensure `gitlab.proxy.itcollege.ee` resolves on the VPS. If needed, add `192.168.183.251 gitlab.proxy.itcollege.ee` to `/etc/hosts`.
6. Push this repository to `main` and verify the pipeline under GitLab `Build -> Pipelines`.
7. Confirm the container is running on the VPS with `docker ps`.

## Assignment 1

`A1` is a browser-based task manager that implements:

- CRUD operations
- `localStorage` persistence
- task validation
- commands for `add`, `list`, `update`, `delete`, `filter`, and `search`

See [A1/README.md](A1/README.md) for usage instructions and assignment-specific details.

## Assignment 2

`A2` contains the TypeScript version of the task manager with additional features such as categories, recurrence, dependencies, statistics, and sorting.

The deployed TypeScript app is served from `/a2/` inside the same nginx container.

## Assignment 4

`A4` is a Vue 3 + TypeScript Todo client that targets the local `A6` backend at `/a6/api/v1` and implements:

- JWT login and register flows
- refresh-token based session renewal
- Vue Router route protection
- Pinia stores for auth and Todo state
- CRUD for Todo categories, priorities, and tasks

The deployed Vue app is served at `https://mpotap.proxy.itcollege.ee/a4/` through a separate Docker container proxied by the public nginx container.

## Assignment 5

`A5` is a React + TypeScript Todo client that targets the local `A6` backend at `/a6/api/v1` and implements:

- JWT login and register flows
- refresh-token based session renewal
- React Context state management with reducers
- React Router protected routes without property drilling
- CRUD for Todo categories, priorities, and tasks

The deployed React app is served at `https://mpotap.proxy.itcollege.ee/a5/` through a separate Docker container proxied by the public nginx container.

## Assignment 6

`A6` is an Express.js backend that reimplements the Todo API needed by the Vue and React clients and implements:

- JWT login and register flows
- refresh-token based session renewal
- protected CRUD for Todo categories, priorities, and tasks
- JSON file persistence inside a dedicated Docker volume

The deployed Express API is served at `https://mpotap.proxy.itcollege.ee/a6/api/v1/`, with a health endpoint at `https://mpotap.proxy.itcollege.ee/a6/api/v1/health`.

## Assignment 7

`A7` is a Vue 3 + TypeScript full client app that targets `https://nutikas.akaver.com/api/v1` and implements both Nutikas flows:

- JWT login and register flows
- refresh-token based session renewal
- user flow for contest browsing, team registration, QR-based markings, results, and team track view
- organiser flow for contests, classes, checkpoints, QR print sheets, teams, members, and markings

The deployed Vue app is served at `https://mpotap.proxy.itcollege.ee/a7/`.

## AI Assistance

AI-assisted development evidence is included in:

- `A1/AI_codex.md`
- `A2/AI_codex.md`

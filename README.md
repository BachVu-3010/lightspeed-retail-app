# Getting started

**Important**: Remove the whole section **Getting started** after finishing update the template

## What's this?

This project is a template for raydiant applications integrated with Netlify and CodeShip

## How to use?

1. Create a project from this template, guidance [here](https://docs.github.com/en/github/creating-cloning-and-archiving-repositories/creating-a-repository-from-a-template)

2. Create CodeShip project and Netlify project for the new repository

3. Replace these values in the new repo's source code:

   - `appname` with the project's lowercase app name. E.g. `screenfeed`
   - `AppName` with the project's capitalized app name. E.g. `Screenfeed`
   - `<appname-CodeShipProjectId>` with CodeShip's project ID

4. Create encrypted environment files by:

   - Rename `docker/staging.sample.env` to `docker/staging.env`
   - Rename `docker/prod.sample.env` to `docker/prod.env`
   - Fill the values in the above files.
     - For `RAYDIANT_APP_ID`, generate application IDs for staging app and production app by [this tool](https://www.uuidgenerator.net/version4)
   - Create file `mirainc_<appname>.aes` with aes key from CodeShip settings
   - Run `yarn encryptenv`

---

[![Codeship Status for mirainc/appname](https://app.codeship.com/projects/<appname-CodeShipProjectId>/status?branch=staging)](https://app.codeship.com/projects/<appname-CodeShipProjectId>)

# appname

Description for appname

---

## Properties

| Name       | Type     | Description                    |
| ---------- | -------- | ------------------------------ |
| `duration` | `number` | Manual display time in seconds |

---

## Development

### Prerequisite

1. Install dependencies

   ```bash
   yarn install
   ```

### Export the environment variables (optional)

- **Important:** This step is required for:
  - [Manual deployment](#manual-deployment)
  - [Start local project with staging settings](#start-with-staging-settings)
    - Using staging backend

1. Download the `mirainc_appname.aes` key from [CodeShip](https://app.codeship.com/projects/<appname-CodeShipProjectId>) and copy it to the root directory of this repository.

2. <a name='decrypt-env-vars'></a>Decode the environment files

   ```bash
   yarn decryptenv
   ```

3. <a name='load-env-vars'></a>Load the environment variables

   - Staging

     ```bash
     export $(grep -v '^#' ./docker/staging.env | xargs)
     ```

   - Production (not recommend)

     ```bash
     export $(grep -v '^#' ./docker/prod.env | xargs)
     ```

### Start application

#### Start with local settings

```bash
yarn start
```

#### Start with staging settings

- **Prerequisite:** Need to [decrypt environment variables](#decrypt-env-vars) first.
- For using environment variables of `staging`

```bash
yarn start:staging
```

---

## Testing

### Linter

```bash
yarn lint
```

- This command will run `yarn eslint; yarn prettier`
- **Note:** To fix eslint issues, run `yarn eslint --fix`
- **Note:** To fix prettier issues, run `yarn prettier --write`

### Unit test

```bash
yarn test
```

---

## Deployment

### CI/CD deployment

- Deployment is triggered after merging your PR to specific branches
  - Staging deployement: `origin/staging`
  - Production deployement: `origin/production`

### Manual deployment

- **Prerequisite**: [load the environment variables](#load-env-vars)
- Staging deployment
  ```bash
  yarn deploy:staging
  ```
- Production deployment (not recommend)
  ```bash
  yarn deploy:production
  ```

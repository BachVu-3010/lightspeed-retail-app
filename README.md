[![Codeship Status for mirainc/lightspeed-retail](https://app.codeship.com/projects/27cee078-5f44-4ae5-be97-4ef601c2c608/status?branch=staging)](https://app.codeship.com/projects/27cee078-5f44-4ae5-be97-4ef601c2c608)
[![Netlify Status](https://api.netlify.com/api/v1/badges/c8379e2c-a22f-4516-b9ea-354d0eb5380e/deploy-status)](https://app.netlify.com/sites/raydiant-lightspeed-retail-app/deploys)

# lightspeed-retail

Description for lightspeed-retail

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

1. Download the `mirainc_lightspeed-retail.aes` key from [the CodeShip project](https://app.codeship.com/projects/27cee078-5f44-4ae5-be97-4ef601c2c608/configure) and copy it to the root directory of this repository.

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

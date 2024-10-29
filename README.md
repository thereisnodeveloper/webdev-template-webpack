# webdev Template (webpack)

#### Linter: ESLint

* AirBnB config + a few other tools

#### jsconfig.json

* Type checking & type acquisition
* Uses ESNext, modules enabled

#### type definitions

- `npx typedi `Automatically installs packages + their type definitions
- `npx ts-typie` checks for missing type definitions)

### webpack split config (dev vs. prod)

### Jest

- auto run test on save using `npm run watch`
- made to work with ES6 Modules using Babel (babel.config.cjs, jest.config.cjs)
- made to work with webpack (mock stylesheet and files)
- made to work with browser using `jest-environment-jsdom`

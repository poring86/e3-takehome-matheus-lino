// Tipagem customizada para comandos Cypress
// https://docs.cypress.io/guides/tooling/typescript-support#Types-for-custom-commands

declare namespace Cypress {
  interface Chainable {
    login(email: string, password: string): Chainable<void>;
    switchOrg(orgName: string): Chainable<void>;
  }
}

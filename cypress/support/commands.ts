/// <reference types="cypress" />

// Comando customizado para login
Cypress.Commands.add("login", (email: string, password: string) => {
  cy.visit("/auth/signin");
  cy.get('input[name="email"]').type(email);
  cy.get('input[name="password"]').type(password);
  cy.get('button[type="submit"]').click();
});

// Comando customizado para troca de organização
Cypress.Commands.add("switchOrg", (orgName: string) => {
  cy.get('[data-cy="org-switcher"]').click();
  cy.contains(orgName).click();
});

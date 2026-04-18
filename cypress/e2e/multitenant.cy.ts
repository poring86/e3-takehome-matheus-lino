/// <reference types="cypress" />

describe("Multi-tenant: isolation and organization switch", () => {
  it("should authenticate user and ensure data isolation between organizations", () => {
    // Adjust these values according to your seed/fixtures
    const email = "userA@exemplo.com";
    const password = "senhaSegura123";
    const orgA = "Org A";
    const orgB = "Org B";
    const noteOrgA = "Org A exclusive note";

    // Login
    cy.visit("/auth/signin");
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('button[type="submit"]').click();

    // Ensure in Org A
    cy.contains("button", orgA).click();

    // Create a note in Org A
    cy.visit("/dashboard/notes/new");
    cy.get('input[name="title"]').type(noteOrgA);
    cy.get('textarea[name="content"]').type("Note content for Org A");
    cy.get('button[type="submit"]').click();
    cy.contains(noteOrgA).should("exist");

    // Switch to Org B
    cy.contains("button", orgB).click();
    cy.visit("/dashboard/notes");
    cy.contains(noteOrgA).should("not.exist");

    // Switch back to Org A and validate note access
    cy.contains("button", orgA).click();
    cy.visit("/dashboard/notes");
    cy.contains(noteOrgA).should("exist");
  });
});

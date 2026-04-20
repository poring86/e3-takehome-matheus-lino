-- Migration: Add UNIQUE constraint to organizations.name
ALTER TABLE "organizations" ADD CONSTRAINT organizations_name_unique UNIQUE ("name");

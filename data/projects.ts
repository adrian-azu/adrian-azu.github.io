// OWNER: 02-content-data.md — do not edit from another role
// Stub authored in Wave 0 (role 01) only to keep the tree compiling. Role 02 fills this with the
// four real project repos from Wave 1 onward — see workflow/02-content-data.md Contract out.
import type { Project } from "@/lib/types";

export const projects: Project[] = [
  {
    slug: "xyz-parking-lot",
    title: "XYZ Parking Lot",
    problem:
      "Managing vehicle parking across multiple entrances with real-time available slot tracking and time-based parking duration management",
    architecture:
      "REST API with multiple parking lot endpoints (POST /parking-lot, POST /vehicle/park, POST /vehicle/unpark, POST /parking-lot/find-slots, POST /parking-lot/add-time), modeled with multiple entrances and slots per entrance",
    techChoices: [
      {
        tech: "Node.js + Express",
        why: "Simple, lightweight REST API ideal for stateless parking operations with straightforward request/response patterns",
      },
      {
        tech: "In-memory data structures",
        why: "Sufficient for demo purposes; easy to visualize parking lot state and slot allocation",
      },
    ],
    repoUrl: "https://github.com/adrian-azu/xyz-parking-lot",
  },
  {
    slug: "family-tree-graphql-api",
    title: "Family Tree GraphQL API",
    problem:
      "Querying and managing hierarchical family relationships efficiently without fixed schema constraints, supporting bidirectional relationship traversal (parents, children, ancestors, descendants)",
    architecture:
      "GraphQL API server (Express + express-graphql) backed by MongoDB for flexible schema storage; database model supports Person entities with relationships expressed as document references",
    techChoices: [
      {
        tech: "GraphQL",
        why: "Enables clients to request only the fields needed for family tree traversal; avoids over-fetching in deep relationship queries (e.g., ancestors across 10 generations)",
      },
      {
        tech: "MongoDB + Mongoose",
        why: "Flexible schema allows Person documents to evolve without migrations; document model maps naturally to family relationships",
      },
      {
        tech: "Docker",
        why: "Consistent dev/prod environment and easy local testing without MongoDB installation",
      },
    ],
    repoUrl: "https://github.com/adrian-azu/FamilyTree-GraphQL-API",
  },
  {
    slug: "jotter-be",
    title: "Jotter (Backend)",
    problem:
      "Real-time collaborative note-taking or journaling backend with user authentication and WebSocket support for live updates.",
    architecture:
      "Express REST API with Socket.io for real-time features, MongoDB (Mongoose) for note/journal storage, JWT-based authentication with bcryptjs password hashing, validation with joi",
    techChoices: [
      {
        tech: "Express + Socket.io",
        why: "WebSocket support enables real-time note synchronization and collaboration features without polling",
      },
      {
        tech: "MongoDB + Mongoose",
        why: "Flexible schema for notes and user data; indexed queries for efficient retrieval",
      },
      {
        tech: "JWT + bcryptjs",
        why: "Stateless authentication scales horizontally; bcryptjs provides robust password hashing",
      },
      {
        tech: "AWS EC2 + CodeDeploy",
        why: "Deployed to an EC2 instance via CodeDeploy lifecycle hooks, with pm2 managing the Node process for zero-downtime restarts",
      },
    ],
    repoUrl: "https://github.com/adrian-azu/jotter-be",
  },
  {
    slug: "nestjs-todo-api",
    title: "NestJS Todo API",
    problem:
      "Providing a user-scoped todo management system with secure authentication, allowing users to create, read, update, and delete todos while maintaining data isolation",
    architecture:
      "NestJS modular application with authentication guards (JWT Passport strategy), service layer for business logic, and user-scoped data isolation at the repository level; supports paginated todo listing and individual todo operations",
    techChoices: [
      {
        tech: "NestJS framework",
        why: "TypeScript-first architecture with built-in decorators (guards, pipes, modules), dependency injection, and standardized request/response handling",
      },
      {
        tech: "JWT + Passport",
        why: "Stateless authentication; Passport strategies are battle-tested and composable for future OAuth/social login",
      },
      {
        tech: "Class validators (class-validator)",
        why: "Declarative request DTO validation with automatic error formatting",
      },
    ],
    repoUrl: "https://github.com/adrian-azu/nestjs-todo-api",
  },
];

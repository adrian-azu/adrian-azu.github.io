// OWNER: 02-content-data.md — do not edit from another role
// Stub authored in Wave 0 (role 01) only to keep the tree compiling. Role 02 fills this with the
// real skills categories from Adrian's resume from Wave 1 onward.
import type { SkillGroup } from "@/lib/types";

export const skills: SkillGroup[] = [
  {
    category: "Languages",
    items: ["TypeScript", "JavaScript", "Python", "PHP"],
  },
  {
    category: "Backend",
    items: ["Node.js", "NestJS", "Express.js", "Fastify", "Laravel", "Laravel Lumen"],
  },
  {
    category: "API & Architecture",
    items: ["REST APIs", "GraphQL", "Microservices", "Distributed Systems", "Event-Driven Architecture", "System Design"],
  },
  {
    category: "Databases",
    items: ["PostgreSQL", "MySQL", "MongoDB", "DynamoDB", "Redis"],
  },
  {
    category: "Cloud & Infrastructure",
    items: ["AWS (API Gateway, Lambda, EC2, EKS, App Runner, RDS, DynamoDB, S3, SQS, SNS, EventBridge, CloudWatch, Secrets Manager, Parameter Store, IAM)", "Terraform", "Docker", "Nginx"],
  },
  {
    category: "Messaging & Asynchronous Processing",
    items: ["RabbitMQ", "Apache Kafka"],
  },
  {
    category: "Security & Authentication",
    items: ["AWS IAM", "AWS Cognito", "OAuth", "JWT"],
  },
  {
    category: "Version Control & CI/CD",
    items: ["Git", "GitLab CI/CD", "Bitbucket Pipeline", "Jenkins"],
  },
  {
    category: "Testing & Quality",
    items: ["Jest", "SonarQube", "Postman", "Unit Testing", "Root Cause Analysis"],
  },
  {
    category: "Banking & Fintech",
    items: ["Thought Machine Vault", "Core Banking", "Smart Contracts", "Blockchain"],
  },
  {
    category: "Engineering Practices",
    items: ["Data Migration", "Performance Optimization", "Production Support", "Technical Documentation", "Workflow Automation", "AI-Assisted Development"],
  },
];

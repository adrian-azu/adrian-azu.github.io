// OWNER: 02-content-data.md — do not edit from another role
// Stub authored in Wave 0 (role 01) only to keep the tree compiling. Role 02 fills this with the
// real roles from Adrian's resume from Wave 1 onward — see workflow/02-content-data.md.
import type { Role } from "@/lib/types";

export const experience: Role[] = [
  {
    companySlug: "ubx-philippines",
    title: "Software Engineer, SME & Acting Tech Lead",
    company: "UBX Philippines Corp. (Uniondigital Bank Inc.)",
    window: "Sep 2024 — Present",
    focus:
      "Deposit Tech Domain: architecture, regulatory initiatives, migrations, and production engineering for Savings Accounts and Time Deposits on Thought Machine Vault",
    achievements: [
      "Re-architected account migration processing into a distributed batch pipeline with 100 concurrent workers, increasing throughput 6.7x (2.93 → 19.57 accounts/sec) and reducing estimated runtime for 500K-account migrations from ~47 hours to ~7 hours",
      "Delivered BSP regulatory initiatives including legacy account migrations, dormancy handling, and AFASA implementation, ensuring compliance and production stability",
      "Mentored 8 engineers through architecture reviews, code reviews, and technical knowledge sharing; leveraged AI/LLM tools (Claude) for code review, root-cause analysis, incident documentation, system architecture analysis, and technical writing",
    ],
  },
  {
    companySlug: "singlife-philippines",
    title: "Software Engineer",
    company: "Singlife Philippines",
    window: "May 2023 — Sep 2024",
    focus:
      "Cross-platform backend engineer supporting three internal platforms: CRM tooling, feature enhancements, and knowledge sharing",
    achievements: [
      "Delivered 5+ backend feature enhancements by translating business requirements into production-ready solutions in collaboration with architects",
      "Enhanced internal CRM tooling with 3+ features, reducing user support tickets by 30% and improving user satisfaction",
      "Supported three internal platforms as a cross-platform backend engineer, reducing knowledge silos and improving incident response",
    ],
  },
  {
    companySlug: "octagrowth",
    title: "Backend Developer",
    company: "Octagrowth Inc.",
    window: "Jul 2022 — Feb 2023",
    focus:
      "AWS infrastructure modernization, blockchain optimization, and asynchronous processing",
    achievements: [
      "Led a team of 3 developers in implementing an AWS Cognito-based Single Sign-On (SSO) system, reducing account-creation support overhead",
      "Reduced blockchain API calls by 50% through Redis caching, lowering infrastructure costs and improving NFT retrieval latency by 200ms",
      "Implemented RabbitMQ-based asynchronous mail processing, reducing queue latency by 60% and enabling 3x higher throughput under peak load",
    ],
  },
  {
    companySlug: "gotabrand-global-solutions",
    title: "Backend Developer",
    company: "Gotabrand Global Solutions Inc.",
    window: "Sep 2021 — Jul 2022",
    focus:
      "API modernization and development pipeline automation for food delivery platform",
    achievements: [
      "Led a 2-engineer team in modernizing a food delivery platform into a RESTful API architecture, improving data flow and database models",
      "Automated the development pipeline, reducing build time from 2 hours to 1.2 hours",
    ],
  },
  {
    companySlug: "highly-succeed",
    title: "Backend Developer",
    company: "Highly Succeed Inc.",
    window: "Mar 2021 — Sep 2021",
    focus:
      "RESTful API development, quality assurance, and regression prevention",
    achievements: [
      "Developed and maintained RESTful APIs using Laravel Lumen and AdonisJS for front-end applications",
      "Resolved 95% of QA-identified defects and established a root-cause analysis process that reduced regression rates by 40% in subsequent sprints",
    ],
  },
];

# HospedFree Product

## Status

This document is the product truth for the new HospedFree. It defines the approved direction, not the implementation status. The current repository is an inherited Laravel/React base that still requires a staged domain conversion.

## Platform

web

## Users

The primary users are beginners, students, creators, freelancers and small projects that need to publish a PHP/MySQL website without a credit card or deep hosting knowledge.

They need Portuguese-first guidance, clear limits, safe defaults and an obvious path from account creation to a working site.

## Product purpose

HospedFree helps a person create a hosting account, receive an hsite.top address, publish a site and manage the essential operational tasks from one understandable panel. When the project needs more capacity or professional features, the same customer can move to a paid hosting plan without changing product or identity.

Success means the user can answer three questions at any moment:

1. Is my site online?
2. What should I do next?
3. Which limit or problem needs my attention?

## Offers

### Free hosting

Free hosting is the entry product, not a disposable demo. Its intended capability set includes:

- an hsite.top subdomain;
- PHP and MySQL hosting;
- SSL where the provisioning path supports it;
- guided publishing and application-installation paths;
- access to help and support;
- transparent usage limits.

Exact quotas, application catalog and operational guarantees remain open until provider capabilities and business rules are approved.

### Paid hosting

Paid hosting is a first-class recurring product. It exists for customers who need more resources, capabilities or service than the free plan provides.

- Prices, billing periods, quotas and package names are open decisions.
- The historical R$ 5,90 value found in the old project is not an approved price.
- Upgrade communication must compare real limits and benefits.
- Payment completion and hosting provisioning are separate states.
- Failed provisioning must not silently leave a paid customer without recovery or support.

## Positioning

Hosting that is simple enough to start free and reliable enough to support the next stage of a real project.

HospedFree communicates the customer outcome—publishing and maintaining a website—not the names of infrastructure suppliers. MOFH remains behind an integration adapter and must not be used as public branding.

## Product pillars

- Start free: remove the financial and technical barrier to the first publication.
- Publish with guidance: convert hosting concepts into clear tasks and status.
- Operate with confidence: show domain, SSL, deployment, resource and support state without exposing sensitive data.
- Grow in place: provide honest paid hosting paths when the project needs more.
- Learn while doing: connect contextual help, knowledge articles and support to the task at hand.

## Target capability areas

- authentication and account security;
- free and paid hosting plans;
- hosting account ordering and provisioning;
- hsite.top subdomains and future custom-domain workflows;
- provider adapter, initially compatible with MOFH;
- files, deployment and application-installation entry points;
- databases and operational credentials with secure reveal/copy flows;
- SSL and DNS orchestration;
- billing, invoices and subscription lifecycle for paid hosting;
- support tickets and knowledge base;
- service notifications and operational history;
- admin management, audit and provider diagnostics.

Each capability must be marked implemented only after it exists and is verified in this repository.

## Non-goals

- Publicly marketing MOFH, AMVHost, Bixa, Botble, BeLink or Vebto as part of the HospedFree brand.
- Continuing short links, biolinks, QR Codes or creator-page tooling as HospedFree products.
- Copying source code, secrets, database schemas or insecure patterns from the old HospedFree or Bixa.
- Promising unlimited resources, uptime, instant provisioning or support response times without an approved operational basis.
- Building a separate identity for the paid plan.

## Brand personality

Clear, trustworthy, accessible and practical. HospedFree should feel like a real hosting company that respects beginners, not a generic AI SaaS, a noisy reseller page or an infrastructure console.

The canonical visual rules live in docs/brand-hospedfree.md.

## Experience principles

- Lead with the path to a published site.
- Use plain Portuguese and explain necessary hosting terms in context.
- Show real status, limits and next actions.
- Mask credentials by default and explain security consequences before reveal or reset.
- Preserve customer sites and data through idempotent, reversible operations.
- Treat the free and paid plans with the same care and visual identity.
- Never manufacture testimonials, metrics, plan availability or provider status.

## Accessibility and inclusion

Target WCAG 2.2 AA. All primary workflows must support keyboard navigation, visible focus, adequate contrast, meaningful status text, reduced motion, 44 px touch targets and recovery from errors without losing user input.

The experience must remain understandable for users unfamiliar with DNS, SSL, FTP, deployment and databases. Technical precision is required, but jargon must be explained rather than used as a gate.

## Confirmed decisions

- hsite.top remains the initial free-hosting subdomain.
- MOFH remains the initial provider integration behind an internal adapter.
- Free hosting and recurring paid hosting are both core products.
- Paid prices and limits are not yet defined.
- Inherited links, biolinks and QR Codes are outside target scope.
- docs/brand-hospedfree.md and the existing public/images logo files define the brand.

# Modular CMS Design for 23 Sections

This document defines the system architecture, data model, APIs, admin UI, and workflows to support a modular content management system with 23 independently configurable sections. It emphasizes flexibility, consistency, responsiveness, and performance.

## 1. Overview
- Goal: Allow editors to assemble pages from any subset of 23 section types, each with per-instance settings and content, and manage revisions non-destructively.
- Principles:
  - Uniform section contract for consistent rendering and behavior
  - Per-instance isolation for content and settings
  - Drag-and-drop page builder for intuitive layout control
  - Versioned content with draft/publish workflows
  - SEO-friendly, user-defined URLs and reusable templates

---

## 2. Data Model (Prisma)
These entities extend/coordinate with existing `Section`, `ContentBlock` concepts. New tables:

- Page
  - id (String, uuid)
  - title (String)
  - slug (String, unique, SEO-friendly)
  - status (Enum: DRAFT|PUBLISHED|ARCHIVED)
  - meta (Json) — page-level metadata overrides
  - createdAt, updatedAt

- SectionInstance
  - id (String, uuid)
  - sectionType (Enum: one of 23 types)
  - name (String) — editor-facing label
  - config (Json) — per-instance settings (e.g., layout, colors, responsive rules)
  - createdBy (String, userId)
  - createdAt, updatedAt

- PageSectionInstance
  - id (String, uuid)
  - pageId (String, FK Page)
  - sectionInstanceId (String, FK SectionInstance)
  - region (String) — e.g., `main`, `sidebar`, `footer`, etc.
  - order (Int) — position in layout
  - isVisible (Boolean) — toggled per page
  - overrides (Json) — page-specific overrides for this instance (non-destructive)

- ContentItem
  - id (String, uuid)
  - sectionInstanceId (String, FK SectionInstance)
  - key (String) — field name, e.g., `title`, `body`, `image`
  - type (Enum: TEXT|HTML|MARKDOWN|IMAGE|VIDEO|LIST|JSON)
  - value (Json | String) — content payload
  - createdAt, updatedAt

- ContentVersion
  - id (String, uuid)
  - targetType (Enum: SECTION_INSTANCE|CONTENT_ITEM)
  - targetId (String) — id of SectionInstance or ContentItem
  - snapshot (Json) — full serialized data at save time
  - message (String) — change note
  - status (Enum: DRAFT|PUBLISHED)
  - authorId (String)
  - createdAt

- PageTemplate
  - id (String, uuid)
  - name (String)
  - description (String)
  - layout (Json) — array of { sectionType, config, defaultContent, region, order }
  - createdAt, updatedAt

- MediaAsset (optional; can reuse existing upload approach)
  - id (String, uuid)
  - url (String)
  - type (String/Mime)
  - metadata (Json)
  - createdAt, uploadedBy

- PageUrlHistory (optional)
  - id
  - pageId
  - oldSlug
  - changedAt

Notes:
- Align with existing `Section` enum or registry; `SectionInstance` provides per-instance isolation.
- `PageSectionInstance.overrides` enables non-destructive edits without mutating base instance.
- `ContentVersion` captures audit and restore capability.

---

## 3. Section Contract & Registry
- SectionContract (TypeScript)
  - id: string (section type key)
  - name: string (human-readable)
  - icon: React component (admin UI)
  - defaultConfig: Json
  - fields: Array<{ key, type, label, required, validations }>
  - render(props: { config, content, pageContext }): ReactElement
- SectionRegistry
  - Map of 23 section definitions implementing the contract
  - Used by builder to list available sections and by renderer to resolve components

Benefits:
- Uniform behavior through a common interface
- Consistent responsive properties via `config`
- Declarative fields allow generating forms automatically

---

## 4. APIs (Next.js Route Handlers)
All admin endpoints require authentication and authorization.

Admin:
- GET /api/admin/pages — list pages (filters: status)
- POST /api/admin/pages — create page { title, slug, meta? }
- GET /api/admin/pages/:id — get page with layout and instances
- PATCH /api/admin/pages/:id — update title/meta/status
- PATCH /api/admin/pages/:id/slug — update slug with uniqueness check; write PageUrlHistory
- DELETE /api/admin/pages/:id — archive/remove

- POST /api/admin/pages/:id/sections — add instance to page { sectionType, config?, region, order }
- PATCH /api/admin/pages/:id/sections/:psiId — update { order, region, isVisible, overrides }
- DELETE /api/admin/pages/:id/sections/:psiId — remove from page (instance remains reusable if desired)

- POST /api/admin/section-instances — create base instance { sectionType, name, config }
- PATCH /api/admin/section-instances/:id — update config/name
- DELETE /api/admin/section-instances/:id — delete (with guard if attached to pages)

- GET /api/admin/content/:instanceId — list content items
- POST /api/admin/content/:instanceId — upsert items [{ key, type, value }]

- GET /api/admin/versions?targetType&targetId — list versions
- POST /api/admin/versions — create version { targetType, targetId, snapshot, message, status }
- POST /api/admin/versions/restore — restore to snapshot

- GET /api/admin/templates — list
- POST /api/admin/templates — create
- POST /api/admin/templates/:id/apply — create page from template (with optional slug/title overrides)

Public:
- GET /api/pages/:slug — resolve page layout and content for client-side hydration or static generation

Performance:
- Support partial fetches: `GET /api/pages/:slug?regions=main,sidebar`
- ETags on public endpoints, `Cache-Control` tuned per content volatility

---

## 5. Admin UI: Visual Layout Builder
- Technologies: React, dnd-kit (drag-and-drop), shadcn/ui components
- Key components:
  - SectionPalette: shows 23 section types with search/filter
  - PageCanvas: droppable regions (`main`, `sidebar`, etc.), renders SectionCard instances in order
  - SectionCard: displays section instance with quick actions (duplicate, hide, move, edit)
  - InstanceEditor: auto-generated form from section fields + config
  - ContentEditor: field-specific editors (rich text, markdown, image selector, JSON)
  - VersionPanel: list versions, diff, restore
  - TemplateBar: save current layout as template, apply existing templates
  - PageSettings: URL/SEO/meta controls

- Interactions:
  - Drag section type from palette → drop into canvas → creates SectionInstance and PageSectionInstance
  - Drag reorder within region; drag between regions updates `order` and `region`
  - Toggle visibility per PageSectionInstance
  - Edit content and config per-instance; changes create DRAFT versions automatically
  - Publish flow: publish page and/or instance changes to mark latest versions as PUBLISHED

- Non-destructive editing:
  - Base instance config remains intact; page-specific overrides are stored in `PageSectionInstance.overrides`
  - Content changes create `ContentVersion` entries; restore recovers previous states

---

## 6. Page Creation & URL Management
- Create page: title, slug (validated), optional template
- Slug rules: lowercase, hyphen-separated, no spaces, unique
- Dynamic generation:
  - Pages stored in DB; Next.js `app/(website)/[slug]/page.tsx` renders based on DB lookup (or shared route with runtime fetch)
- Templates:
  - Save current layout; applying template instantiates new `SectionInstance`s (or references) per policy
  - Option to reuse instances or snapshot into new instances to keep isolation

---

## 7. Version Control
- Draft vs Published:
  - Editors work on DRAFT versions, publish when ready
  - Publish action snapshots instance/config/content and marks as PUBLISHED
- Restore:
  - Choose a version to restore; creates a new DRAFT snapshot reproducing that state
- Audit trail:
  - `message` field to describe changes; `authorId` to attribute

---

## 8. Rendering Engine & Uniform Behavior
- SectionRenderer resolves by `sectionType` to component from SectionRegistry
- Props:
  - `config`: merged(base config, page overrides)
  - `content`: aggregated from ContentItems
  - `pageContext`: page-specific metadata
- Responsive:
  - Each section supports responsive config: breakpoint visibility, spacing, typography
  - Use Tailwind utility classes for consistent responsiveness

---

## 9. Performance Optimization
- Server-side rendering for public pages; prefer static generation where content allows
- Cache public page payloads with ETag/Cache-Control and optional Redis layer
- Lazy-load heavy modules (charts, media) via dynamic imports
- Virtualize large lists in admin builder
- Reduce over-fetching via region-scoped queries
- Disable unnecessary link prefetch (`prefetch={false}`) for admin-only routes
- Optimize images: responsive sizes, WebP, CDN headers

---

## 10. Consistency & Responsive Design
- Section contract guarantees:
  - Common lifecycle hooks (load, render, teardown)
  - Common config keys for spacing, colors, typography
  - Accessibility baseline: semantic markup, alt text, keyboard navigation
- Responsive rules:
  - Config-driven breakpoint visibility and sizing
  - Grid-based placements with CSS logical properties

---

## 11. Content Editing Workflows
- Create/edit page:
  1) Create page with slug
  2) Drag sections into canvas; arrange
  3) Edit instance config and content
  4) Save (auto DRAFT version)
  5) Preview
  6) Publish
- Modify content per page:
  - Use `overrides` for page-specific changes; base instance unaffected
- Restore previous state:
  - Open VersionPanel, pick version, restore → new DRAFT

---

## 12. Section Configuration Options (Examples)
- Common:
  - backgroundColor, textColor, spacing, containerWidth
  - showTitle, titleText, alignment
  - breakpointVisibility: { sm: true, md: true, lg: true }
- Section-specific examples:
  - Hero: headline, subheadline, CTA buttons, background image/video
  - NoticeBoard: items[], marquee, emphasis
  - Chart: dataset source, time range, refresh interval
  - Gallery: images[], layout (grid/masonry), lightbox
  - FAQ: entries[], expand behavior
  - Form: fields[], validations, submission endpoint

---

## 13. Page Templates
- Save current page layout to `PageTemplate`
- Apply template:
  - Instantiate instances with default config/content
  - Option to reuse references or clone to new instances (recommended for isolation)

---

## 14. System Architecture
- Next.js App Router + Prisma (PostgreSQL)
- Admin routes for builder and content management
- Public routes render pages by slug via SSR/SSG
- SectionRegistry drives both admin palette and public renderer
- Versioning layer stores snapshots for audit/restore
- Optional Redis cache for public page payloads
- Media upload service backs asset URLs

---

## 15. Implementation Phases
- Phase 1: Data model and basic CRUD APIs (pages, instances, content)
- Phase 2: Admin builder (palette, canvas, reorder, visibility)
- Phase 3: Content editors and versioning
- Phase 4: Templates and publish workflows
- Phase 5: Performance and responsive refinements

---

## 16. Non-Functional Requirements
- Security: role-based access, CSRF protection, input validation
- Reliability: database transactions when moving/ordering sections
- Observability: audit logs, version messages, error tracking
- Scalability: efficient queries, pagination, caching

---

## 17. Appendix: Payload Examples
- Create page:
```json
POST /api/admin/pages
{ "title": "About Us", "slug": "about-us" }
```
- Add section to page:
```json
POST /api/admin/pages/:id/sections
{
  "sectionType": "HERO",
  "region": "main",
  "order": 1,
  "config": { "backgroundColor": "#0b132b", "alignment": "center" }
}
```
- Upsert content:
```json
POST /api/admin/content/:instanceId
[
  { "key": "headline", "type": "TEXT", "value": "Welcome to our site" },
  { "key": "body", "type": "HTML", "value": "<p>We deliver results.</p>" }
]
```
- Save version:
```json
POST /api/admin/versions
{ "targetType": "SECTION_INSTANCE", "targetId": "uuid", "snapshot": {"config": {}}, "message": "Adjusted hero alignment", "status": "DRAFT" }
```

---

## 18. Notes
- This design integrates with existing content blocks while adding per-instance isolation.
- The SectionRegistry pattern ensures uniformity and ease of scaling to additional sections.
# Page checks

Rules version: 0.1.0. Unknown checks are excluded from scoring. Recommendations require page context.

| ID | Category | Weight | Check |
| --- | --- | --- | --- |
| `page-title` | discovery | 2 | Descriptive page title |
| `meta-description` | discovery | 1 | Page summary |
| `canonical-url` | discovery | 2 | Canonical URL |
| `index-directives` | discovery | 3 | Indexing directives |
| `social-preview` | discovery | 1 | Share preview metadata |
| `document-language` | structure | 1 | Declared language |
| `primary-heading` | structure | 2 | Clear primary heading |
| `heading-order` | structure | 1 | Heading hierarchy |
| `main-landmark` | structure | 1 | Main content landmark |
| `extractable-content` | structure | 3 | Extractable HTML content |
| `jsonld-syntax` | semantics | 2 | Structured data JSON syntax |
| `structured-entities` | semantics | 1 | Explicit structured entities |
| `document-identity` | semantics | 1 | Publisher identity signals |
| `image-alternatives` | media | 1 | Image text alternatives |
| `table-headers` | media | 1 | Table semantics |
| `form-labels` | media | 1 | Form field labels |
| `internal-discovery` | links | 1 | Discoverable internal links |
| `link-labels` | links | 1 | Descriptive link labels |
| `crawlable-navigation` | links | 1 | HTML link destinations |
| `author-attribution` | evidence | 1 | Authorship signals |
| `publication-dates` | evidence | 1 | Machine-readable dates |
| `source-links` | evidence | 1 | Supporting source links |
| `http-success` | delivery | 3 | HTTP response status |
| `html-content-type` | delivery | 1 | HTML response type |
| `secure-url` | delivery | 1 | HTTPS page URL |
| `viewport` | delivery | 1 | Responsive viewport |

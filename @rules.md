# Project Rules - Tilburg Woo UI

## Data Source Selection Pattern

### `_source` Parameter Usage

When making API calls to fetch data, the `_source` parameter determines whether to query the database or the Solr index. This is a critical architectural decision that affects data scope and performance.

#### Use `_source=database` for:
- **Beheer (Management) pages** - When you need to manage objects for your specific organization
- **Administrative operations** - Creating, updating, deleting objects
- **Organization-specific data** - Data that belongs to the current user's organization
- **Draft/unpublished content** - Content that hasn't been published yet

**Examples:**
- Object store operations (automatically defaults to `_source=database`)
- Beheer tables and detail pages
- Administrative dashboards
- Content management interfaces

#### Use `_source=index` for:
- **Public search pages** - When you want to search across all published objects
- **Public catalogs** - Displaying published content from all organizations
- **Faceted search** - Filtering and faceting across the full published dataset
- **Public-facing interfaces** - Any interface meant for public consumption

**Examples:**
- Main search page (`/search`)
- Publication catalogs
- Public API endpoints
- Search filters and facets

### Implementation Guidelines

#### Publications Store Pattern
For search-related functionality, explicitly set `_source=index`:

```javascript
// Search results
const fullUrl = `${commongroundApiUrl()}/opencatalogi/api/publications?_source=index&${queryString}`;

// Search facets/filters  
const fullUrl = `${commongroundApiUrl()}/opencatalogi/api/publications?_source=index&${queryString}`;
```

#### Object Store Pattern
The object store automatically defaults to `_source=database` for management operations:

```javascript
// In _constructQueryParams method
const queryParams = {
  _limit: params._limit || params.limit || 20,
  _page: params._page || params.page || 1,
  '_extend[]': '@self.schema',
  _source: 'database', // Always use database as source for management
  ...params,
};
```

### Data Scope Implications

- **Database source** typically contains ~2-4k objects (organization-specific)
- **Index source** contains the full published dataset (~8.5k+ objects)
- **Performance**: Index queries may be faster for search operations due to Solr optimization
- **Permissions**: Database queries respect organization boundaries, index queries show public data

### When in Doubt

- **Management/Admin context** → Use `_source=database`
- **Public/Search context** → Use `_source=index`
- **Organization-specific data** → Use `_source=database`
- **Cross-organization search** → Use `_source=index`

This pattern ensures that:
1. Management interfaces show only relevant organizational data
2. Public interfaces show the complete published catalog
3. Search functionality provides comprehensive results
4. Administrative operations maintain proper data boundaries

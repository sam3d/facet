# facet

A flexible single table design ORM for DynamoDB

## Strategies

| Strategy                                                   | Type         | Support    | Notes |
| ---------------------------------------------------------- | ------------ | ---------- | ----- |
| Denormalisation by using a complex attribute               | One-to-many  | ⏰ Planned |       |
| Denormalisation by duplicating data                        | One-to-many  | ⏰ Planned |       |
| Composite primary key + the Query API action               | One-to-many  | ⏰ Planned |       |
| Secondary index + the Query API action                     | One-to-many  | ⏰ Planned |       |
| Composite sort keys with hierarchical data                 | One-to-many  | ⏰ Planned |       |
| Shallow duplication                                        | Many-to-many | ⏰ Planned |       |
| Adjacency list                                             | Many-to-many | ⏰ Planned |       |
| Materialized graph                                         | Many-to-many | ⏰ Planned |       |
| Normalization & multiple requests                          | Many-to-many | ⏰ Planned |       |
| Filtering with the partition key                           | Filtering    | ⏰ Planned |       |
| Filtering with the sort key                                | Filtering    | ⏰ Planned |       |
| Composite sort key                                         | Filtering    | ⏰ Planned |       |
| Sparse indexes                                             | Filtering    | ⏰ Planned |       |
| Filter expressions                                         | Filtering    | ⏰ Planned |       |
| Client-side filtering                                      | Filtering    | ⏰ Planned |       |
| Sorting on changing attributes                             | Sorting      | ⏰ Planned |       |
| Ascending vs. descending                                   | Sorting      | ⏰ Planned |       |
| Two relational access patterns in a single item collection | Sorting      | ⏰ Planned |       |
| Zero-padding with numbers                                  | Sorting      | ⏰ Planned |       |
| Faking ascending order                                     | Sorting      | ⏰ Planned |       |
| Adding new attributes to an existing entity                | Migrations   | ⏰ Planned |       |
| Adding a new entity without relations                      | Migrations   | ⏰ Planned |       |
| Adding a new entity type into an existing item collection  | Migrations   | ⏰ Planned |       |
| Adding a new entity type into a new item collection        | Migrations   | ⏰ Planned |       |
| Joining existing items into a new item collection          | Migrations   | ⏰ Planned |       |
| Using parallel scans                                       | Migrations   | ⏰ Planned |       |
| Ensuring uniqueness on two or more attributes              | Misc         | ⏰ Planned |       |
| Handling sequential IDs                                    | Misc         | ⏰ Planned |       |
| Pagination                                                 | Misc         | ⏰ Planned |       |
| Singleton items                                            | Misc         | ⏰ Planned |       |
| Reference counts                                           | Misc         | ⏰ Planned |       |

### Denormalisation by using a complex attribute

### Denormalisation by duplicating data

### Composite primary key + the Query API action

### Secondary index + the Query API action

### Composite sort keys with hierarchical data

#### Example: Stores

```
entity Store {
  id Number
  organisation Organisation { id }

  country String
  state String
  city String

  @@id(organisation.id, id)
  @@index((), (country, state, city))
}
```

> The `()` at the beginning of index is used to indicate that there is no significant partition key, and that the uniqueness of the store is decided by the location at the sort key on the primary table.

- Primary table
  - CRUD a store by `organisation ID` and `store ID`
  - Get all stores by `organisation ID`
- GSI1
  - Get all stores by `country`
  - Get all stores by `country` and `state`
  - Get all stores by `country` and `state` and `city`

#### Example: Products

```
entity Product {
  id Number
  organisation Organisation { id }

  @@id(organisation.id, id)
}

entity SolarPanel {
  id Number
}

entity Inverter {
  id Number
}

entity StringInverter {
  id Number
}

entity MicroInverter {
  id Number
}
```

- Primary table
  - CRUD a product by `organisation ID` and `product ID`
  - Get all products by `organisation ID`

### Shallow duplication

### Adjacency list

### Materialized graph

### Normalization & multiple requests

### Filtering with the partition key

### Filtering with the sort key

### Composite sort key

### Sparse indexes

### Filter expressions

### Client-side filtering

### Sorting on changing attributes

### Ascending vs. descending

### Two relational access patterns in a single item collection

### Zero-padding with numbers

### Faking ascending order

### Adding new attributes to an existing entity

### Adding a new entity without relations

### Adding a new entity type into an existing item collection

### Adding a new entity type into a new item collection

### Joining existing items into a new item collection

### Using parallel scans

### Ensuring uniqueness on two or more attributes

### Handling sequential IDs

### Pagination

### Singleton items

### Reference counts

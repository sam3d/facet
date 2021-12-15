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

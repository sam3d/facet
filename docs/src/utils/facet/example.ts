export const exampleSchema = `
entity Organisation {
  id Number @id

  name String

  au { legalName String, acn Number }?
  gb { legalName String, abn Number }?

  createdAt Date
  updatedAt Date
}

entity User {
  id Number @id

  organisation Organisation { id }
  role Role

  email String
  name String?
  hashedPassword String?

  createdAt Date
  updatedAt Date
}

enum Role {
  SuperAdmin
  Admin
  SalesRep
  User
}

entity Session {
  id Number
  user User { id }

  token String
  userAgent String?

  createdAt Date
  updatedAt Date

  @@id(user.id, session.id)
}
`.trim();

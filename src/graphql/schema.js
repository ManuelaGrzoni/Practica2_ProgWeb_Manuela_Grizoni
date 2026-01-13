import gql from "graphql-tag";

export const typeDefs = gql`
  type Product {
    _id: ID!
    name: String!
    price: Float!
    description: String
    imageUrl: String
    createdAt: String
    updatedAt: String
  }

  type User {
    _id: ID!
    username: String!
    email: String!
    role: String!
  }

  type OrderItem {
    product: ID!
    name: String!
    price: Float!
    quantity: Int!
  }

  type Order {
    _id: ID!
    user: User!
    items: [OrderItem!]!
    status: String!
    total: Float!
    createdAt: String!
    updatedAt: String!
  }

  input CartItemInput {
    productId: ID!
    quantity: Int!
  }

  type Query {
    # ✅ Productos por GraphQL (requisito)
    products(q: String, min: Float, max: Float): [Product!]!

    # ✅ Pedidos por GraphQL (requisito)
    myOrders: [Order!]!
    orders(status: String): [Order!]!     # admin
    order(id: ID!): Order                 # admin
  }

  type Mutation {
    # ✅ Simulación compra vía GraphQL (requisito pedidos)
    createOrder(items: [CartItemInput!]!): Order!

    # opcional: cambiar estado (admin)
    setOrderStatus(id: ID!, status: String!): Order!
  }
`;

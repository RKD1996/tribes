import { createServer, Model } from "miragejs"

export function makeServer({ environment = "development" } = {}) {
  let server = createServer({
    environment,

    models: {
      user: Model,
    },


    routes() {
      this.namespace = "api"

      this.get("/users", (schema) => {
        return schema.users
      })

      this.post("/createUser", (schema, request) => {
        console.log('post data => ', JSON.parse(request.requestBody), schema);
        schema.users = JSON.parse(request.requestBody)
        return {status: 200, msg: 'data recieved'}
      })
    },
  })

  return server
}

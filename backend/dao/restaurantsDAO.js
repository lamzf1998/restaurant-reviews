//DAO is a type of abstraction that isolates the code responsible for data access and persistence 
//from the code responsible for performing application logic.

import mongodb from "mongodb"
const ObjectId = mongodb.ObjectID
let restaurants //let statement to set a variable name equal to an expression or a function, or to create views

export default class RestaurantsDAO {
    //await operator is used to wait for a Promise and get its fulfillment value
    //async function declaration creates a binding of a new async function to a given name
  
  static async injectDB(conn) {
    if (restaurants) {
      return
    }
    try {
      restaurants = await conn.db(process.env.RESTREVIEWS_NS).collection("restaurants")
    } catch (e) {
      console.error(
        `Unable to establish a collection handle in restaurantsDAO: ${e}`,
      )
    }
  }

  static async getRestaurants({
    filters = null,
    page = 0,
    restaurantsPerPage = 20,
  } = {}) {
    let query
    if (filters) {
      
      //Text search queries must have a text index on your collection. MongoDB provides text indexes to support text search queries on string content. 
      //Text indexes can include any field whose value is a string or an array of string elements
      
      if ("name" in filters) {
        query = { $text: { $search: filters["name"] } }
      } else if ("cuisine" in filters) {
        query = { "cuisine": { $eq: filters["cuisine"] } }
      } else if ("zipcode" in filters) {
        query = { "address.zipcode": { $eq: filters["zipcode"] } }
      }
    }

    let cursor
    
    try {
      cursor = await restaurants
        .find(query)
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`)
      return { restaurantsList: [], totalNumRestaurants: 0 }
    }

    const displayCursor = cursor.limit(restaurantsPerPage).skip(restaurantsPerPage * page)

    try {
      const restaurantsList = await displayCursor.toArray()
      const totalNumRestaurants = await restaurants.countDocuments(query)

      return { restaurantsList, totalNumRestaurants }
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents, ${e}`,
      )
      return { restaurantsList: [], totalNumRestaurants: 0 }
    }
  }
  static async getRestaurantByID(id) {
    try {
        //create aggregation pipelines to match different collections together
        //documents enter multi-stage pipeline that transform documents into aggregated results
        const pipeline = [
        {
            $match: {
                _id: new ObjectId(id), //id of certain restaurant
            },
        },
              {
                  $lookup: {
                      from: "reviews", //lookup from review collection to add to the result
                      let: {
                          id: "$_id",
                      },
                      pipeline: [ //pipeline to find reviews that match restaurant_id
                          {
                              $match: {
                                  $expr: {
                                      $eq: ["$restaurant_id", "$$id"],
                                  },
                              },
                          },
                          {
                              $sort: {
                                  date: -1,
                              },
                          },
                      ],
                      as: "reviews",
                  },
              },
              {
                  $addFields: {
                      reviews: "$reviews", //adds new field reviews into the result
                  },
              },
          ]
      return await restaurants.aggregate(pipeline).next()
    } catch (e) {
      console.error(`Something went wrong in getRestaurantByID: ${e}`)
      throw e
    }
  }

  static async getCuisines() {
    let cuisines = []
    try {
      cuisines = await restaurants.distinct("cuisine")
      return cuisines
    } catch (e) {
      console.error(`Unable to get cuisines, ${e}`)
      return cuisines
    }
  }
}




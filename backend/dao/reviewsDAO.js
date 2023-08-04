import mongodb from "mongodb"
const ObjectId = mongodb.ObjectId

let reviews

export default class ReviewsDAO {
  static async injectDB(conn) {
    if (reviews) {
      return
    }
    try {
      reviews = await conn.db(process.env.RESTREVIEWS_NS).collection("reviews")
    } catch (e) {
      console.error(`Unable to establish collection handles in userDAO: ${e}`)
    }
  }

  static async getReviews({
    filters = null,
    page = 0,
    reviewsPerPage = 20,
  } = {}) {
    let query
    if (filters) {
      
      //Text search queries must have a text index on your collection. MongoDB provides text indexes to support text search queries on string content. 
      //Text indexes can include any field whose value is a string or an array of string elements
      
      if ("user_id" in filters) {
        query = { "user_id": { $eq: filters["user_id"] } }
        console.log(query)
      }
    }

    let cursor
    
    try {
      cursor = await reviews
        .find(query)
    } catch (e) {
      console.error(`Unable to issue find command, ${e}`)
      return { reviewsList: [], totalNumReviews: 0 }
    }

    const displayCursor = cursor.limit(reviewsPerPage).skip(reviewsPerPage * page)

    try {
      const reviewsList = await displayCursor.toArray()
      const totalNumReviews = await reviews.countDocuments(query)

      return { reviewsList, totalNumReviews }
    } catch (e) {
      console.error(
        `Unable to convert cursor to array or problem counting documents, ${e}`,
      )
      return { reviewsList: [], totalNumReviews: 0 }
    }
  }

  static async getReviewsById(id) {
    try {
      const getReviewPipeline = [{
        $match: {
          _id: new ObjectId(id),
        }
      }
    ]
      return await reviews.aggregate(getReviewPipeline).next()
    } catch (e) {
      console.error(`error ${e}`)
      throw e
    }
  }
  

  static async addReview(restaurantId, user, review, date) {
    try {
      const reviewDoc = { name: user.name,
          user_id: user._id,
          date: date,
          text: review,
          restaurant_id: new ObjectId(restaurantId), }

      return await reviews.insertOne(reviewDoc)
    } catch (e) {
      console.error(`Unable to post review: ${e}`)
      return { error: e }
    }
  }

  static async updateReview(reviewId, userId, text, date) {
    try {
      const updateResponse = await reviews.updateOne(
        { user_id: userId, _id: new ObjectId(reviewId)},
        { $set: { text: text, date: date  } },
      )

      return updateResponse
    } catch (e) {
      console.error(`Unable to update review: ${e}`)
      return { error: e }
    }
  }

  static async deleteReview(reviewId, userId) {

    try {
      const deleteResponse = await reviews.deleteOne({
        _id: new ObjectId(reviewId),
        user_id: userId,
      })

      return deleteResponse
    } catch (e) {
      console.error(`Unable to delete review: ${e}`)
      return { error: e }
    }
  }

}

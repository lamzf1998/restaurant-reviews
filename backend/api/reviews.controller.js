import RestaurantsDAO from "../dao/restaurantsDAO.js"
import ReviewsDAO from "../dao/reviewsDAO.js"

export default class ReviewsController {

  //api url with "?<query> called and returns query string
  static async apiGetReviews(req, res, next) {
    const reviewsPerPage = req.query.reviewsPerPage ? parseInt(req.query.reviewsPerPage, 10) : 20
    const page = req.query.page ? parseInt(req.query.page, 10) : 0

    let filters = {}
    if (req.query.user_id) {
      filters.user_id = req.query.user_id
    } 

    const { reviewsList, totalNumReviews } = await ReviewsDAO.getReviews({
      filters,
      page,
      reviewsPerPage,
    })

    let response = {
      reviews: reviewsList,
      page: page+1,
      filters: filters,
      entries_per_page: reviewsPerPage,
      total_results: totalNumReviews,
    }
    res.json(response)
  }

  static async apiPostReview(req, res, next) {
    try {
      const restaurantId = req.body.restaurant_id
      const review = req.body.text
      const userInfo = {
        name: req.body.name,
        _id: req.body.user_id
      }
      const date = new Date()

      const ReviewResponse = await ReviewsDAO.addReview(
        restaurantId,
        userInfo,
        review,
        date,
      )
      res.json({ status: "success" })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static async apiUpdateReview(req, res, next) {
    try {
      const reviewId = req.body.review_id
      const text = req.body.text
      const userId = req.body.user_id
      const date = new Date()

      const reviewResponse = await ReviewsDAO.updateReview(
        reviewId,
        userId,
        text,
        date,
      )

      var { error } = reviewResponse
      if (error) {
        res.status(400).json({ error })
      }

      if (reviewResponse.modifiedCount === 0) {
        throw new Error(
          "unable to update review - user may not be original poster",
        )
      }

      res.json({ status: "success" })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static async apiDeleteReview(req, res, next) {
    try {
      const reviewId = req.body.review_id
      const userId = req.body.user_id
      //console.log(reviewId)
      const reviewResponse = await ReviewsDAO.deleteReview(
        reviewId,
        userId,
      )
      res.json({ status: "success" })
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  }

  static async apiGetReviewsById(req, res, next) {
    try {
      let id = req.params.id || {}
      let reviews = await ReviewsDAO.getReviewsById(id)
      if (!restaurant) {
        res.status(404).json({ error: "Not found" })
        return
      }
      res.json(reviews)
    } catch(e) {
      console.log(`api, ${e}`)
      res.status(500).json({error : e })
    }
  }
}

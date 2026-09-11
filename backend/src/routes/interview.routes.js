const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()

/**
 * @route POST /api/interview/ or /api/interview/generate
 * @description Generate new interview report
 * @access private
 */
interviewRouter.post("/", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)
interviewRouter.post("/generate", authMiddleware.authUser, upload.single("resume"), interviewController.generateInterViewReportController)

/**
 * @route GET /api/interview/report/:interviewId or /api/interview/:interviewId
 * @description Get interview report by ID
 * @access private
 */
interviewRouter.get("/report/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)
interviewRouter.get("/:interviewId", authMiddleware.authUser, interviewController.getInterviewReportByIdController)

/**
 * @route GET /api/interview/
 * @description Get all interview reports of logged in user
 * @access private
 */
interviewRouter.get("/", authMiddleware.authUser, interviewController.getAllInterviewReportsController)

/**
 * @route POST or GET /api/interview/resume/pdf/:interviewReportId
 * @description Generate resume PDF
 * @access private
 */
interviewRouter.post("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)
interviewRouter.get("/resume/pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)
interviewRouter.get("/resume-pdf/:interviewReportId", authMiddleware.authUser, interviewController.generateResumePdfController)

module.exports = interviewRouter
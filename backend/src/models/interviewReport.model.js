
/**
 * 1. job description schema
 * 2. resume text:string
 * 3. matchScore: number
 * 4. self description:string
 * 
 * - technical questions - arr []
 *         [{
 *          question:"",
 *          intention: "",
 *          answer:""               
 *          }]
 * - behavioral questions - [ ]
 * 
 *         [{
 *          question:"",
 *          intention: "",
 *          answer:""               
 *          }]
 * - skill gaps- [{
 *                    skill:"",
 *                    severity:{
 *                   type:String,
 *                    enum :["low","medium","high"]
 * 
 * },
 * 
 *                  }]
 * - prep plan - [{ 
 *              day: number,
 *              focus:String,
 *              tasks:[string]             
 * }]
 */
const mongoose = require('mongoose');

const technicalQuestionSchema = new mongoose.Schema({
    question: { type: String, default: "" },
    intention: { type: String, default: "" },
    answer: { type: String, default: "" }
}, { _id: false });

const behavioralQuestionSchema = new mongoose.Schema({
    question: { type: String, default: "" },
    intention: { type: String, default: "" },
    answer: { type: String, default: "" }
}, { _id: false });

const skillGapSchema = new mongoose.Schema({
    skill: { type: String, default: "" },
    severity: {
        type: String,
        enum: ["low", "medium", "high", "Low", "Medium", "High"],
        lowercase: true,
        default: "medium"
    }
}, { _id: false });

const preparationPlanSchema = new mongoose.Schema({
    day: { type: Number, default: 1 },
    focus: { type: String, default: "" },
    tasks: [{ type: String }]
}, { _id: false });

const interviewReportSchema = new mongoose.Schema({
    jobDescription: {
        type: String,
        required: [true, "Job description is required"]
    },
    resume: {
        type: String,
        default: ""
    },
    selfDescription: {
        type: String,
        default: ""
    },
    matchScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    technicalQuestions: [technicalQuestionSchema],
    behavioralQuestions: [behavioralQuestionSchema],
    skillGaps: [skillGapSchema],
    preparationPlan: [preparationPlanSchema],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    title: {
        type: String,
        required: [true, "Job Title is required"]
    }
}, {
    timestamps: true
});

const interviewReportModel = mongoose.model('InterviewReport', interviewReportSchema);

module.exports = interviewReportModel;
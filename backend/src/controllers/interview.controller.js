const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")

// Helper function to extract text safely from PDF
async function extractTextFromPdf(buffer) {
    if (!buffer) return ""
    try {
        if (typeof pdfParse === "function") {
            const parsed = await pdfParse(buffer)
            return parsed.text || ""
        } else if (pdfParse.PDFParse) {
            const parser = new pdfParse.PDFParse(Uint8Array.from(buffer))
            const parsed = await parser.getText()
            return parsed.text || parsed || ""
        } else if (pdfParse.default && typeof pdfParse.default === "function") {
            const parsed = await pdfParse.default(buffer)
            return parsed.text || ""
        }
        return ""
    } catch (err) {
        console.error("PDF Parsing Warning:", err.message)
        return ""
    }
}

// Data Normalization helpers to match Mongoose Subdocument Objects
function normalizeQuestions(arr) {
    if (!Array.isArray(arr)) return []
    return arr.map(item => {
        if (typeof item === "string") {
            return {
                question: item,
                intention: "Assess candidate domain knowledge and practical problem-solving capability.",
                answer: "Explain core principles with clear real-world project experience."
            }
        }
        return {
            question: item?.question || "Question not provided",
            intention: item?.intention || "Assess understanding of key concepts.",
            answer: item?.answer || "Provide clear step-by-step reasoning with code/examples."
        }
    })
}

function normalizeSkillGaps(arr) {
    if (!Array.isArray(arr)) return []
    return arr.map(item => {
        if (typeof item === "string") {
            return {
                skill: item,
                severity: "medium"
            }
        }
        return {
            skill: item?.skill || "General Topic",
            severity: (item?.severity || "medium").toLowerCase()
        }
    })
}

function normalizePreparationPlan(arr) {
    if (!Array.isArray(arr)) return []
    return arr.map((item, index) => {
        if (typeof item === "string") {
            return {
                day: index + 1,
                focus: item.split(":")[0] || `Day ${index + 1} Focus`,
                tasks: [item]
            }
        }
        return {
            day: item?.day || index + 1,
            focus: item?.focus || `Day ${index + 1} Revision`,
            tasks: Array.isArray(item?.tasks) ? item.tasks : [item?.tasks || "Review core concepts"]
        }
    })
}

/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription, title } = req.body

        if (!jobDescription) {
            return res.status(400).json({
                message: "Job description is required."
            })
        }

        if (!req.file && !selfDescription) {
            return res.status(400).json({
                message: "Either a resume or a self description is required."
            })
        }

        // Safely extract text from PDF
        let resumeText = ""
        if (req.file) {
            resumeText = await extractTextFromPdf(req.file.buffer)
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription
        })

        const aiData = interViewReportByAi?.interviewReport || interViewReportByAi || {}
        const reportTitle = title || aiData?.title || "Target Position Interview Plan"

        // Format raw AI data into schema-compliant objects
        const formattedTechnical = normalizeQuestions(aiData.technicalQuestions)
        const formattedBehavioral = normalizeQuestions(aiData.behavioralQuestions)
        const formattedSkillGaps = normalizeSkillGaps(aiData.skillGaps)
        const formattedPrepPlan = normalizePreparationPlan(aiData.preparationPlan)

        const userId = req.user?.id || req.user?._id

        const interviewReport = await interviewReportModel.create({
            user: userId,
            resume: resumeText,
            selfDescription: selfDescription || "",
            jobDescription,
            title: reportTitle,
            matchScore: typeof aiData.matchScore === "number" ? aiData.matchScore : 80,
            technicalQuestions: formattedTechnical,
            behavioralQuestions: formattedBehavioral,
            skillGaps: formattedSkillGaps,
            preparationPlan: formattedPrepPlan
        })

        res.status(201).json({
            message: "Interview report generated successfully.",
            interviewId: interviewReport._id,
            _id: interviewReport._id,
            interviewReport,
            ...interviewReport._doc
        })
    } catch (error) {
        console.error("Error generating interview report:", error)
        res.status(500).json({
            message: "Something went wrong while generating the interview report.",
            error: error.message
        })
    }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
    try {
        const { interviewId } = req.params
        const userId = req.user?.id || req.user?._id
        
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: userId })

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        res.status(200).json({
            message: "Interview report fetched successfully.",
            interviewId: interviewReport._id,
            _id: interviewReport._id,
            interviewReport,
            ...interviewReport._doc
        })
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}

/** 
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    try {
        const userId = req.user?.id || req.user?._id
        const interviewReports = await interviewReportModel
            .find({ user: userId })
            .sort({ createdAt: -1 })
            .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

        res.status(200).json({
            message: "Interview reports fetched successfully.",
            interviewReports
        })
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message })
    }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    try {
        const { interviewReportId } = req.params
        const interviewReport = await interviewReportModel.findById(interviewReportId)

        if (!interviewReport) {
            return res.status(404).json({
                message: "Interview report not found."
            })
        }

        const { resume, jobDescription, selfDescription } = interviewReport
        const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
        })

        res.send(pdfBuffer)
    } catch (error) {
        res.status(500).json({ message: "Error generating PDF", error: error.message })
    }
}

module.exports = { 
    generateInterViewReportController, 
    getInterviewReportByIdController, 
    getAllInterviewReportsController, 
    generateResumePdfController 
}
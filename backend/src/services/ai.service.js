const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})

function getCleanJsonSchema(schema) {
    const jsonSchema = zodToJsonSchema(schema)
    delete jsonSchema.$schema
    return jsonSchema
}

const interviewReportSchema = z.object({
    title: z.string().describe("The title of the job for which the interview report is generated"),
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job description"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The behavioral question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum(["low", "medium", "high"]).describe("The severity of this skill gap")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan"),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day")
    })).describe("A day-wise preparation plan for the candidate")
})

// Auto-retry helper for 503 temporary overload
async function generateContentWithRetry(params, retries = 3, delayMs = 2000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await ai.models.generateContent(params)
        } catch (error) {
            const isBusy = error?.status === 503 || error?.toString().includes("503") || error?.toString().includes("high demand")
            if (isBusy && i < retries - 1) {
                console.log(`Gemini API busy (503). Retrying in ${delayMs / 1000}s... (Attempt ${i + 1}/${retries})`)
                await new Promise(res => setTimeout(res, delayMs))
            } else {
                throw error
            }
        }
    }
}

async function generateInterviewReport({ resume, selfDescription, jobDescription }) {
    const prompt = `You are an expert technical interviewer and hiring strategist.
Analyze the following candidate profile against the job description and produce a detailed report.

Job Description:
${jobDescription}

Candidate Resume:
${resume || "Not provided"}

Candidate Self-Description:
${selfDescription || "Not provided"}

Ensure matchScore is an integer between 0 and 100.
Provide at least 3-5 technicalQuestions, 3-5 behavioralQuestions, relevant skillGaps, and a 5-day preparationPlan.`

    const response = await generateContentWithRetry({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: getCleanJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)
}

async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch({ headless: "new" })
    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4",
        margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()
    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF")
    })

    const prompt = `Generate resume for a candidate with the following details:
Resume: ${resume || "N/A"}
Self Description: ${selfDescription || "N/A"}
Job Description: ${jobDescription}

The response should be a JSON object with a single field "html" containing clean, responsive, professional HTML.`

    const response = await generateContentWithRetry({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: getCleanJsonSchema(resumePdfSchema),
        }
    })

    const jsonContent = JSON.parse(response.text)
    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer
}

module.exports = { generateInterviewReport, generateResumePdf }
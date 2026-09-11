import { 
    getAllInterviewReports, 
    generateInterviewReport, 
    getInterviewReportById, 
    generateResumePdf as generateResumePdfApi // Renamed to avoid name collision
} from "../services/interview.api";
import { useContext, useEffect } from "react"
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router"

export const useInterview = () => { 
    const context = useContext(InterviewContext)
    const { interviewId } = useParams()

    if (!context) {
        throw new Error("useInterview must be used within an InterviewProvider")
    }

    const { loading, setLoading, report, setReport, reports, setReports } = context

    const generateReport = async ({ jobDescription, selfDescription, resumeFile, title }) => {
        setLoading(true)
        try {
            const response = await generateInterviewReport({ jobDescription, selfDescription, resumeFile, title })
            
            // Backend directly returns report object or inside interviewReport key
            const reportData = response.interviewReport || response
            setReport(reportData)
            
            return reportData // Fix: Now returns full object with _id
        } catch (error) {
            console.error("Error generating interview report:", error)
            return null
        } finally {
            setLoading(false)
        }
    }

    const getReportById = async (id) => {
        setLoading(true)
        let reportData = null
        try {
            const response = await getInterviewReportById(id)
            reportData = response.interviewReport || response
            setReport(reportData)
        } catch (error) {
            console.error("Error fetching interview report by ID:", error)
        } finally {
            setLoading(false)
        }
        return reportData
    }

    const getReports = async () => {
        setLoading(true)
        let reportsData = []
        try {
            const response = await getAllInterviewReports()
            reportsData = response.interviewReports || response
            setReports(reportsData)
        } catch (error) {
            console.error("Error fetching all interview reports:", error)
        } finally {
            setLoading(false)
        }
        return reportsData
    }

    const generateResumePdf = async ({ interviewReportId }) => {
        setLoading(true)
        let response = null
        try {
            response = await generateResumePdfApi({ interviewReportId })
            const url = window.URL.createObjectURL(new Blob([response], { type: "application/pdf" }))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", "resume.pdf")
            document.body.appendChild(link)
            link.click()
            link.remove()
        } catch (error) {
            console.error("Error generating resume PDF:", error)
        } finally {
            setLoading(false)
        }
        return response
    }

    useEffect(() => {
        if (interviewId) {
            getReportById(interviewId)
        } else {
            getReports()
        }
    }, [interviewId])

    return {
        loading,
        report, 
        reports,
        generateReport,
        getReportById,
        getReports,
        generateResumePdf
    }
}
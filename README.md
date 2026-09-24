# 🎯 AI Interview Strategy Generator

An AI-powered MERN stack platform that performs deep dual-parsing on candidate resumes and job descriptions to deliver personalized interview Q&A, skill-gap breakdowns, and actionable preparation roadmaps.

---

## ✨ Key Features

* **Smart Resume & JD Parsing:** Cross-references candidate experience with job requirements using semantic analysis.
* **Interviewer Motive Decoding:** Generates technical and behavioral questions alongside the underlying hiring manager intent and model answers.
* **Dynamic Skill Gap Analysis:** Identifies missing technical skills and categorizes them by severity (High, Medium, Low).
* **Actionable 5-Day Roadmap:** Automatically translates detected gaps into a daily structured preparation schedule.
* **PDF Export:** Converts strategy reports and tailored resumes into downloadable PDFs using Puppeteer.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Axios, SCSS
* **Backend:** Node.js, Express.js, MongoDB, Multer
* **AI & Processing:** Google Gemini API (`@google/genai`), Zod Schema Validation
* **PDF Engine:** Puppeteer

---

## 🚀 Getting Started

### Prerequisites
* Node.js (v18 or higher)
* MongoDB (Local or Atlas instance)
* Google Gemini API Key

---

### 1. Backend Configuration

Navigate to the backend folder and install dependencies:

```bash
cd backend
npm install
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

# --- Resume Structure ---
class ResumeExperience(BaseModel):
    role: str = Field(description="The job title or role.")
    company: str = Field(description="The name of the company.")
    date: str = Field(description="The dates of employment (e.g., 'Oct 2024 - Mar 2025').")
    points: List[str] = Field(description="A list of 2-4 bullet points describing responsibilities and achievements, optimized for the job description.")

class ResumeProject(BaseModel):
    name: str = Field(description="The name of the project.")
    description: str = Field(description="A 1-2 sentence description of the project, optimized for the job description.")
    link: Optional[str] = Field(default=None, description="A URL to the project or its repository.")

class ResumeData(BaseModel):
    """The structured data for the optimized resume."""
    name: str = Field(description="User's full name.")
    phone: str = Field(description="User's phone number.")
    email: str = Field(description="User's email address.")
    linkedin: str = Field(description="Full URL to the user's LinkedIn profile.")
    github: str = Field(description="Full URL to the user's GitHub profile.")
    portfolio: str = Field(description="Full URL to the user's personal portfolio website.")
    summary: str = Field(description="A 3-4 sentence professional summary, tailored to the job description.")
    skills: Dict[str, List[str]] = Field(description="A dictionary of skills, categorized by keys like 'Frontend', 'Backend', 'Tools', etc.")
    experience: List[ResumeExperience] = Field(description="A list of professional experiences.")
    projects: List[ResumeProject] = Field(description="A list of relevant personal or professional projects.")

class OptimizedResumeOutput(BaseModel):
    """
    The final JSON object returned by the AI crew.
    It contains the structured resume and the rationale for the changes.
    """
    resume: ResumeData = Field(description="The structured JSON data for the optimized resume.")
    rationale: str = Field(description="A detailed, point-by-point explanation of *why* specific changes were made to align the resume with the job description, referencing keywords and requirements.")

# --- Resume Builder Schemas ---
class PersonalInfo(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None
    portfolio: Optional[str] = None
    location: Optional[str] = None

class ExperienceItem(BaseModel):
    company: str
    role: str
    dates: Optional[str] = None
    bullets: List[str] = []

class ProjectItem(BaseModel):
    name: str
    github_url: Optional[str] = None 
    demo_url: Optional[str] = None
    description: Optional[str] = None 
    bullets: List[str] = [] 
    technologies: List[str] = []

class EducationItem(BaseModel):
    institution: str
    degree: str
    dates: Optional[str] = None

class ResumeSchema(BaseModel):
    personal_info: PersonalInfo
    summary: str
    skills: Dict[str, List[str]]
    experience: List[ExperienceItem]
    projects: List[ProjectItem]
    education: List[EducationItem]

# --- Gap Analysis ---
class GapAnalysisRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: str
    job_url: Optional[str] = None

class GapItem(BaseModel):
    missing_skill: str
    context: str
    question: str

class GapAnalysisResponse(BaseModel):
    job_title_detected: str
    match_score: int
    gaps: List[GapItem]

# --- Cover Letter ---
class CoverLetterRequest(BaseModel):
    resume_data: Dict[str, Any]
    job_description: str

class CoverLetterResponse(BaseModel):
    cover_letter_text: str

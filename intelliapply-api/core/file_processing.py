import io
import logging
import pdfplumber
from docx import Document
from fastapi import HTTPException, UploadFile, status

log = logging.getLogger(__name__)

SUPPORTED_FILE_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

def extract_text_from_file(file: UploadFile) -> str:
    file_type = file.content_type
    log.info(f"Attempting to extract text from file: {file.filename} (Type: {file_type})")

    if file_type not in SUPPORTED_FILE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type. Please upload a PDF or DOCX file."
        )

    try:
        file_content = file.file.read()
        file_stream = io.BytesIO(file_content)
        text = ""

        if file_type == "application/pdf":
            with pdfplumber.open(file_stream) as pdf:
                for page in pdf.pages:
                    text += page.extract_text() + "\n"
        
        elif file_type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            doc = Document(file_stream)
            for para in doc.paragraphs:
                text += para.text + "\n"

        log.info(f"Successfully extracted {len(text)} characters.")
        return text

    except Exception as e:
        log.error(f"Failed to process file {file.filename}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse file: {e}"
        )
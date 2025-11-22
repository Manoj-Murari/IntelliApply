import fitz

doc = fitz.open()
page = doc.new_page()
text = """
John Doe
Software Engineer
john.doe@example.com | 123-456-7890 | linkedin.com/in/johndoe

Summary
Experienced software engineer with a focus on Python and React.

Experience
Software Engineer | Tech Corp | 2020 - Present
- Built web applications using FastAPI and React.
- Optimized database queries reducing load by 30%.

Projects
Resume Builder
- Developed an AI-powered resume builder.
- Technologies: Python, React, OpenAI.

Education
BS Computer Science | University of Tech | 2016 - 2020
"""
page.insert_text((50, 50), text)
doc.save("dummy_resume.pdf")
print("dummy_resume.pdf created")

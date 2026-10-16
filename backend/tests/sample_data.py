import base64, io, sys
sys.path.insert(0, "/home/claude/covercraft/backend")
from PIL import Image, ImageDraw
def logo_b64():
    im = Image.new("RGB", (300, 300), "white"); d = ImageDraw.Draw(im)
    d.ellipse((20, 20, 280, 280), fill="#0E4D92"); d.rectangle((110, 90, 190, 210), fill="white")
    b = io.BytesIO(); im.save(b, "PNG"); return base64.b64encode(b.getvalue()).decode()
def sample(**over):
    p = {"document": {"type": "assignment", "title": "Software Testing Techniques and Test Case Design", "subtitle": "A study of black-box methods",
         "course_code": "CSE 4203", "course_title": "Software Testing and Quality Assurance", "term": "Fall 2026", "section": "A",
         "academic_year": "2026-27", "submission_date": "2026-10-16", "notes": ""},
     "institution": {"name": "Northern Metropolitan University", "faculty": "Faculty of Science and Engineering",
         "department": "Department of Computer Science and Engineering", "program": "B.Sc. in CSE", "address": "Dhaka, Bangladesh", "logo_base64": logo_b64()},
     "submitted_to": {"name": "Dr. Rahman Chowdhury", "designation": "Associate Professor", "department": "Department of CSE"},
     "submitted_by": {"mode": "individual", "members": [{"name": "Ayesha Siddika", "student_id": "2021-1-60-045"}],
         "department": "", "program": "B.Sc. in CSE", "term": "Fall 2026", "section": "A", "batch": "58"},
     "design": {"template_id": "classic"}}
    for k, v in over.items():
        p[k].update(v)
    return p

from pathlib import Path

from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "output" / "pdf" / "constantine-rainer-simanjuntak-cv.pdf"
INK = HexColor("#111014")
MUTED = HexColor("#66636d")
HAIR = HexColor("#dedce2")
PAPER = HexColor("#ffffff")


def paragraph_style(name, size=8.3, leading=11.4, color=INK, weight="Helvetica"):
    return ParagraphStyle(
        name,
        fontName=weight,
        fontSize=size,
        leading=leading,
        textColor=color,
        alignment=TA_LEFT,
        spaceAfter=0,
    )


BODY = paragraph_style("body")
MUTED_BODY = paragraph_style("muted", color=MUTED)
SMALL = paragraph_style("small", size=7.4, leading=10.2, color=MUTED)
ITEM_TITLE = paragraph_style("item-title", size=9, leading=11.4, weight="Helvetica-Bold")


def draw_paragraph(pdf, text, x, y, width, style=BODY):
    block = Paragraph(text, style)
    _, height = block.wrap(width, 200 * mm)
    block.drawOn(pdf, x, y - height)
    return y - height


def draw_heading(pdf, text, x, y, width):
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 7.2)
    pdf.drawString(x, y, text.upper())
    pdf.setStrokeColor(HAIR)
    pdf.setLineWidth(0.6)
    pdf.line(x, y - 4, x + width, y - 4)
    return y - 15


def draw_item(pdf, title, meta, body, x, y, width):
    y = draw_paragraph(pdf, title, x, y, width, ITEM_TITLE)
    if meta:
        y = draw_paragraph(pdf, meta, x, y - 1, width, SMALL)
    y = draw_paragraph(pdf, body, x, y - 3, width, BODY)
    return y - 10


def draw_link(pdf, label, url, x, y, size=8):
    pdf.setFont("Helvetica", size)
    pdf.setFillColor(MUTED)
    pdf.drawString(x, y, label)
    width = stringWidth(label, "Helvetica", size)
    pdf.linkURL(url, (x, y - 2, x + width, y + size), relative=0)
    return y - 12


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    pdf = canvas.Canvas(str(OUTPUT), pagesize=A4, pageCompression=1)
    width, height = A4
    pdf.setTitle("Constantine Rainer Simanjuntak - Curriculum Vitae")
    pdf.setAuthor("Constantine Rainer Simanjuntak")
    pdf.setSubject("Web development, UI/UX design and applied AI portfolio")
    pdf.setFillColor(PAPER)
    pdf.rect(0, 0, width, height, fill=1, stroke=0)

    left = 42
    top = height - 46
    pdf.setFillColor(INK)
    pdf.setFont("Helvetica-Bold", 22)
    pdf.drawString(left, top, "CONSTANTINE RAINER SIMANJUNTAK")
    pdf.setFont("Helvetica", 9.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(left, top - 20, "WEB DEVELOPER  /  UI/UX DESIGNER  /  ASPIRING AI ENGINEER")
    pdf.setStrokeColor(INK)
    pdf.setLineWidth(1)
    pdf.line(left, top - 33, width - left, top - 33)

    gutter = 25
    left_width = 174
    right_x = left + left_width + gutter
    right_width = width - left - right_x
    body_top = top - 57

    y = draw_heading(pdf, "Contact", left, body_top, left_width)
    y = draw_link(pdf, "Purwokerto, Indonesia", "https://maps.google.com/?q=Purwokerto%2C+Indonesia", left, y)
    y = draw_link(pdf, "rainersimanjuntak59@gmail.com", "mailto:rainersimanjuntak59@gmail.com", left, y)
    y = draw_link(pdf, "github.com/Constanvel", "https://github.com/Constanvel", left, y)
    y = draw_link(pdf, "behance.net/constanrainer", "https://www.behance.net/constanrainer", left, y)
    y = draw_link(pdf, "portofolio-rainer.vercel.app", "https://portofolio-rainer.vercel.app/", left, y)

    y = draw_heading(pdf, "Profile", left, y - 10, left_width)
    y = draw_paragraph(
        pdf,
        "Software engineering student who takes web products from user flow and visual system through implementation, testing and deployment. Building toward AI engineering through computer vision, RAG and language-model experiments.",
        left,
        y,
        left_width,
    )

    y = draw_heading(pdf, "Skills", left, y - 14, left_width)
    y = draw_paragraph(
        pdf,
        "<b>Web</b><br/>React, Next.js, JavaScript, TypeScript, HTML, CSS, Tailwind CSS, Supabase, PostgreSQL",
        left,
        y,
        left_width,
    )
    y = draw_paragraph(
        pdf,
        "<b>Applied AI</b><br/>YOLO, RAG, LLM APIs, TensorFlow.js, pose classification",
        left,
        y - 8,
        left_width,
    )
    y = draw_paragraph(
        pdf,
        "<b>Design and tools</b><br/>Figma, responsive UI, design systems, Git, Vite, Node.js",
        left,
        y - 8,
        left_width,
    )

    y = draw_heading(pdf, "Education", left, y - 14, left_width)
    y = draw_item(
        pdf,
        "SMK Telkom Purwokerto",
        "CLASS XI PPLG  /  SOFTWARE ENGINEERING",
        "Software engineering studies with active work in web products, interface design and the school AI club.",
        left,
        y,
        left_width,
    )

    ry = draw_heading(pdf, "Selected Projects", right_x, body_top, right_width)
    ry = draw_item(
        pdf,
        "Lensa",
        "SOLO  /  NEXT.JS  /  TYPESCRIPT  /  SUPABASE",
        "Structured long-form fictional-character criticism around six analytical lenses, linked claims, citations and counterpoints. Built the product, interface, database migrations, authentication and automated writing-rule checks.",
        right_x,
        ry,
        right_width,
    )
    ry = draw_item(
        pdf,
        "SMK Telkom Purwokerto Platform",
        "TEAM PROJECT  /  REACT  /  TAILWIND CSS",
        "Designed and implemented the admin dashboard interface and management flows behind the public admissions, news, achievement and career content.",
        right_x,
        ry,
        right_width,
    )
    ry = draw_item(
        pdf,
        "AI Ninja Challenge",
        "SOLO  /  TENSORFLOW.JS  /  POSE CLASSIFICATION",
        "Integrated a MobileNetV1-based Teachable Machine pose model with real-time Attack, Deffend and Dodge challenges, confidence gating, scoring, character abilities and local match history.",
        right_x,
        ry,
        right_width,
    )
    ry = draw_item(
        pdf,
        "AI Text Summarizer",
        "SOLO  /  JAVASCRIPT  /  GROQ API",
        "Built a focused summarisation flow with three output lengths, live word counting, keyboard submission, validation and inline failure feedback.",
        right_x,
        ry,
        right_width,
    )

    ry = draw_heading(pdf, "AI Experience", right_x, ry - 2, right_width)
    ry = draw_item(
        pdf,
        "School AI Club",
        "2026",
        "Built experiments with YOLO, retrieval-augmented generation and language-model chatbots, then turned the work into demos and shared the findings with other students.",
        right_x,
        ry,
        right_width,
    )

    ry = draw_heading(pdf, "Selected Achievements", right_x, ry - 2, right_width)
    achievements = [
        ("2025", "Finalist, Sevent 9.0 UI/UX Design Competition - Telkom University Purwokerto"),
        ("2026", "Completed 15 AI Ready ASEAN modules - ASEAN Foundation with Google.org"),
        ("2026", "AI Ignition Training - 30 hours across nine modules under the AI Opportunity Fund"),
        ("2026", "TOEIC Excellence Program - English Discoveries by Edusoft"),
    ]
    for year, description in achievements:
        ry = draw_paragraph(pdf, f"<b>{year}</b>  {description}", right_x, ry, right_width, BODY) - 6

    pdf.setStrokeColor(HAIR)
    pdf.line(left, 35, width - left, 35)
    pdf.setFont("Helvetica", 7)
    pdf.setFillColor(MUTED)
    pdf.drawString(left, 23, "Portfolio and project evidence: portofolio-rainer.vercel.app")
    pdf.drawRightString(width - left, 23, "Updated September 2026")

    pdf.showPage()
    pdf.save()
    print(OUTPUT)


if __name__ == "__main__":
    build()

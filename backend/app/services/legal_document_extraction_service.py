"""Document extraction service for legal PDF, DOCX, text, and image inputs."""

from pathlib import Path

SUPPORTED_PDF_TYPES = {"application/pdf"}
SUPPORTED_DOCX_TYPES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
}
SUPPORTED_TEXT_TYPES = {"text/plain", "text/markdown", "application/json"}
SUPPORTED_IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/tiff", "image/webp"}


class LegalDocumentExtractionService:
    """Extract text from legal documents.

    OCR is represented as a clear extension point. A production OCR pipeline
    should be added behind `_extract_image_text` and scanned-PDF fallback.
    """

    async def extract_text(self, file_path: Path, mime_type: str) -> str:
        suffix = file_path.suffix.lower()
        if mime_type in SUPPORTED_PDF_TYPES or suffix == ".pdf":
            return self._extract_pdf_text(file_path)
        if mime_type in SUPPORTED_DOCX_TYPES or suffix in {".docx", ".doc"}:
            return self._extract_docx_text(file_path)
        if mime_type in SUPPORTED_TEXT_TYPES or suffix in {".txt", ".md", ".json"}:
            return file_path.read_text(encoding="utf-8", errors="ignore")  # noqa: ASYNC240
        if mime_type in SUPPORTED_IMAGE_TYPES or suffix in {
            ".png",
            ".jpg",
            ".jpeg",
            ".tiff",
            ".webp",
        }:
            return self._extract_image_text(file_path)
        raise ValueError(f"Unsupported legal document type: {mime_type or suffix}")

    def _extract_pdf_text(self, file_path: Path) -> str:
        try:
            import fitz
        except ImportError as exc:
            raise RuntimeError("PyMuPDF is required for PDF extraction. Run `uv sync`.") from exc

        pages: list[str] = []
        with fitz.open(file_path) as document:
            for page in document:
                pages.append(page.get_text("text"))
        text = "\n\n".join(page.strip() for page in pages if page.strip())
        if text:
            return text
        return self._extract_scanned_pdf_text(file_path)

    def _extract_docx_text(self, file_path: Path) -> str:
        try:
            from docx import Document
        except ImportError as exc:
            raise RuntimeError(
                "python-docx is required for DOCX extraction. Run `uv sync`."
            ) from exc

        document = Document(str(file_path))
        paragraphs = [paragraph.text.strip() for paragraph in document.paragraphs]
        return "\n".join(paragraph for paragraph in paragraphs if paragraph)

    def _extract_scanned_pdf_text(self, file_path: Path) -> str:
        try:
            import fitz
            import pytesseract
            from PIL import Image
        except ImportError as exc:
            raise RuntimeError(
                "Scanned PDF OCR requires PyMuPDF, Pillow, and pytesseract. Run `uv sync` "
                "and install the Tesseract system binary."
            ) from exc

        pages: list[str] = []
        with fitz.open(file_path) as document:
            for page in document:
                pixmap = page.get_pixmap(dpi=200, alpha=False)
                image = Image.frombytes("RGB", (pixmap.width, pixmap.height), pixmap.samples)
                text = pytesseract.image_to_string(image, lang="fra+eng")
                if text.strip():
                    pages.append(text.strip())
        if not pages:
            raise RuntimeError(f"OCR produced no text for scanned PDF `{file_path.name}`.")
        return "\n\n".join(pages)

    def _extract_image_text(self, file_path: Path) -> str:
        try:
            import pytesseract
            from PIL import Image
        except ImportError as exc:
            raise RuntimeError(
                "Image OCR requires Pillow and pytesseract. Run `uv sync` and install the "
                "Tesseract system binary."
            ) from exc

        with Image.open(file_path) as image:
            text = pytesseract.image_to_string(image, lang="fra+eng")
        if not text.strip():
            raise RuntimeError(f"OCR produced no text for image `{file_path.name}`.")
        return str(text)


legal_document_extraction_service = LegalDocumentExtractionService()

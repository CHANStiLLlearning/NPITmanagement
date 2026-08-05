import os
import shutil
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from datetime import datetime

from app.api.deps import get_current_active_user
from app.models.user import User

router = APIRouter()

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024  # 50MB

ALLOWED_EXTENSIONS = {
    # Images
    "png", "jpg", "jpeg", "webp", "gif", "svg",
    # PDF
    "pdf",
    # Word
    "doc", "docx",
    # Excel
    "xls", "xlsx", "csv",
    # PowerPoint
    "ppt", "pptx"
}


class FileMetadata(BaseModel):
    filename: str
    original_name: str
    file_type: str
    extension: str
    size_bytes: int
    size_mb: float
    url: str
    uploaded_at: str


def get_file_category(extension: str) -> str:
    ext = extension.lower()
    if ext in {"png", "jpg", "jpeg", "webp", "gif", "svg"}:
        return "image"
    elif ext == "pdf":
        return "pdf"
    elif ext in {"doc", "docx"}:
        return "word"
    elif ext in {"xls", "xlsx", "csv"}:
        return "excel"
    elif ext in {"ppt", "pptx"}:
        return "powerpoint"
    return "other"


@router.post("/upload", response_model=List[FileMetadata])
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
):
    results = []
    for file in files:
        # 1. Validate file extension
        ext = file.filename.split(".")[-1].lower() if "." in file.filename else ""
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"File extension '.{ext}' is not allowed. Allowed types: Images, PDF, Word, Excel, PowerPoint."
            )

        # 2. Read content & check size limit (50MB)
        content = await file.read()
        file_size = len(content)
        if file_size > MAX_FILE_SIZE_BYTES:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' exceeds maximum limit of 50MB ({round(file_size / (1024*1024), 2)}MB)."
            )

        # 3. Generate unique filename on disk
        unique_id = uuid.uuid4().hex[:10]
        safe_filename = f"{unique_id}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(UPLOAD_DIR, safe_filename)

        with open(file_path, "wb") as f:
            f.write(content)

        file_url = f"/static/uploads/{safe_filename}"
        cat = get_file_category(ext)

        results.append(FileMetadata(
            filename=safe_filename,
            original_name=file.filename,
            file_type=cat,
            extension=ext,
            size_bytes=file_size,
            size_mb=round(file_size / (1024 * 1024), 2),
            url=file_url,
            uploaded_at=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
        ))

    return results


@router.get("/list", response_model=List[FileMetadata])
def list_uploaded_files(current_user: User = Depends(get_current_active_user)):
    files_list = []
    if not os.path.exists(UPLOAD_DIR):
        return files_list

    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path):
            stat = os.stat(file_path)
            ext = filename.split(".")[-1].lower() if "." in filename else ""
            cat = get_file_category(ext)
            files_list.append(FileMetadata(
                filename=filename,
                original_name=filename.split("_", 1)[-1] if "_" in filename else filename,
                file_type=cat,
                extension=ext,
                size_bytes=stat.st_size,
                size_mb=round(stat.st_size / (1024 * 1024), 2),
                url=f"/static/uploads/{filename}",
                uploaded_at=datetime.fromtimestamp(stat.st_mtime).strftime("%Y-%m-%d %H:%M:%S")
            ))
    return sorted(files_list, key=lambda x: x.uploaded_at, reverse=True)


@router.delete("/{filename}")
def delete_file(filename: str, current_user: User = Depends(get_current_active_user)):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    os.remove(file_path)
    return {"message": f"File {filename} deleted successfully"}

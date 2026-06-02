import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_current_user
from app.core.config import settings
from app.models.models import User, Chatbot, DataSource
from app.schemas.schemas import DataSourceResponse, DataSourceTextCreate
from app.services.ingestion import (
    ensure_upload_dir, extract_text, chunk_text
)
from app.services.embedding_service import generate_embeddings
from app.services.vector_store import add_chunks, delete_source_chunks

router = APIRouter(prefix="/api/chatbots/{chatbot_id}/data-sources", tags=["Data Sources"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt", "md", "csv"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _get_user_chatbot(
    chatbot_id: uuid.UUID,
    db: Session,
    current_user: User
) -> Chatbot:
    """Helper: Get a chatbot that belongs to the current user."""
    chatbot = db.query(Chatbot).filter(
        Chatbot.id == chatbot_id,
        Chatbot.user_id == current_user.id
    ).first()

    if not chatbot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chatbot not found"
        )
    return chatbot


def _process_and_store(
    text: str,
    source: DataSource,
    chatbot_id: str,
    db: Session
):
    """
    Process extracted text: chunk it, embed it, store in vector DB.
    This is the core processing pipeline.
    """
    try:
        # Step 1: Chunk the text
        chunks = chunk_text(text)
        if not chunks:
            source.status = "failed"
            source.error_message = "No text content could be extracted"
            db.commit()
            return

        # Step 2: Generate embeddings for all chunks
        embeddings = generate_embeddings(chunks)

        # Step 3: Store in ChromaDB
        add_chunks(
            chatbot_id=chatbot_id,
            chunks=chunks,
            embeddings=embeddings,
            source_id=str(source.id),
            source_name=source.name
        )

        # Step 4: Update the data source record
        source.status = "ready"
        source.chunk_count = len(chunks)
        source.character_count = len(text)
        source.content_preview = text[:200].strip()
        db.commit()

    except Exception as e:
        source.status = "failed"
        source.error_message = str(e)[:500]
        db.commit()
        raise


@router.post("/upload", response_model=DataSourceResponse, status_code=201)
async def upload_file(
    chatbot_id: uuid.UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a file (PDF, DOCX, TXT) as a data source."""
    chatbot = _get_user_chatbot(chatbot_id, db, current_user)

    # Validate file extension
    filename = file.filename or "unknown.txt"
    extension = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '.{extension}' not supported. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read and validate file size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB"
        )

    # Save file to disk
    ensure_upload_dir()
    file_id = str(uuid.uuid4())
    save_path = os.path.join(settings.UPLOAD_DIR, f"{file_id}_{filename}")

    with open(save_path, "wb") as f:
        f.write(content)

    # Create database record
    data_source = DataSource(
        chatbot_id=chatbot.id,
        type="file",
        name=filename,
        original_filename=filename,
        file_path=save_path,
        status="processing"
    )
    db.add(data_source)
    db.commit()
    db.refresh(data_source)

    # Extract text and process
    try:
        text = extract_text(save_path, filename)

        if not text or len(text.strip()) < 10:
            data_source.status = "failed"
            data_source.error_message = "No readable text found in the file"
            db.commit()
            return DataSourceResponse.model_validate(data_source)

        _process_and_store(text, data_source, str(chatbot.id), db)

    except Exception as e:
        data_source.status = "failed"
        data_source.error_message = str(e)[:500]
        db.commit()

    db.refresh(data_source)
    return DataSourceResponse.model_validate(data_source)


@router.post("/text", response_model=DataSourceResponse, status_code=201)
def add_text_source(
    chatbot_id: uuid.UUID,
    source_data: DataSourceTextCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Add raw text as a data source (paste menu, FAQs, etc.)."""
    chatbot = _get_user_chatbot(chatbot_id, db, current_user)

    if not source_data.content or len(source_data.content.strip()) < 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content must be at least 20 characters"
        )

    # Create database record
    data_source = DataSource(
        chatbot_id=chatbot.id,
        type="text",
        name=source_data.name or "Pasted Text",
        status="processing"
    )
    db.add(data_source)
    db.commit()
    db.refresh(data_source)

    # Process the text
    try:
        _process_and_store(source_data.content, data_source, str(chatbot.id), db)
    except Exception as e:
        data_source.status = "failed"
        data_source.error_message = str(e)[:500]
        db.commit()

    db.refresh(data_source)
    return DataSourceResponse.model_validate(data_source)


@router.get("/", response_model=List[DataSourceResponse])
def list_data_sources(
    chatbot_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all data sources for a chatbot."""
    chatbot = _get_user_chatbot(chatbot_id, db, current_user)

    sources = db.query(DataSource).filter(
        DataSource.chatbot_id == chatbot.id
    ).order_by(DataSource.created_at.desc()).all()

    return [DataSourceResponse.model_validate(s) for s in sources]


@router.delete("/{source_id}", status_code=204)
def delete_data_source(
    chatbot_id: uuid.UUID,
    source_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a data source and its chunks from the vector database."""
    chatbot = _get_user_chatbot(chatbot_id, db, current_user)

    source = db.query(DataSource).filter(
        DataSource.id == source_id,
        DataSource.chatbot_id == chatbot.id
    ).first()

    if not source:
        raise HTTPException(status_code=404, detail="Data source not found")

    # Remove chunks from ChromaDB
    delete_source_chunks(str(chatbot.id), str(source.id))

    # Delete file from disk if it exists
    if source.file_path and os.path.exists(source.file_path):
        os.remove(source.file_path)

    # Delete from database
    db.delete(source)
    db.commit()

    return None
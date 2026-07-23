from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_db
from app.schemas.verification import VerificationResult
from app.services import verification as verification_service

router = APIRouter(prefix="/verification", tags=["verification"])


@router.post("", response_model=VerificationResult)
async def verify_listing(
    db: Annotated[AsyncSession, Depends(get_db)],
    property_id: Annotated[int, Form()],
    description: Annotated[str, Form()],
    image: Annotated[UploadFile, File()],
) -> VerificationResult:
    image_bytes = await image.read()
    return await verification_service.verify_property(
        db=db,
        property_id=property_id,
        description=description,
        image_bytes=image_bytes,
    )
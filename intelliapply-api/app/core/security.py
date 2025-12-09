from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from .config import supabase
import logging

log = logging.getLogger(__name__)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_current_user(token: str = Depends(oauth2_scheme)) -> str:
    """
    Dependency to get the current user from the Supabase JWT.
    Returns the user ID.
    """
    try:
        if not supabase:
             raise HTTPException(status_code=503, detail="Database not connected")

        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        # Return the user object (or just user.id if you prefer)
        return user.id
    except Exception as e:
        # Check if it's already an HTTPException
        if isinstance(e, HTTPException):
            raise e
            
        log.error(f"Auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

"""
Custom DRF Exception Handler
Provides consistent error responses across all API views
"""
from django.db import IntegrityError
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """
    Custom DRF exception handler that catches IntegrityError
    and returns a user-friendly JSON response instead of a 500 error page.
    """
    if isinstance(exc, IntegrityError):
        exc_message = str(exc)
        if 'duplicate key' in exc_message.lower() or 'unique constraint' in exc_message.lower():
            message = 'Data dengan nilai yang sama sudah ada. Silakan gunakan nilai lain.'
        elif 'not null' in exc_message.lower():
            message = 'Data tidak lengkap. Harap isi semua field yang wajib.'
        else:
            message = 'Terjadi kesalahan database. Silakan coba lagi.'

        return Response(
            {'message': message},
            status=status.HTTP_400_BAD_REQUEST
        )

    return exception_handler(exc, context)

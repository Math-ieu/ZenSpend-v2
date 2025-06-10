
from django.urls import path
from .views import *
from rest_framework_simplejwt.views import (
    TokenRefreshView, 
)

urlpatterns = [
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', UserLogoutView.as_view(), name='logout'),
    
    # Inscription et gestion de compte
    path('auth/register/', UserRegistrationView.as_view(), name='register'), 
]